import ACTIONS from "./actions"

function noopFn() {}
/**
 * adaptor:
 * 各组件适配器，控制何时触发actions['change', 'blur']
 * 组件created钩子触发时调用
 */
export default function createValidatable(adaptor = noopFn) {
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
        mounted() {
            adaptor.call(this, ACTIONS)
            if (this.formItem) {
                this.formItem.register(this)
            }
        },
        destroyed() {
            this.formItem && this.formItem.unregister(this)
        }
    }
}
