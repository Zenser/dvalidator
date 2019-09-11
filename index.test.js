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

test('async test', async () => {
  /* simple async rule */
  const asyncRule = {
    validator () {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve()
        }, 0)
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
  dvalidator(strValidator)()(person, 'name')
  person.name = '校验'

  await expect(person.$validate()).rejects.toEqual([
    {
      key: 'name',
      value: person.name,
      rule: { validator: strValidator },
      message: undefined
    }
  ])
})

test('decorator test', async () => {
  const nicknameRequiredMessage = 'nickname is required'
  const phoneRequiredMessage = 'phone is required'
  const phoneAsyncMessage = 'phone has been registered'
  const asyncRule = {
    validator () {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(phoneAsyncMessage)
        }, 0)
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

  await expect(user.$validate()).rejects.toEqual([
    {
      key: 'nickname',
      rule: Object.assign({}, requiredRule, {
        message: nicknameRequiredMessage
      }),
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
  await expect(user.$validate()).rejects.toEqual([
    {
      key: 'nickname',
      rule: Object.assign({}, requiredRule, {
        message: nicknameRequiredMessage
      }),
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

  // test filter
  await expect(user.$validate(key => key === 'nickname')).rejects.toEqual([
    {
      key: 'nickname',
      rule: Object.assign({}, requiredRule, {
        message: nicknameRequiredMessage
      }),
      message: nicknameRequiredMessage,
      value: user.nickname
    }
  ])

  class Group {
    @required("group name can't be empty")
    name = ''
    bestUser = null
  }

  const someGroup = new Group()
  someGroup.bestUser = user

  // test nest filter
  await expect(
    someGroup.$validate(key => /^bestUser\.nick/.test(key))
  ).rejects.toEqual([
    {
      key: 'bestUser.nickname',
      rule: Object.assign({}, requiredRule, {
        message: nicknameRequiredMessage
      }),
      message: nicknameRequiredMessage,
      value: user.nickname
    }
  ])
})
