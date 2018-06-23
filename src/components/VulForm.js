export default {
    name: 'vul-form',
    props: {
        value: Object,
        rules: Object
    },
    provide() {
        return {
            form: this
        }
    },
    created() {
        this.formItems = []
    },
    render(h) {
        return h('form', {
            attrs: {
                novalidate: true
            },
            nativeOn: {
                submit: e => e.preventDefault()
            }
        }, this.$slots.default)
    },
    methods: {
        validate(options = {
            trigger: null,
            firstField: false
        }) {
            const {trigger} = options
            if (options.firstField) {
                return Promise.resolve(this.formItems.every(i => i.validate(trigger)))
            } else {
                let result = true
                this.formItems.forEach(i => {
                    let valid = i.validate(trigger)
                    if (result) {
                        result = valid
                    }
                })
                return Promise.resolve(result)
            }
        },
        validateAndScroll(...args) {
            return this.validate(...args).then(valid => {
                if (!valid) {
                    this.formItems.every(item => {
                        if (!item.valid) {
                            item.$el.scrollIntoViewIfNeeded()
                            typeof item.invalidInput.focus === 'function' && item.invalidInput.focus()
                        }
                        return item.valid
                    })
                }
                return valid
            })
        },
        register(formItem) {
            this.formItems.push(formItem)
        },
        unregister(formItem) {
            this.formItems.splice(this.formItems.indexOf(formItem), 1)
        }
    }
}

