export function validate (rules, values) {
  if (Array.isArray(rules) && rules.length) {
    // exec in sequence
    return rules.slice(1).reduce((lastPromise, curentRule) => {
      return lastPromise.then(() => {
        return validItem(curentRule, values)
      })
    }, validItem(rules[0], values))
  } else if (typeof rules === 'object' && rules !== null) {
    return new Promise((resolve, reject) => {
      let keys = Object.keys(rules)
      let errors = []
      let finalLen = 0
      let length = keys.length
      keys.forEach(key => {
        validate(rules[key], values[key])
          .then(judge)
          .catch(error => {
            errors.push(error)
            judge()
          })
      })

      function judge () {
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

function validItem (rule, value) {
  let result
  let source = Object.assign({ value }, rule)
  if (!rule.validator) {
    result = true
  } else {
    // funciton validate
    result = rule.validator(value, source)
  }

  // thenable
  if (typeof result.then === 'function') {
    return result.catch(reason => {
      const res = { ...source, reason }
      if (typeof reason === 'string') {
        res.message = reason
      }
      throw res
    })
  }
  return result ? Promise.resolve() : Promise.reject(source)
}

export function createDecorator (rule) {
  if (!rule) {
    throw new Error('no rule provided')
  }
  if (typeof rule === 'function') {
    rule = { validator: rule }
  }

  return function decorator (args) {
    let newRule
    if (typeof args === 'string') {
      newRule = Object.assign({}, rule, { message: args || 'valid fail' })
    } else {
      newRule = Object.assign({}, rule, args)
    }

    return function decoratorResolve (target, property) {
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
          value: function $validate () {
            return validate(getRules(target), target)
          }
        })
      }
      if (target.__rules[property]) {
        target.__rules[property].push(newRule)
      } else {
        target.__rules[property] = [newRule]
      }
    }
  }
}

function getRules (val) {
  if (val && val.__rules) {
    let rules = Object.assign({}, val.__rules)
    Object.keys(val).forEach(k => {
      rules[k] = getRules(val[k]) || rules[k]
    })
    return rules
  }
}
