const rollup = require('rollup')
const minify = require('minify')
const config = require('../rollup.config')
const fs = require('fs')
const path = require('path')
function resolve(name) {
    return path.join(__dirname, '../', name)
}

async function build() {
    const bundle = await rollup.rollup(config)

    await bundle.write(config.output)

    minify(resolve(config.output.file), (error, data) => {
        if (error) {
            return console.error(error.message)
        }
        fs.writeFileSync(resolve(config.output.file.slice(0, -2) + 'min.js'), config.output.banner + data)
    })
}

build()
