import validator from '../validator'
import ACTIONS from '../actions'
import {validate} from '../helpers'
export default {
    name: 'vul-form-item',
    provide() {
        return {
            formItem: {
                register: this.register,
                unregister: this.unregister
            }
        }
    },
    inject: {
        form: {
            default: null
        }
    },
    props: {
        label: String,
        rules: [Array, Object], // [{trigger: 'blur', required: true, message: '请输入手机号码'}, {fn: 'cnmobile', trigger: 'blur', message: '手机号格式不正确'}]
        prop: String
    },
    created() {
        this.inputs = []
        if (this.form) {
            this.form && this.form.register(this)
        }
    },
    beforeDestroy() {
        this.form && this.form.unregister(this)
    },
    data() {
        return {
            valid: true,
            focusd: true,
            validMessage: '',
            invalidInput: null
        }
    },
    computed: {
        allRules() {
            const model = this.form && this.form.value
            return (
                this.rules ||
                (this.form && this.form.rules && this.form.rules[this.prop]) ||
                // single validate
                (model && model.__rules && model.__rules[this.prop]) ||
                // multipart validate
                (model && model[this.prop] && model[this.prop].__rules) ||
                []
            )
        },
        fixedValue() {
            const value = this.form && this.form.value || {}
            return this.prop ? value[this.prop] : value
        }
    },
    render(h) {
        const {label} = this
        return h('div', {
            staticClass: 'vul-form-item',
            'class': {error: !this.valid}
        }, [
            label ? h('label', {staticClass: 'vul-form-item-label'}, label) : null,
            this.$slots.default,
            h('span', {
                staticClass: 'vul-form-item-message', 
                directives: [{
                    name: 'show',
                    value: !this.valid,
                    expression: '!valid'
                }]
            }, this.validMessage)
        ])
    },
    methods: {
        validate(trigger, input = {}) {
            const rules = this.getFilterRules(trigger, input.prop)
            if (!rules) {
                return Promise.resolve()
            }

            return validate(rules, this.fixedValue).then(() => {
                this.valid = true
            }).catch(error => {
                this.valid = false
                this.validMessage = error.message
                return Promise.reject(error)
            })
        },
        validateOptionHandler(input) {
            // 解绑
            input.unBindTriggerWatchers && input.unBindTriggerWatchers()
            const cb = (trigger) => {
                this.valid = this.inputs.slice(0, this.inputs.indexOf(input) + 1).every(vm => {
                    return this.validate(trigger, vm)
                })
            }
            const onBlurCb = () => {
                this.focusd = false
                cb.call(this, 'blur')
            }
            const onChangeCb = () => {
                // 处理事件之外更新情况
                if (!this.focusd) {
                    cb.call(this, 'blur')
                    return
                }
                cb.call(this, 'change')
            }
            const onFocusCb = () => {
                this.focusd = true
            }
            input.$on(ACTIONS.BLUR, onBlurCb)
            input.$on(ACTIONS.FOCUS, onFocusCb)
            input.$on(ACTIONS.CHANGE, onChangeCb)
            input.unBindTriggerWatchers = () => {
                input.$off(ACTIONS.BLUR, onBlurCb)
                input.$off(ACTIONS.FOCUS, onFocusCb)
                input.$off(ACTIONS.CHANGE, onChangeCb)
            }
        },
        getFilterRules(trigger, name) {
            const noopArr = []
            let rules = this.allRules

            if (name) {
                rules = rules[name] || noopArr
            }

            if (Array.isArray(rules)) {
                return trigger
                    ? rules.filter(rule => {
                        return !rule.trigger || rule.trigger === trigger
                    })
                    : rules
            } else {
                return [rules]
            }
        },
        register(input) {
            this.validateOptionHandler(input)
            this.inputs.push(input)
        },
        unregister(input) {
            input.unBindTriggerWatchers && input.unBindTriggerWatchers()
            this.inputs.splice(this.inputs.indexOf(input), 1)
        }
    }
}
