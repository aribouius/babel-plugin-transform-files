import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { interpolateName } from 'loader-utils'

let config
const defaults = {
  name: '[name]-[hash].[ext]',
  extensions: []
}

export default function({ types: t }) {
  return {
    visitor: {
      CallExpression(path, state) {
        const { callee: { name }, arguments: [node] } = path.node

        if (name !== 'require' || !node || !t.isStringLiteral(node)) return

        config = config || (function() {
          const opts = { ...defaults, ...state.opts }
          opts.extensions = opts.extensions.map(ext => ext.replace('.', ''))
          return opts
        })()

        const ext = node.value.split('.').slice(-1).join('')
        if (config.extensions.indexOf(ext) === -1) return

        const file = resolve(dirname(state.file.opts.filename), node.value)
        const content = readFileSync(file)
        const ctx = { resourcePath: file }
        const out = interpolateName(ctx, config.name, { content, ...config })

        path.replaceWith(t.StringLiteral(out))
      }
    }
  }
}
