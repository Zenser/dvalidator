export default function dvalidator (...args) {
  if (args.length <= 2) {
    const rule = Object.assign({}, deserialize(args[0]), deserialize(args[1]))
    return dvalidator.bind(null, rule)
  }

  const [rule, target, property] = args
  if (!rule || typeof rule.validator !== 'function') {
    throw new Error('no rule validator provided')
  }

  return proxyRules(rule, target, property)
}

function validate (target) {
  return _validate(target, getRules(target))
}

function _validate (target, rules, attachedKey = '') {
  if (Array.isArray(rules) && rules.length) {
    // exec in sequence
    return rules.slice(1).reduce((lastPromise, curentRule) => {
      return lastPromise.then(() => {
        return validItem(target, curentRule, attachedKey)
      })
    }, validItem(target, rules[0], attachedKey))
  } else if (typeof rules === 'object' && rules !== null) {
    return new Promise((resolve, reject) => {
      let keys = Object.keys(rules)
      let errors = []
      let finalLen = 0
      let length = keys.length
      keys.forEach(key => {
        _validate(
          target[key],
          rules[key],
          attachedKey ? attachedKey + '.' + key : key
        )
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

function validItem (value, rule, key) {
  let result = rule.validator(value)
  const { message } = rule

  if (typeof result === 'boolean') {
    return result
      ? Promise.resolve()
      : Promise.reject({ key, value, message, rule })
  }

  return Promise.resolve(result).catch(res => {
    // format errorMessage
    const error = { key, value, message, rule, extra: res }
    if (typeof res === 'string') {
      error.message = res
    }
    throw error
  })
}

function proxyRules (rule, target, property) {
  if (!target.$rules) {
    Object.defineProperty(target, '$rules', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: Object.create(null)
    })
    Object.defineProperty(target, '$validate', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: validate.bind(null, target)
    })
  }
  if (target.$rules[property]) {
    target.$rules[property].push(rule)
  } else {
    target.$rules[property] = [rule]
  }
}

function deserialize (options) {
  if (typeof options === 'function') {
    return { validator: options }
  } else if (typeof options === 'string') {
    return { message: options || 'valid fail' }
  }
  return options
}

function getRules (val) {
  if (val && val.$rules) {
    let rules = Object.assign({}, val.$rules)
    Object.keys(val).forEach(k => {
      rules[k] = getRules(val[k]) || rules[k]
    })
    return rules
  }
}
