import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const nativeModule = require('./index.node')
const { detectLanguage } = nativeModule

export default {
  detectLanguage
}
