import createValidatable from './validatable'
export function mixinValidatable(component, option) {
    component.mixins = component.mixins || []
    component.mixins.push(createValidatable(option))
    return component
}
