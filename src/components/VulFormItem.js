import * as validator from '../validator'
import ACTIONS from '../actions'
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
            return (
                this.rules ||
                (this.form && this.form.rules && this.form.rules[this.prop]) ||
                []
            )
        },
        isMultipart() {
            return this.inputs.length > 1
        },
        fixedValue() {
            return this.form && this.form.value && this.form.value[this.prop]
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
            h('span', {staticClass: 'vul-form-item-message'}, this.validMessage)
        ])
    },
    methods: {
        validate(trigger) {
            this.valid = this.inputs.every(input => {
                let valid = this.validateItem(trigger, input)
                if (!valid) {
                    this.invalidInput = input
                }
                return valid
            })
            return this.valid
        },
        validateItem(trigger, input = {}) {
            const rules = this.getFilterRules(trigger, input.prop)
            let valid = true
            if (!rules || !rules.length) {
                return true
            }
            let value = this.fixedValue
            if (this.isMultipart) {
                if (!value) {
                    throw new Error(`formItem multipart value is not a object`)
                }
                value = value[input.prop]
            }

            // 对单条规则进行校验
            const validItemRule = (itemRule = {}) => {
                if (
                    itemRule.required &&
                    (value == null ||
                        value === '' ||
                        (Array.isArray(value) && !value.length))
                ) {
                    valid = false
                } else if (!itemRule.fn) {
                    valid = true
                } else if (typeof itemRule.fn === 'string') {
                    // 已定义公共规则校验
                    const validateKey = `${itemRule.fn}Check`
                    if (validateKey in validator) {
                        valid = validator[validateKey](value)
                    } else {
                        throw new Error(`${validateKey}无此校验函数`)
                    }
                } else {
                    // funciton校验
                    valid = itemRule.fn(value)
                }
                this.validMessage = itemRule && itemRule.message
                // console.log(`validItem`, itemRule, 'valid', valid)
                return valid
            }
            return rules.every(validItemRule)
        },
        validateOptionHandler(input) {
            // 解绑
            input.unBindTriggerWatchers && input.unBindTriggerWatchers()
            const cb = (trigger) => {
                this.valid = this.inputs.slice(0, this.inputs.indexOf(input) + 1).every(vm => {
                    return this.validateItem(trigger, vm)
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

            if (this.isMultipart) {
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
