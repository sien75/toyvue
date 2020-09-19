import Vue from '/vue.js'

export default new Vue({
    el: '#ele',
    data: {
        title1: 'this is a title',
        button1: 'Hello',
        model: 1,
        message: 'You clicked the button '
    },
    computed: {
        title2() {
            return this.title1 + ' too'
        },
        button2() {
            return 'Vue'
        }
    },
    methods: {
        show(e) {
            alert(this.message + '"' + e.target.innerText + '"');
        },
        plus() {
            this.model++;
        },
        minus() {
            this.model--;
        }
    }
})
