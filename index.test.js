import { createDecorator } from '.'

const requiredRule = {
  validator: val => val != null && val !== '',
  message: 'required'
}
const required = createDecorator(requiredRule)

test('base test', () => {
  /* simple one rules */
  const sku = {
    num: 2
  }
  required()(sku, 'num')

  expect(sku.__rules.num).toEqual([requiredRule])
  expect(sku.$validate()).resolves.toBe()

  sku.num = null
  expect(sku.$validate()).rejects.toEqual([{ ...requiredRule, value: sku.num }])

  /* multi rules */
  function limit ({ min = -Infinity, max = Infinity }) {
    return val => {
      return val > min && val < max
    }
  }
  const limitRule = limit({ min: 1, max: 10 })
  const limitMessage = 'num problem'
  createDecorator(limitRule)(limitMessage)(sku, 'num')
  sku.num = 2
  expect(sku.$validate()).resolves.toBe()

  sku.num = -1
  expect(sku.$validate()).rejects.toEqual([
    { message: limitMessage, validator: limitRule, value: sku.num }
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
  createDecorator(asyncRule)()(person, 'name')
  expect(person.$validate()).resolves.toBe()

  /* multi rules: async & sync */
  const strValidator = val => /^\w+$/i.test(val)
  createDecorator(strValidator)()(person, 'name')
  person.name = '校验'

  expect(person.$validate()).rejects.toEqual([
    { validator: strValidator, value: person.name }
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
    @(createDecorator(asyncRule)())
    @required(phoneRequiredMessage)
    phone: ''
  }

  expect(user.$validate()).rejects.toEqual([
    { ...requiredRule, message: nicknameRequiredMessage, value: user.nickname },
    { ...requiredRule, message: phoneRequiredMessage, value: user.phone }
  ])

  user.phone = '1333333'
  expect(user.$validate()).rejects.toEqual([
    { ...requiredRule, message: nicknameRequiredMessage, value: user.nickname },
    { ...asyncRule, message: phoneAsyncMessage, reason: phoneAsyncMessage, value: user.phone }
  ])
})
