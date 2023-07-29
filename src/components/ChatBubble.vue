<script setup lang="ts">
import { onUpdated } from 'vue'
import { type ChatCompletionResponseMessage } from 'openai'

import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { gfmHeadingId } from 'marked-gfm-heading-id'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

const props = defineProps<{
  chat: ChatCompletionResponseMessage
}>()

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'error', value: any): void
}>()

marked.use(gfmHeadingId())
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) != null ? lang : 'plaintext'

      return `
<pre class="hidden source-code" data-language="${language}">${encodeURIComponent(
        code
      )}</pre>
${hljs.highlight(code, { language }).value}
`.trim()
    }
  })
)

const purifier = DOMPurify()

marked.use({
  hooks: {
    postprocess(html) {
      const shadowDOM = document.createElement('div')
      shadowDOM.innerHTML = purifier.sanitize(html)

      for (const pre of shadowDOM.querySelectorAll('.hljs')) {
        // find element with source-code class
        const sourceCode = pre.querySelector('.source-code') as HTMLElement

        let code = ''
        let language = ''

        if (sourceCode != null) {
          code = sourceCode.innerHTML
          language = sourceCode.dataset.language ?? 'plaintext'

          pre.removeChild(sourceCode)
        }

        pre.innerHTML = pre.innerHTML.trim()

        const parent = pre.parentElement
        const grandparent = parent?.parentElement

        if (parent != null) {
          // wrap it in a div
          const div = document.createElement('div')

          div.innerHTML = `
<div class="code-highlight">
  <p class="text-sm text-gray-600 border-b pb-3 px-3 -mx-3">Language: ${language}</p>
    <pre class="overflow-auto w-full">
${pre.innerHTML}
    </pre>
  <div class="flex gap-2 items-center border-t pt-3 px-3 -mx-3">
    <div class="flex-1">
      <p class="text-sm text-gray-600">Use the code with caution.</p>
    </div>
    <button class="text-sm">
      Copy
    </button>
  </div>
</div>
          `.trim()

          const button = div.querySelector('button')
          if (button != null) {
            button.dataset.clipboardText = decodeURIComponent(code)
          }

          if (div.firstChild != null)
            grandparent?.replaceChild(div.firstChild, parent)
        }
      }

      for (const source of shadowDOM.querySelectorAll('.source-code')) {
        const sourceParent = source.parentElement
        // remove source
        if (sourceParent != null) {
          sourceParent.removeChild(source)
          sourceParent.innerHTML = sourceParent.innerHTML.trim()
        }
      }

      return shadowDOM.innerHTML
    }
  }
})

onUpdated(() => {
  const buttons = document.querySelectorAll('button[data-clipboard-text]')

  for (const button of buttons) {
    button.addEventListener('click', () => {
      copyToClipboard(
        (button as HTMLElement).dataset.clipboardText ?? ''
      ).catch((err) => {
        console.error(err)
      })
    })
  }
})

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    emit('success')
  } catch (err) {
    emit('error', err)
    console.error('Failed to copy: ', err)
  }
}
</script>
<template>
  <div class="flex flex-col items-start gap-1">
    <div
      :class="{ 'self-end': props.chat.role === 'assistant' }"
      class="flex items-center gap-2"
    >
      <div class="text-sm text-gray-600 flex-1">
        {{ props.chat.role }}
      </div>
      <button
        class="text-xs text-blue-400"
        @click="copyToClipboard(props.chat.content ?? '')"
      >
        Copy this content
      </button>
    </div>
    <div
      :class="{
        'self-end': props.chat.role === 'assistant',
        'border-blue-300': props.chat.role === 'user',
        'border-yellow-300': props.chat.role === 'assistant'
      }"
      class="border-2 rounded-md p-4 marked max-w-full overflow-x-auto"
      v-html="marked.parse(props.chat.content ?? '')"
    ></div>
  </div>
</template>
