# Dvalidator

[English edition](README_en.md)

> Dvalidator 是一个纯净、可扩展、非常有用的校验工具，它基于 Promise 和 Decorator 实现。

它有以下特性：

- <b>Object literals</b> : 执行时将添加一些不可枚举的属性保存在字面量对象中
- <b>Asynchronous</b> : 支持传递异步函数
- <b>Ordered</b> : 根据你定义的顺序，有序校验
- <b>Small</b> : 非常小巧，源码不超过 150 行

## 安装

```bash
npm install dvalidator --save
```

```bash
npm install @babel/plugin-proposal-decorators --save-dev
```

## 使用

配置 babel.config.js

```js
plugins: [
  [
    '@babel/plugin-proposal-decorators',
    {
      legacy: true
    }
  ]
];
```

<hr>

举个例子，我们将校验一个 user 对象。昵称和手机号是必选的，并且手机号需要发起一个远程校验。

我们可以这样写：

```js
import dvalidator from 'dvalidator';

const requiredRule = {
  validator: val => val != null && val !== '',
  message: 'required'
};
const required = dvalidator(requiredRule);
const checkPhone = dvalidator(value => fetch(`xxx/${value}`));

const user = {
  @required('nickname is required')
  nickname: '',
  @checkPhone('phone valid fail')
  @required
  phone: ''
};

user
  .$validate()
  .then(/* success */)
  .catch(reason => {
    /* fail */
    alert(reason[0].message);
  });
```

你可以把校验规则做一下封装，这样代码会更简洁。

## Api

#### dvalidator(rule) > 生成一个 Decorator

你需要传递规则进来，规则可以是一个函数，或者一个对象。
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
dvalidator(checkPhone)('msg1');
dvalidator(checkPhone)('msg2');

// 支持动态返回错误信息
dvalidator(() => {
  return Promise.reject(x ? 'msg1' : 'msg2');
});
```

#### \$validate() > 开始对象校验

把装饰器加入到对象上后，对象就是属于 “可校验对象”，你可以是对调用校验方法进行数据校验。

```js
// 返回 Promise
user.$validate().catch(error => {
  // 校验失败后，error 中会包含错误信息
  // 它的结构是一个数组，每一项中包含错误信息（message, key, value...等）
  // 如果你正在做表单校验需求，从这里可以把错误信息展示给用户
  // 如果你是一个 node server，这里可以做参数校验
});
```

## 接口声明文件

从这里可以看到更详细的结构信息！
[index.d.ts](lib/index.d.ts)
