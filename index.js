const dvalidator = legacyAdaptor((args0, args1) => {
  if (!args1 || args1[Symbol.toStringTag] !== 'Descriptor') {
    const rule = Object.assign({}, deserialize(args0), deserialize(args1))
    return dvalidator.bind(null, rule)
  }

  const rule = args0
  const { kind, key, initializer } = args1
  if (kind !== 'field') {
    throw new Error('dvalidator must apply on Class Field')
  }
  assertRule(rule)
  args1.initializer = function () {
    initializer.call(this)
    proxyRules(rule, this, key)
  }
  return args1
})

export default dvalidator

function legacyAdaptor (next) {
  return (...args) => {
    if (args.length >= 3) {
      const [rule, target, property] = args
      assertRule(rule)
      proxyRules(rule, target, property)
    } else {
      return next(...args)
    }
  }
}

function assertRule (rule) {
  if (!rule || typeof rule.validator !== 'function') {
    throw new Error('no rule validator provided')
  }
}

function validate (target, filter) {
  const rules = resolveRules(target, '', filter)
  return _validate(target, rules)
}

function _validate (target, rules, attachedKey = '') {
  const isRoot = attachedKey === ''
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
      const fields = {}
      let finalLen = 0
      let length = keys.length
      keys.forEach(key => {
        _validate(
          target[key],
          rules[key],
          isRoot ? key : attachedKey + '.' + key
        )
          .then(judge)
          .catch(res => {
            if (res.fields) {
              // flat nest obj
              fields[key] = res.fields
              errors = errors.concat(res.errors)
            } else {
              fields[key] = res
              errors.push(res)
            }
            judge()
          })
      })

      function judge () {
        if (++finalLen === length) {
          // finally
          if (errors.length) {
            reject({ errors, fields })
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

function resolveRules (val, key = '', filter = () => true) {
  if (!val || !val.$rules) {
    return
  }

  let rules = {}
  Object.keys(val).forEach(k => {
    const finalKey = key ? key + '.' + k : k
    const resolvedRules = resolveRules(val[k], finalKey, filter)

    // filter for dynamic select need validate data
    if (resolvedRules) {
      // nest rule
      rules[k] = resolvedRules
    } else if (filter(finalKey)) {
      // plain rule
      rules[k] = val.$rules[k]
    }
  })
  return rules
}
