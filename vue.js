class Vue {
    constructor({ el, data, methods, computed }) {
        globalThis.vm = this;//测试使用
        let that = this;

        el = document.querySelector(el);
        data = typeof data === 'object' && data ? data : {};
        methods = typeof methods === 'object' && methods ? methods : {};
        computed = typeof computed === 'object' && computed ? computed : {};

        if (el) {

            this.$el = el;
            this.$data = data;
            this.$methods = methods;
            this.$computed_functions = computed;
            this.$computed = {};
    
            this.initMethods();
            this.messenger = new Messenger();
            this.computer = new Computer({vm: that});
            new Observer({vm: that});
            new Compiler({vm: that});
        }
    }

    initMethods() {
        if(!globalThis.__VUE_FUNCTIONS) {
            globalThis.__VUE_FUNCTIONS = {};
        }
        for(let name in this.$methods) {
            globalThis.__VUE_FUNCTIONS[name] = this.$methods[name] = this[name] =
                this.$methods[name].bind(this);
        }
    }
}

class Compiler {

    constructor({vm}) {
        this.vm = vm;

        let fragment = document.createDocumentFragment();
        while(vm.$el.firstChild) fragment.appendChild(vm.$el.firstChild);
        this.compile(fragment);
        vm.$el.appendChild(fragment);
    }

    compile(node) {
        Array.prototype.slice.call(node.childNodes, 0).forEach(node => {
            if(node.nodeType === Node.ELEMENT_NODE) {
                this.compileElement(node);
                this.compile(node);
            }
            else if(node.nodeType === Node.TEXT_NODE) {
                this.compileText(node);
            }
        });
    }

    compileElement(node) {
        let normals = [], handlers = [];
        Array.prototype.slice.call(node.attributes, 0).forEach(({name, value}) => {
            if(/^v-bind:(\w+)$/.test(name)
                || /^:(\w+)$/.test(name)
            ) {
                normals.push({preAttrName: name, attrName: RegExp['$+'], varName: value});
            }
            else if(/^v-on:(\w+)$/.test(name)
                || /^@(\w+)$/.test(name)
            ) {
                handlers.push({preEventName: name, eventName: `on${RegExp['$+']}`, handlerName: value});
            }
            else if(/^v-model$/.test(name)) {
                globalThis.__VUE_FUNCTIONS[value] = (function(e) {this.vm[value] = e.target.value}).bind(this);
                normals.push({preAttrName: name, attrName: 'value', varName: value});
                handlers.push({preEventName: name, eventName: 'oninput', handlerName: value});
            }
        });
        this.replaceAttributes({normals, handlers, node});
    }

    compileText(node) {
        let templateExpr = node.nodeValue;
        let varValues = [];
        let reg = /\{\{(\w+)\}\}/g;
        let index = 0;
        let that = this;
        while(reg.exec(templateExpr)) {
            let innerIndex = index++;
            let varName = RegExp['$+'];
            varValues[innerIndex] = this.vm[varName];
            this.vm.messenger.subscribe({
                app: 'DOMRefresh',
                channel: varName,
                contact: {
                    noName: true,
                    callback() {
                        varValues[innerIndex] = that.vm[varName];
                        that.replaceText({varValues, templateExpr, node});
                    }
                }
            })
        }
        this.replaceText({varValues, templateExpr, node});
    }

    replaceAttributes({normals, handlers, node}) {
        let that = this;
        normals.forEach(({preAttrName, attrName, varName}) => {//删掉所有普通attribute, 设置新的property用以替代
            node.removeAttribute(preAttrName);
            let varValue = that.vm[varName];
            node[attrName] = varValue;
            this.vm.messenger.subscribe({
                app: 'DOMRefresh',
                channel: varName,
                contact: {
                    noName: true,
                    callback() {
                        let newVarValue = that.vm[varName];
                        node[attrName] = newVarValue;
                    }
                }
            });
        });
        handlers.forEach(({preEventName, eventName, handlerName}) => {//事件函数触发函数还是用新attribute替代
            node.removeAttribute(preEventName);
            let eventToDo = `__VUE_FUNCTIONS['${handlerName}'](event)`;
            node.setAttribute(eventName, eventToDo);
        });
    }

    replaceText({varValues, templateExpr, node}) {
        for(let varValue of varValues) {
            templateExpr = templateExpr.replace(/\{\{(\w+)\}\}/, varValue);
        }
        node.nodeValue = templateExpr;
    }
}

class Observer {
    constructor({vm}) {
        this.vm = vm;
        this.observe();
    }

    observe() {
        this.observeData();
        this.observeComputed();
    }

    observeData() {
        let that = this;
        for(let varName in this.vm.$data) {
            Object.defineProperty(this.vm, varName, {
                configurable: true,
                enumerable: true,
                set(v) {
                    if(v === that.vm.$data[varName]) return;
                    that.vm.$data[varName] = v;
                    that.vm.messenger.publish({app: 'DOMRefresh', channel: varName});
                    that.vm.computer.check({dataName: varName});
                },
                get() {
                    that.vm.computer.add({dataName: varName});
                    return that.vm.$data[varName];
                }
            });
        }
    }

    observeComputed() {
        let that = this;
        this.vm.computer.start();
        for(let name in this.vm.$computed_functions) {
            this.vm.$computed[name] = this.vm.$computed_functions[name].call(this.vm);
            this.vm.computer.clear({computedName: name});
        }
        this.vm.computer.stop();

        for(let varName in this.vm.$computed) {
            Object.defineProperty(this.vm, varName, {
                configurable: true,
                enumerable: true,
                set({_VUE_SET}) {
                    if(_VUE_SET) {
                        that.vm.messenger.publish({app: 'DOMRefresh', channel: varName});
                    }
                },
                get() {
                    return that.vm.$computed[varName];
                }
            });
        }
    }
}

class Computer {
    constructor({vm}) {
        this.vm = vm;
        this.state = false;
        this.dataNames = [];
    }
    
    start() {
        this.state = true;
    }

    stop() {
        this.state = false;
    }

    add({dataName}) {
        if(this.state) {
            this.dataNames.push(dataName);
        }
    }

    clear({computedName}) {
        let that = this;
        if(this.state) {
            let dataName;
            while(dataName = this.dataNames.shift()) {
                this.vm.messenger.subscribe({
                    app: 'computer',
                    channel: dataName,
                    contact: {
                        name: computedName,
                        callback() {
                            that.start();
                            that.vm.$computed[computedName] = that.vm.$computed_functions[computedName].call(that.vm);
                            that.clear({computedName});
                            that.stop();
                            that.vm[computedName] = {_VUE_SET: true};
                        }
                    }
                });
            }
        }
    }

    check({dataName}) {
        this.vm.messenger.publish({app: 'computer', channel: dataName});
    }
}

class Messenger {
    constructor() {
        this.server = {};
    }

    subscribe({app, channel, contact, contact: {name, noName}}) {
        if(!this.server[app]) {
            this.server[app] = {};
        }
        if(!this.server[app][channel]) {
            this.server[app][channel] = [];
        }
        if(noName) {
            this.server[app][channel].push(contact);
        }
        if(!this.server[app][channel].some(v => v.name === name)) {
            this.server[app][channel].push(contact);
        }
    }

    publish({app, channel}) {
        if(this.server[app][channel]) {
            for(let {callback} of this.server[app][channel]) {
                callback();
            }
        }
    }
}

export default Vue;