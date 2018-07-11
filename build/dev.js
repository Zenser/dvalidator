const rollup = require('rollup')
const path = require('path')
const pluginBabel = require('rollup-plugin-babel')
const pluginResolve = require('rollup-plugin-node-resolve')
const pluginReplace = require('rollup-plugin-replace')
// require 加载 browser-sync 模块
var bs = require("browser-sync").create();
function resolve(name) {
    return path.join(__dirname, '..', name || '')
}

const watchOptions = {
    context: resolve(),
    input: resolve('example/entry.js'),
    output: {
        file: resolve('example/boundle/boundle.js'),
        format: 'umd'
    },
    watch: {
        include: ['src/**', 'example/**'],
        exclude: ['example/boundle/**']
    },
    plugins: [
        pluginReplace({
            'process.env.NODE_ENV': JSON.stringify( 'development' )
        }),
        pluginResolve(),
        pluginBabel({
            exclude: 'node_modules/**' // 只编译我们的源代码
        })
    ]
}

const watcher = rollup.watch(watchOptions)

watcher.on('event', event => {
    if (event.code === 'END') {
        // 现在请BS，而不是方法
        // 主Browsersync模块出口
        bs.reload("*.html");
    }
})

async function build() {
    const bundle = await rollup.rollup(watchOptions)

    await bundle.write(config.output)
}

build()

console.log('start server...')
bs.init({
    server: resolve('example')
})
