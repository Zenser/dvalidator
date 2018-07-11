import validator from './validator'
import {validate} from './helpers'

export const decorators = {}

;['required'].concat(Object.keys(validator)).forEach(key => {
    let rule = {}
    key === 'required' ? rule.required = true : rule.fn = validator[key]
    decorators[key] = createDecorator(rule)
})

const defaultRule = {
    message: 'valid fail',
    fn: () => true
}
export function createDecorator(rule = defaultRule) {
    return function (args) {
        if (typeof args === 'string') {
            rule.message = args || 'valid fail'
        } else {
            Object.assign(rule, args)
        }
        
        return (target, property, descriptor) => {
            if (!target.__rules) {
                Object.defineProperty(target, '__rules', {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: Object.create(null)
                })
                Object.defineProperty(target, '$validate', {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value() {
                        return validate(getRules(target), target)
                    }
                })
            }
            if (target.__rules[property]) {
                target.__rules[property].push(rule)
            } else {
                target.__rules[property] = [rule]
            }
        }
    }
}

function getRules(val) {
    if (val && val.__rules) {
        let rules = Object.assign({}, val.__rules)
        Object.keys(val).forEach(k => {
            rules[k] = getRules(val[k]) || rules[k]
        })
        return rules
    }
}
