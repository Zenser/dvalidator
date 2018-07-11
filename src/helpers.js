import createValidatable from './mixins/validatable'
import validator from './validator'
export function mixinValidatable(component, option) {
    component.mixins = component.mixins || []
    component.mixins.push(createValidatable(option))
    return component
}

export function validate(rules, values) {
    if (Array.isArray(rules) && rules.length) {
        // exec in sequence
        return rules.slice(1).reduce((lastPromise, curentRule) => {
            return lastPromise.then(() => {
                return validItem(curentRule, values)
            })
        }, validItem(rules[0], values))
    } else if (typeof rules === 'object' && rules !== null) {
        return new Promise((resolve, reject) => {
            let keys = Object.keys(rules),
                errors = [],
                finalLen = 0,
                length = keys.length
            keys.forEach(key => {
                validate(rules[key], values[key]).then(judge).catch(error => {
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
    } else {
        return Promise.resolve()
    }
}

function validItem(rule, value) {
    let result
    let source = Object.assign({value}, rule)
    if (
        rule.required &&
        (value == null ||
            value === '' ||
            (Array.isArray(value) && !value.length))
    ) {
        result = false
    } else if (!rule.fn) {
        result = true
    } else if (typeof rule.fn === 'string') {
        // has defined validate
        const validateKey = rule.fn
        if (validateKey in validator) {
            result = validator[validateKey](value, source)
        } else {
            throw new Error(`not define ${validateKey} in validator`)
        }
    } else {
        // funciton validate
        result = rule.fn(value, source)
    }
    if (typeof result.then === 'function') {
        return result
    }
    return result ? Promise.resolve() : Promise.reject(source)
}
