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
    computed: {
        resolvedRules() {
            // __rules from decorator
            return this.rules || this.value && this.value.__rules
        }
    },
    methods: {
        validate(options = {
            trigger: null,
            firstField: false
        }) {
            const {trigger} = options
            if (options.firstField) {
                return Promise.all(this.formItems.map(i => i.validate(trigger)))
            } else {
                return new Promise((resolve, reject) => {
                    let errors = [], finalLen = 0, length = this.formItems.length
                    this.formItems.forEach(i => {
                        i.validate(trigger).then(judge).catch(error => {
                            errors.push(error)
                            judge()
                        })
                    })
                    function judge() {
                        if (++finalLen === length) {
                            // finally
                            if (errors.length) {
                                reject(errors)
                            } else {
                                resolve()
                            }
                        }
                    }
                })
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

