import VulForm from './components/VulForm'
import VulFormItem from './components/VulFormItem'
export {default as createValidatable} from './validatable'
export {default as ACTIONS} from './actions'
export * from './helpers'
export {VulForm, VulFormItem}

export function install(Vue) {
    Vue.component(VulForm.name, VulForm)
    Vue.component(VulFormItem.name, VulFormItem)
}
