import dvalidator from './index'

const requiredRule = {
  validator: val => val != null && val !== '',
  message: 'required'
}
const required = dvalidator(requiredRule)

test('base test', () => {
  /* simple one rules */
  const sku = {
    num: 2
  }
  required(sku, 'num')

  expect(sku.$rules.num).toEqual([requiredRule])
  expect(sku.$validate()).resolves.toBe()

  sku.num = null
  expect(sku.$validate()).rejects.toEqual([
    {
      key: 'num',
      value: sku.num,
      rule: requiredRule,
      message: requiredRule.message
    }
  ])

  /* multi rules */
  function limit ({ min = -Infinity, max = Infinity }) {
    return val => {
      return val > min && val < max
    }
  }
  const limitRule = limit({ min: 1, max: 10 })
  const limitMessage = 'num problem'
  dvalidator(limitRule)(limitMessage)(sku, 'num')
  sku.num = 2
  expect(sku.$validate()).resolves.toBe()

  sku.num = -1
  expect(sku.$validate()).rejects.toEqual([
    {
      key: 'num',
      value: sku.num,
      rule: { validator: limitRule, message: limitMessage },
      message: limitMessage
    }
  ])
})

test('async test', done => {
  /* simple async rule */
  const asyncRule = {
    validator () {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve()
          done()
        }, 0)
      })
    }
  }
  const person = {
    name: 'bar'
  }
  dvalidator(asyncRule)(person, 'name')
  expect(person.$validate()).resolves.toBe()

  /* multi rules: async & sync */
  const strValidator = val => /^\w+$/i.test(val)
  dvalidator(strValidator)()(person, 'name')
  person.name = '校验'

  expect(person.$validate()).rejects.toEqual([
    {
      key: 'name',
      value: person.name,
      rule: { validator: strValidator },
      message: undefined
    }
  ])
})

test('decorator test', done => {
  const nicknameRequiredMessage = 'nickname is required'
  const phoneRequiredMessage = 'phone is required'
  const phoneAsyncMessage = 'phone has been registered'
  const asyncRule = {
    validator () {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(phoneAsyncMessage)
          done()
        }, 0)
      })
    }
  }
  const user = {
    @required(nicknameRequiredMessage)
    nickname: '',
    @dvalidator(asyncRule)
    @required(phoneRequiredMessage)
    phone: ''
  }

  expect(user.$validate()).rejects.toEqual([
    {
      key: 'nickname',
      rule: Object.assign({}, requiredRule, { message: nicknameRequiredMessage }),
      message: nicknameRequiredMessage,
      value: user.nickname
    },
    {
      key: 'phone',
      rule: Object.assign({}, requiredRule, { message: phoneRequiredMessage }),
      message: phoneRequiredMessage,
      value: user.phone
    }
  ])

  user.phone = '1333333'
  expect(user.$validate()).rejects.toEqual([
    {
      key: 'nickname',
      rule: Object.assign({}, requiredRule, { message: nicknameRequiredMessage }),
      message: nicknameRequiredMessage,
      value: user.nickname
    },
    {
      key: 'phone',
      rule: asyncRule,
      message: phoneAsyncMessage,
      extra: phoneAsyncMessage,
      value: user.phone
    }
  ])
})
