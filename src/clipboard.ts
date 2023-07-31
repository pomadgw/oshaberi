import ClipboardJS from 'clipboard'
import mitt from 'mitt'

// create singleton instance of emitter
const emitter = mitt()

// create singleton instance of clipboard
const clipboard = new ClipboardJS('.js-copy-btn')

// listen to copy event
clipboard.on('success', (e) => {
  emitter.emit('success', e)
})

// listen to error event
clipboard.on('error', (e) => {
  emitter.emit('error', e)
})

export default emitter
