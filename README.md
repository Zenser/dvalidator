# vulidate

> A pure, extendable, very useful validator base Promise and Decorator

- Validate object literals
- Asynchronous
- Ordered

## Install

```bash
npm install vulidate --save
```

```bash
npm install @babel/plugin-proposal-decorators --save-dev
```

## Usage

config babel.config.js

```js
plugins: [
  [
    '@babel/plugin-proposal-decorators',
    {
      legacy: true
    }
  ]
]
```

For example, we validate a user object.
nickname and phone is required, also phone is validate from remote server.

```js
import vulidate from 'vulidate'

const requiredRule = {
  validator: val => val != null && val !== '',
  message: 'required'
}
const required = vulidate(requiredRule)
const checkPhone = vulidate((value) => fetch(`xxx/${value}`))

const user = {
  @required('nickname is required)
  nickname: '',
  @checkPhone('phone valid fail')
  @required('phone is required')
  phone: ''
}

user.$validate()
  .then(/* success */)
  .catch(reason => {
    /* fail */
    alert(reason[0].message)
  })
```

## Interface

arguments structure, describe with typescript interface.

```ts
interface vulidate {
  (rule: Validator | Rule): AppendDecorator
}

interface ProxyObject {
  readonly __rules: Map<string, Rule[]>
  readonly $validate(): Promise<ResolvedSource[]>
}

interface Decorator {
  (target: ProxyObject, property: string): void
}

interface AppendDecorator {
  (args: string | Rule | any): Decorator
}

interface Validator {
  (value: any, source: Source): boolean | Promise<any>
}

interface Rule {
  validator: Validator
  message?: string
}

interface Source extends Rule {
  value: any
}

interface ResolvedSource extends Source {
  reason?: any
}
```
