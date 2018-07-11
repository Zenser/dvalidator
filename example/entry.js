import Vue from '../node_modules/vue/dist/vue.esm.js'
import Vulidate, {decorators, createDecorator} from '../src/index'
window.Vue = Vue
Vue.config.productionTip = false
Vue.use(Vulidate)
const {cnname, required, cnmobile, limit} = decorators
const asyncValid = createDecorator({
    fn(value, source) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(source)
            }, 2000)
        })
    }
})
new Vue({
    el: '#app',
    data: {
        form: {
            @cnname('chinese name format is incorrect')
            @required()
            name: '',
            contact: {
                @asyncValid('your phone has exist')
                @cnmobile('chinese phone format is incorrect')
                @required('please input your phone')
                phone: '',
                @limit({min: 4, max: 20, message: 'limit in 4 to 20'})
                address: ''
            }
        },
        errors: null
    },
    watch: {
        form: {
            handler() {
                this.form.$validate().then(() => {
                    this.errors = null
                }).catch(errors => {
                    this.errors = errors
                })
            },
            deep: true,
            immediate: true
        }
    }
})

