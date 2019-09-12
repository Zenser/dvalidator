import dvalidator from './index'

const requiredRule = {
  validator: val => val != null && val !== '',
  message: 'required'
}
const required = dvalidator(requiredRule)

test('base test', async () => {
  /* simple one rules */
  const sku = {
    num: 2
  }
  required(sku, 'num')

  expect(sku.$rules.num).toEqual([requiredRule])
  await expect(sku.$validate()).resolves.toBe()

  sku.num = null
  let numError = {
    key: 'num',
    value: sku.num,
    rule: requiredRule,
    message: requiredRule.message
  }
  await expect(sku.$validate()).rejects.toEqual({
    errors: [numError],
    fields: { num: numError }
  })

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
  await expect(sku.$validate()).resolves.toBe()

  sku.num = -1
  numError = {
    key: 'num',
    value: sku.num,
    rule: { validator: limitRule, message: limitMessage },
    message: limitMessage
  }
  await expect(sku.$validate()).rejects.toEqual({
    errors: [numError],
    fields: { num: numError }
  })
})

test('async test', async () => {
  /* simple async rule */
  const asyncRule = {
    validator () {
      return new Promise(resolve => {
        resolve()
      })
    }
  }
  const person = {
    name: 'bar'
  }
  dvalidator(asyncRule)(person, 'name')
  await expect(person.$validate()).resolves.toBe()

  /* multi rules: async & sync */
  const strValidator = val => /^\w+$/i.test(val)
  dvalidator(strValidator)(person, 'name')
  person.name = '校验'

  let nameError = {
    key: 'name',
    value: person.name,
    rule: { validator: strValidator },
    message: undefined
  }
  await expect(person.$validate()).rejects.toEqual({
    errors: [nameError],
    fields: { name: nameError }
  })
})

test('decorator test', async () => {
  const nicknameRequiredMessage = 'nickname is required'
  const phoneRequiredMessage = 'phone is required'
  const phoneAsyncMessage = 'phone has been registered'
  const asyncRule = {
    validator () {
      return new Promise((resolve, reject) => {
        reject(phoneAsyncMessage)
      })
    }
  }

  class User {
    @required(nicknameRequiredMessage)
    nickname = ''
    @dvalidator(asyncRule)
    @required(phoneRequiredMessage)
    phone = ''
  }

  const user = new User()

  let nickNameError = {
    key: 'nickname',
    rule: Object.assign({}, requiredRule, {
      message: nicknameRequiredMessage
    }),
    message: nicknameRequiredMessage,
    value: user.nickname
  }
  let phoneError = {
    key: 'phone',
    rule: Object.assign({}, requiredRule, { message: phoneRequiredMessage }),
    message: phoneRequiredMessage,
    value: user.phone
  }
  await expect(user.$validate()).rejects.toEqual({
    errors: [nickNameError, phoneError],
    fields: { nickname: nickNameError, phone: phoneError }
  })

  user.phone = '1333333'

  phoneError = {
    key: 'phone',
    rule: asyncRule,
    message: phoneAsyncMessage,
    extra: phoneAsyncMessage,
    value: user.phone
  }
  await expect(user.$validate()).rejects.toEqual({
    errors: [nickNameError, phoneError],
    fields: { nickname: nickNameError, phone: phoneError }
  })

  // test filter
  await expect(user.$validate(key => key === 'nickname')).rejects.toEqual({
    errors: [nickNameError],
    fields: { nickname: nickNameError }
  })

  class Group {
    @required("group name can't be empty")
    name = ''
    bestUser = null
  }

  const someGroup = new Group()
  someGroup.bestUser = user

  // test nest filter
  let bestUserNickError = {
    key: 'bestUser.nickname',
    rule: Object.assign({}, requiredRule, {
      message: nicknameRequiredMessage
    }),
    message: nicknameRequiredMessage,
    value: user.nickname
  }
  await expect(
    someGroup.$validate(key => /^bestUser\.nick/.test(key))
  ).rejects.toEqual({
    errors: [bestUserNickError],
    fields: { bestUser: { nickname: bestUserNickError } }
  })
})
