# vulidate

> A pure, extendable, very useful validator base Promise and Decorator

- <b>Object literals</b> : Base es7 Decorator, we can add a decorator on a object literals. Vulidate will add some unenumerable keys to store rules.
- <b>Asynchronous</b> : Vulidate support async validator function
- <b>Ordered</b> : When you call `$validate` function, Vulidate will exec validator function in ordered.

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
<hr>
For example, we validate a user object. <br>
nickname and phone is required, also phone is validate from remote server.

```js
import vulidate from 'vulidate'

const requiredRule = {
  validator: val => val != null && val !== '',
  message: 'required'
}
const required = vulidate(requiredRule)
const checkPhone = vulidate(value => fetch(`xxx/${value}`))

const user = {
  @required('nickname is required')
  nickname: '',
  @checkPhone('phone valid fail')
  @required
  phone: ''
}

user
  .$validate()
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
