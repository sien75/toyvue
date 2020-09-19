# 🌱ToyVue
实现Vue的一小点基本功能, 造一个玩具车轮子!

### 🌱这是一个简单的Vue实现

大家都会用Vue, 但是有没有想过Vue是怎么实现的? 此项目就是要造一个玩具车轮子, 来实现Vue的一小点基本功能!

本项目的`index.html`文件和`main.js`文件超级简单, 就是非常常规的Vue使用方法. 如下:

HTML代码如下:
```html
    <div id="ele">
        <button :title="title1" @click="show">{{button1}}</button>
        <button :title="title2" @click="show">{{button2}}</button>
        <br><br>
        <input type="button" value="-" @click="minus">
        <input type="number" v-model="model">
        <input type="button" value="+" @click="plus">
    </div>
```

如果你会使用Vue, 就可以一眼看出来这一段代码的含义! JavaScript代码也很简单, 就是下面这样:
```js
new Vue({
    el: '#ele',
    data: {
        ...
    },
    computed: {
        ...
    },
    methods: {
        ...
    }
})
```

嗯, 我们就要造一个类. 名字叫`Vue`, 可以按照上面的用法使用! 具体来说功能如下:
- `v-bind:attr="value"`的单向属性绑定
- `:attr="value"`的单向属性绑定, 就是上一个的简写
- `v-on:event="handler"`的单向监听函数绑定
- `@event="handler"`的单向监听函数绑定, 就是上一个的简写
- `v-model="value"`双向属性绑定
- `{{variable}}`的单向模板传值

就是这么些功能, Vue的基础功能! 当然, 你不能这么用:
- `@event="handler()"`, 因为我只实现了值为监听函数名的情况
- `{{var1 + var2}}`, 因为我并没有实现在里面有表达式的情况

介绍就这么多, 下面看一下怎么使用!

### 🌱怎么使用呢

什么? 一个html文件, 两个js文件, 下载下来直接双击html文件就行了, 还需要教我怎么用?

不行的, 不行的... 这样打不开的, 当然这跟项目本身没关系, 而是我使用了ES6的module方法引入的JavaScript文件. 没错, 浏览器早就支持ES6的module了, 除非你用的是IE.

你应该注意到了, 我是通过
```html
    <script src="/main.js" type="module"></script>
```
```js
import Vue from '/vue.js'
```
这样的方式引入JavaScript文件的. 这种情况下, 直接双击打开index.html文件会被CORS策略阻止. 这时你需要在本地建立个服务器, 然后访问`localhost:port`就行了!

比如我使用了一个叫`ws`的npm包搭建本地服务器, 当然你完全可以用Web容器或Node.js服务器! 使用方法如下:
```shell
git clone https://github.com/sien75/ToyVue.git
cd ToyVue
npm i -g ws
ws
```

打开浏览器, 输入`http://127.0.0.1:8000/`, 就可以看到页面啦!

另外, 我把Vue实例绑定到了window.vm上了, 你可以直接通过`vm.a = 1`这样的方式设置data里面的属性.