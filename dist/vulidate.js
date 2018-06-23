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

        methods: {
            validate: function validate() {
                var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
                    trigger: null,
                    firstField: false
                };
                var trigger = options.trigger;

                if (options.firstField) {
                    return Promise.resolve(this.formItems.every(function (i) {
                        return i.validate(trigger);
                    }));
                } else {
                    var result = true;
                    this.formItems.forEach(function (i) {
                        var valid = i.validate(trigger);
                        if (result) {
                            result = valid;
                        }
                    });
                    return Promise.resolve(result);
                }
            },
            validateAndScroll: function validateAndScroll() {
                var _this = this;

                return this.validate.apply(this, arguments).then(function (valid) {
                    if (!valid) {
                        _this.formItems.every(function (item) {
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

    function cnmobileCheck(value) {
        return CN_MOBIIE_REGEXP.test(value);
    }

    function cnnameCheck(value) {
        return (/^[*\u4E00-\u9FA5]{1,8}(?:[·•]{1}[\u4E00-\u9FA5]{2,10})*$/.test(value)
        );
    }

    function fixedtelCheck(value) {
        return FIXED_TEL_REGEXP.test(value);
    }
    // added verfication of bankcard http://blog.csdn.net/mytianhe/article/details/18256925
    function bankcardCheck(cardNo) {
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

    function idCardCheck(val) {
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

    function passwordCheck(password) {
        password = password + '';
        return password.length > 6 && /\d+/.test(password) && /[a-z]+/.test(password);
    }

    function smsCodeCheck(value) {
        return (/[0-9]{4,6}/.test(value)
        );
    }

    var validator = /*#__PURE__*/Object.freeze({
        cnmobileCheck: cnmobileCheck,
        cnnameCheck: cnnameCheck,
        fixedtelCheck: fixedtelCheck,
        bankcardCheck: bankcardCheck,
        idCardCheck: idCardCheck,
        passwordCheck: passwordCheck,
        smsCodeCheck: smsCodeCheck
    });

    var ACTIONS = {
        BLUR: "vul.blur",
        FOCUS: "vul.focus",
        CHANGE: "vul.change"
    };

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
                return this.rules || this.form && this.form.rules && this.form.rules[this.prop] || [];
            },
            isMultipart: function isMultipart() {
                return this.inputs.length > 1;
            },
            fixedValue: function fixedValue() {
                return this.form && this.form.value && this.form.value[this.prop];
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
            validate: function validate(trigger) {
                var _this = this;

                if (this.isMultipart) {
                    this.valid = this.inputs.every(function (input) {
                        var valid = _this.validateItem(trigger, input);
                        if (!valid) {
                            _this.invalidInput = input;
                        }
                        return valid;
                    });
                } else {
                    this.valid = this.validateItem(trigger);
                }
                return this.valid;
            },
            validateItem: function validateItem(trigger) {
                var _this2 = this;

                var input = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                var rules = this.getFilterRules(trigger, input.prop);
                var valid = true;
                if (!rules || !rules.length) {
                    return true;
                }
                var value = this.fixedValue;
                if (this.isMultipart) {
                    if (!value) {
                        throw new Error('formItem multipart value is not a object');
                    }
                    value = value[input.prop];
                }

                // 对单条规则进行校验
                var validItemRule = function validItemRule() {
                    var itemRule = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                    if (itemRule.required && (value == null || value === '' || Array.isArray(value) && !value.length)) {
                        valid = false;
                    } else if (!itemRule.fn) {
                        valid = true;
                    } else if (typeof itemRule.fn === 'string') {
                        // 已定义公共规则校验
                        var validateKey = itemRule.fn + 'Check';
                        if (validateKey in validator) {
                            valid = validator[validateKey](value);
                        } else {
                            throw new Error(validateKey + '\u65E0\u6B64\u6821\u9A8C\u51FD\u6570');
                        }
                    } else {
                        // funciton校验
                        valid = itemRule.fn(value);
                    }
                    _this2.validMessage = itemRule && itemRule.message;
                    // console.log(`validItem`, itemRule, 'valid', valid)
                    return valid;
                };
                return rules.every(validItemRule);
            },
            validateOptionHandler: function validateOptionHandler(input) {
                var _this3 = this;

                // 解绑
                input.unBindTriggerWatchers && input.unBindTriggerWatchers();
                var cb = function cb(trigger) {
                    _this3.valid = _this3.inputs.slice(0, _this3.inputs.indexOf(input) + 1).every(function (vm) {
                        return _this3.validateItem(trigger, vm);
                    });
                };
                var onBlurCb = function onBlurCb() {
                    _this3.focusd = false;
                    cb.call(_this3, 'blur');
                };
                var onChangeCb = function onChangeCb() {
                    // 处理事件之外更新情况
                    if (!_this3.focusd) {
                        cb.call(_this3, 'blur');
                        return;
                    }
                    cb.call(_this3, 'change');
                };
                var onFocusCb = function onFocusCb() {
                    _this3.focusd = true;
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

                if (this.isMultipart) {
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

    function mixinValidatable(component, option) {
        component.mixins = component.mixins || [];
        component.mixins.push(createValidatable(option));
        return component;
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
    exports.mixinValidatable = mixinValidatable;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
