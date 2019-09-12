# Dvalidator

[English edition](README_en.md)

> Dvalidator 是一个纯净、可扩展、非常有用的校验工具，它基于 Promise 和 Decorator 实现。

它有以下特性：

- <b>Compatibility</b> : 同时支持最新版 Decorator 用法和老版用法
- <b>Asynchronous</b> : 支持传递异步函数
- <b>Ordered</b> : 根据你定义的顺序，有序校验
- <b>Small</b> : 小巧，源码不超过 200 行
- <b>Easy</b> : 使用简单，仅仅只有 2 个 Api

## 起步

```bash
npm install dvalidator --save
```

```bash
npm install @babel/plugin-proposal-decorators --save-dev
```

配置 babel.config.js

```js
plugins: [
  [
    '@babel/plugin-proposal-decorators',
    {
      // Dvalidator 支持最新的 Decorator 提案（legacy: false）
      // 同样也支持旧版的 (legacy: true)，Decorator 可以作用于字面量对象
      // 按照你的喜好设置，推荐使用最新的提案
    }
  ]
];
```

## 使用

假设我们有这样一个需求，我们将校验一个 user 对象，昵称和手机号是必选的，并且手机号需要发起一个服务端远程校验。

使用 Dvalidator，我们可以这样写：

```js
// common.js
import dvalidator from 'dvalidator';

const requiredRule = {
  validator: val => val != null && val !== '',
  message: 'required'
};
const required = dvalidator(requiredRule);
const checkPhone = dvalidator(value => fetch(`xxx/${value}`));

// user-signup.js
class User {
  @required('nickname is required')
  nickname = '';
  @checkPhone('phone valid fail')
  @required
  phone = '';
}
const user = new User();

user
  .$validate()
  .then(/* success */)
  .catch(({ errors, fields }) => {
    /* fail */
    alert(errors[0].message);
    // errors 包含每个属性的错误信息，结构一致，嵌套对象会拍平
    // fields 以对象形式获取错误信息，一般用于展示表单中每一栏的错误信息
  });
```

你可以把校验规则做一下封装，写在单独的文件里，这样业务代码会非常简洁。

## Api

#### dvalidator(rule: string | Function | Rule): Dvalidator

<small>一个类柯里化函数，你可以调用无限次去丰富规则或者覆盖规则。</small>

你需要传递规则进来，规则可以是一个函数（校验方法），字符串（错误信息），对象（包含以上两者的集合）。

例如：

```js
dvalidator({
  validator: val => {
    // 你的校验部分代码
    // 可以返回 Boolean（同步校验） 或者 Promise（异步校验）
  },
  // 校验出错时会返回给你
  message: ''
});
```

一个校验规则想要返回不同错误信息：

```js
// 传递不同的 message
dvalidator(checkPhone)('msg1');
dvalidator(checkPhone)('msg2');
```

```js
// 也可以动态返回错误信息
dvalidator(() => {
  return Promise.reject(x ? 'msg1' : 'msg2');
});
```

#### \$validate(filter?: Function): Promise<ValidateError | void>

把装饰器加入到对象上后，对象就是属于 “可校验对象”，你可以此方法进行数据校验。filter 是一个用来过滤属性的方法，我们可以用它做一些动态校验。

```js
// 返回 Promise
user
  .$validate(fieldKey => {
    // 这里可以定义你的过滤逻辑
    // 如果是嵌套的对象，那么 fieldKey 会做拼接
    // 例如 user: { like: { game: 'lol' } }，只想校验 like.game 的时候，你可以这样写
    return /^like\.game/.test(fieldKey);
  })
  .catch(({ errors, fields }) => {
    // xxx
  });
```

## 接口声明文件

从这里可以看到更详细的结构信息！
[index.d.ts](lib/index.d.ts)

## And More

Enjoy it!