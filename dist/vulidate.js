/*!
* Vulidate.js v0.1.0
* (c) 2018 张帅
* Released under the MIT License.
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.vulidate = {})));
}(this, (function (exports) { 'use strict';

    var VulForm = {
        name: 'vul-form',
        props: {
            value: Object,
            rules: Object
        },
        provide: function provide() {
            return {
                form: this
            };
        },
        created: function created() {
            this.formItems = [];
        },
        render: function render(h) {
            return h('form', {
                attrs: {
                    novalidate: true
                },
                nativeOn: {
                    submit: function submit(e) {
                        return e.preventDefault();
                    }
                }
            }, this.$slots.default);
        },

        computed: {
            resolvedRules: function resolvedRules() {
                // __rules from decorator
                return this.rules || this.value && this.value.__rules;
            }
        },
        methods: {
            validate: function validate() {
                var _this = this;

                var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
                    trigger: null,
                    firstField: false
                };
                var trigger = options.trigger;

                if (options.firstField) {
                    return Promise.all(this.formItems.map(function (i) {
                        return i.validate(trigger);
                    }));
                } else {
                    return new Promise(function (resolve, reject) {
                        var errors = [],
                            finalLen = 0,
                            length = _this.formItems.length;
                        _this.formItems.forEach(function (i) {
                            i.validate(trigger).then(judge).catch(function (error) {
                                errors.push(error);
                                judge();
                            });
                        });
                        function judge() {
                            if (++finalLen === length) {
                                // finally
                                if (errors.length) {
                                    reject(errors);
                                } else {
                                    resolve();
                                }
                            }
                        }
                    });
                }
            },
            validateAndScroll: function validateAndScroll() {
                var _this2 = this;

                return this.validate.apply(this, arguments).then(function (valid) {
                    if (!valid) {
                        _this2.formItems.every(function (item) {
                            if (!item.valid) {
                                item.$el.scrollIntoViewIfNeeded();
                                typeof item.invalidInput.focus === 'function' && item.invalidInput.focus();
                            }
                            return item.valid;
                        });
                    }
                    return valid;
                });
            },
            register: function register(formItem) {
                this.formItems.push(formItem);
            },
            unregister: function unregister(formItem) {
                this.formItems.splice(this.formItems.indexOf(formItem), 1);
            }
        }
    };

    var CN_MOBIIE_REGEXP = /^(\+?0?86-?)?1[3456789]\d{9}$/;
    var FIXED_TEL_REGEXP = /^(0[0-9]{2,3}-)?([1-9][0-9]{6,7})+(-[0-9]{1,4})?$/;

    function cnmobile(value) {
        return CN_MOBIIE_REGEXP.test(value);
    }

    function cnname(value) {
        return (/^[*\u4E00-\u9FA5]{1,8}(?:[·•]{1}[\u4E00-\u9FA5]{2,10})*$/.test(value)
        );
    }

    function fixedtel(value) {
        return FIXED_TEL_REGEXP.test(value);
    }
    // added verfication of bankcard http://blog.csdn.net/mytianhe/article/details/18256925
    function bankcard(cardNo) {
        cardNo = ('' + cardNo).replace(/\s/gi, '');
        var len = cardNo.length;
        if (!/\d+/.test(cardNo) || len < 9) {
            return false;
        }
        cardNo = cardNo.split('');
        var checkCode = parseInt(cardNo[len - 1]);
        var sum = 0;
        for (var i = len - 2, j = 0; i >= 0; i--, j++) {
            var it = parseInt(cardNo[i]);
            if (j % 2 === 0) {
                it *= 2;
                it = parseInt(it / 10) + parseInt(it % 10);
            }
            sum += parseInt(it);
        }

        if ((sum + checkCode) % 10 === 0) {
            return true;
        } else {
            return false;
        }
    }

    function idCard(val) {
        if (/^\d{17}[0-9xX]$/.test(val)) {
            var vs = '1,0,x,9,8,7,6,5,4,3,2'.split(',');
            var ps = '7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2'.split(',');
            var ss = val.toLowerCase().split('');
            var r = 0;
            for (var i = 0; i < 17; i++) {
                r += ps[i] * ss[i];
            }
            return vs[r % 11] === ss[17];
        }
    }

    var validator = {
        cnmobile: cnmobile,
        cnname: cnname,
        fixedtel: fixedtel,
        bankcard: bankcard,
        idCard: idCard
    };

    function registValidator(fn) {
        validator[fn.name] = fn;
    }

    var ACTIONS = {
        BLUR: "vul.blur",
        FOCUS: "vul.focus",
        CHANGE: "vul.change"
    };

    function noopFn() {}
    /**
     * adaptor:
     * 各组件适配器，控制何时触发actions['change', 'blur']
     * 组件created钩子触发时调用
     */
    function createValidatable() {
        var adaptor = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : noopFn;

        return {
            name: 'vul-validatable',
            inject: {
                formItem: {
                    default: null
                }
            },
            props: {
                prop: String
            },
            mounted: function mounted() {
                adaptor.call(this, ACTIONS);
                if (this.formItem) {
                    this.formItem.register(this);
                }
            },
            destroyed: function destroyed() {
                this.formItem && this.formItem.unregister(this);
            }
        };
    }

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
    function mixinValidatable(component, option) {
        component.mixins = component.mixins || [];
        component.mixins.push(createValidatable(option));
        return component;
    }

    function validate(rules, values) {
        var _this = this;

        if ((typeof rules === 'undefined' ? 'undefined' : _typeof(rules)) === 'object' && rules !== null) {
            return new Promise(function (resolve, reject) {
                var keys = Object.keys(rules),
                    errors = [],
                    finalLen = 0,
                    length = _this.formItems.length;
                keys.forEach(function (key) {
                    validate(rules[key], values[key]).then(judge).catch(function (error) {
                        errors.push(error);
                        judge();
                        return Promise.reject(error);
                    });
                });

                function judge() {
                    if (++finalLen === length) {
                        // finally
                        if (errors.length) {
                            reject(errors);
                        } else {
                            resolve();
                        }
                    }
                }
            });
        } else if (Array.isArray(rules) && rules.length) {
            // exec in sequence
            return rules.slice(1).reduce(function (lastPromise, curentRule) {
                return lastPromise.then(function () {
                    validItem(curentRule, values);
                });
            }, validItem(rules[0], values));
        } else {
            return Promise.reject(new Error('rules type should be object or array'));
        }
    }

    function validItem(rule, value) {
        var result = void 0;
        if (rule.required && (value == null || value === '' || Array.isArray(value) && !value.length)) {
            result = false;
        } else if (!rule.fn) {
            result = true;
        } else if (typeof rule.fn === 'string') {
            // 已定义公共规则校验
            var validateKey = rule.fn;
            if (validateKey in validator) {
                result = validator[validateKey](value);
            } else {
                throw new Error('not define ' + validateKey + ' in validator');
            }
        } else {
            // funciton校验
            result = rule.fn(value);
        }
        if (result.then) {
            return result;
        }
        return result ? Promise.resolve() : Promise.reject(Object.assign({}, rule));
    }

    var VulFormItem = {
        name: 'vul-form-item',
        provide: function provide() {
            return {
                formItem: {
                    register: this.register,
                    unregister: this.unregister
                }
            };
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
        created: function created() {
            this.inputs = [];
            if (this.form) {
                this.form && this.form.register(this);
            }
        },
        beforeDestroy: function beforeDestroy() {
            this.form && this.form.unregister(this);
        },
        data: function data() {
            return {
                valid: true,
                focusd: true,
                validMessage: '',
                invalidInput: null
            };
        },

        computed: {
            allRules: function allRules() {
                var model = this.form && this.form.value;
                return this.rules || this.form && this.form.rules && this.form.rules[this.prop] ||
                // single validate
                model && model.__rules && model.__rules[this.prop] ||
                // multipart validate
                model && model[this.prop] && model[this.prop].__rules || [];
            },
            fixedValue: function fixedValue() {
                var value = this.form && this.form.value || {};
                return this.prop ? value[this.prop] : value;
            }
        },
        render: function render(h) {
            var label = this.label;

            return h('div', {
                staticClass: 'vul-form-item',
                'class': { error: !this.valid }
            }, [label ? h('label', { staticClass: 'vul-form-item-label' }, label) : null, this.$slots.default, h('span', {
                staticClass: 'vul-form-item-message',
                directives: [{
                    name: 'show',
                    value: !this.valid,
                    expression: '!valid'
                }]
            }, this.validMessage)]);
        },

        methods: {
            validate: function validate$$1(trigger) {
                var _this = this;

                var input = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                var rules = this.getFilterRules(trigger, input.prop);
                if (!rules) {
                    return Promise.resolve();
                }

                return validate(rules, this.fixedValue).then(function () {
                    _this.valid = true;
                }).catch(function (error) {
                    _this.valid = false;
                    _this.validMessage = error.message;
                    return Promise.reject(error);
                });
            },
            validateOptionHandler: function validateOptionHandler(input) {
                var _this2 = this;

                // 解绑
                input.unBindTriggerWatchers && input.unBindTriggerWatchers();
                var cb = function cb(trigger) {
                    _this2.valid = _this2.inputs.slice(0, _this2.inputs.indexOf(input) + 1).every(function (vm) {
                        return _this2.validate(trigger, vm);
                    });
                };
                var onBlurCb = function onBlurCb() {
                    _this2.focusd = false;
                    cb.call(_this2, 'blur');
                };
                var onChangeCb = function onChangeCb() {
                    // 处理事件之外更新情况
                    if (!_this2.focusd) {
                        cb.call(_this2, 'blur');
                        return;
                    }
                    cb.call(_this2, 'change');
                };
                var onFocusCb = function onFocusCb() {
                    _this2.focusd = true;
                };
                input.$on(ACTIONS.BLUR, onBlurCb);
                input.$on(ACTIONS.FOCUS, onFocusCb);
                input.$on(ACTIONS.CHANGE, onChangeCb);
                input.unBindTriggerWatchers = function () {
                    input.$off(ACTIONS.BLUR, onBlurCb);
                    input.$off(ACTIONS.FOCUS, onFocusCb);
                    input.$off(ACTIONS.CHANGE, onChangeCb);
                };
            },
            getFilterRules: function getFilterRules(trigger, name) {
                var noopArr = [];
                var rules = this.allRules;

                if (name) {
                    rules = rules[name] || noopArr;
                }

                if (Array.isArray(rules)) {
                    return trigger ? rules.filter(function (rule) {
                        return !rule.trigger || rule.trigger === trigger;
                    }) : rules;
                } else {
                    return [rules];
                }
            },
            register: function register(input) {
                this.validateOptionHandler(input);
                this.inputs.push(input);
            },
            unregister: function unregister(input) {
                input.unBindTriggerWatchers && input.unBindTriggerWatchers();
                this.inputs.splice(this.inputs.indexOf(input), 1);
            }
        }
    };

    var decorators = {};['required'].concat(Object.keys(validator)).forEach(function (key) {
        decorators[key] = decoratorFactory(key);
    });

    function decoratorFactory(key) {
        return function () {
            var message = arguments[0] || 'valid fail';
            var trigger = arguments[1];
            return function (target, property, descriptor) {
                if (!target.__rules) {
                    Object.defineProperty(target, '__rules', {
                        enumerable: false,
                        configurable: false,
                        writable: true,
                        value: Object.create(null)
                    });
                    Object.defineProperty(target, '$validate', {
                        enumerable: false,
                        configurable: false,
                        writable: false,
                        value: function value() {
                            return new Promise(function (resolve, reject) {
                                var keys = Object.keys(target),
                                    length = keys.filter(function (key) {
                                    var $validate = target[key].$validate;
                                    if ($validate) {
                                        $validate().then(judge).catch(function (error) {
                                            errors.push(error);
                                            judge();
                                        });
                                    }
                                    return !!$validate;
                                }).length + 1,
                                    finalLen = 0,
                                    errors = [];
                                validate(target, target.__rules).then(judge).catch(function (error) {
                                    errors.push(error);
                                    judge();
                                });
                                function judge() {
                                    if (++finalLen === length) {
                                        // finally
                                        if (errors.length) {
                                            reject(errors);
                                        } else {
                                            resolve();
                                        }
                                    }
                                }
                            });
                        }
                    });
                }
                var rule = {
                    message: message
                };
                key === 'required' ? rule.required = true : rule.fn = validator[key];
                trigger && (rule.trigger = trigger);
                if (target.__rules[property]) {
                    target.__rules[property].push(rule);
                } else {
                    target.__rules[property] = [rule];
                }
            };
        };
    }

    function install(Vue) {
        Vue.component(VulForm.name, VulForm);
        Vue.component(VulFormItem.name, VulFormItem);
    }

    exports.VulForm = VulForm;
    exports.VulFormItem = VulFormItem;
    exports.install = install;
    exports.createValidatable = createValidatable;
    exports.ACTIONS = ACTIONS;
    exports.registValidator = registValidator;
    exports.decorators = decorators;
    exports.mixinValidatable = mixinValidatable;
    exports.validate = validate;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
