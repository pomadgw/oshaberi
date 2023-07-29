<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { gfmHeadingId } from 'marked-gfm-heading-id'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

import {
  type CreateChatCompletionResponse,
  type ChatCompletionResponseMessage,
  type CreateChatCompletionRequest
} from 'openai'

import axios, { type AxiosResponse } from 'axios'
import debounce from 'lodash/debounce'

import CSettings from './components/CSettings.vue'
import CToast from './components/CToast.vue'
import CButton from './components/CButton.vue'
import { type ComputedRef, computed, onUpdated, ref, watch } from 'vue'
import { useChatGPTSetting } from './store'
import useLoading from './hooks/useLoading'

const store = useChatGPTSetting()

const isToastOpen = ref(false)
const toastText = ref('')

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    toastText.value = 'Content copied to clipboard'
    isToastOpen.value = true
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}

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

const dialogOpen = ref(false)

const openSettings = (): void => {
  dialogOpen.value = true
}

const userMessage = ref('')
const userMessages = ref<ChatCompletionResponseMessage[]>([])
const userMessagesTokenLength = ref(0)

const systemMessage: ComputedRef<ChatCompletionResponseMessage[]> = computed(
  () => {
    return store.system !== ''
      ? [{ role: 'system', content: store.system }]
      : []
  }
)

const clearChat = (): void => {
  userMessages.value = []
  userMessage.value = ''
}

const { isLoading: isLoadingTokensLength, call: getTokensLength } = useLoading(
  async (): Promise<void> => {
    const result: AxiosResponse<{ tokens: number }> = await axios.post(
      '/api/chat/tokens',
      [
        ...systemMessage.value,
        ...userMessages.value,
        {
          role: 'user',
          content: userMessage.value
        }
      ]
    )

    userMessagesTokenLength.value = result.data.tokens
  }
)

watch(
  () => [...systemMessage.value, ...userMessages.value, userMessage.value],
  debounce(async () => {
    await getTokensLength()
  }, 100)
)

// reversed to show latest message at the bottom
const reversedUserMessages = computed(() =>
  userMessages.value.slice().reverse()
)

const send = async (isResend = false): Promise<void> => {
  if (!isResend) {
    userMessages.value = [
      ...userMessages.value,
      {
        role: 'user',
        content: userMessage.value
      }
    ]
    userMessage.value = ''
  }

  const messages: ChatCompletionResponseMessage[] = [
    ...systemMessage.value,
    ...userMessages.value
  ]

  const params: CreateChatCompletionRequest = {
    model: store.model,
    messages,
    temperature: store.temperature,
    max_tokens: store.maxTokens === 0 ? undefined : store.maxTokens,
    presence_penalty: store.presencePenalty,
    frequency_penalty: store.frequencyPenalty
  }

  try {
    const result: AxiosResponse<CreateChatCompletionResponse> =
      await axios.post('/api/chat', params)

    if (result.data.choices.length === 0) {
      return
    }

    const lastChoice = result.data.choices[result.data.choices.length - 1]

    userMessages.value = [
      ...userMessages.value,
      {
        role: lastChoice.message?.role ?? 'assistant',
        content: lastChoice.message?.content ?? ''
      }
    ]
  } catch (err) {
    console.error(err)
    toastText.value = 'Failed to send message'
    isToastOpen.value = true
  }
}

const { isLoading, call: sendChat } = useLoading(send)

const resend = async (): Promise<void> => {
  // remove last element
  userMessages.value = userMessages.value.slice(0, -1)

  await sendChat(true)
}
</script>

<template>
  <CSettings v-model:open="dialogOpen" />

  <CToast v-model:open="isToastOpen" :text="toastText" />
  <div class="max-w-7xl p-8 m-auto flex flex-col h-screen">
    <div class="flex gap-3">
      <c-button @click="openSettings">Open Settings</c-button>
      <c-button @click="clearChat">Clear Chat</c-button>
    </div>
    <div class="flex flex-col py-6">
      <div
        class="inline-flex flex-col-reverse overflow-auto gap-4 mb-4 pr-3"
        style="height: calc(100vh - 48px - 24px - 24px - 200px)"
      >
        <div>
          <c-button
            :disabled="isLoading || userMessages.length === 0"
            :is-loading="isLoading"
            @click="resend"
            >Resend</c-button
          >
        </div>
        <div
          v-for="(msg, index) in reversedUserMessages"
          :key="index"
          class="flex flex-col items-start gap-1"
        >
          <div
            :class="{ 'self-end': msg.role === 'assistant' }"
            class="flex items-center gap-2"
          >
            <div class="text-sm text-gray-600 flex-1">
              {{ msg.role }}
            </div>
            <button
              class="text-xs text-blue-400"
              @click="copyToClipboard(msg.content ?? '')"
            >
              Copy this content
            </button>
          </div>
          <div
            :class="{
              'self-end': msg.role === 'assistant',
              'border-blue-300': msg.role === 'user',
              'border-yellow-300': msg.role === 'assistant'
            }"
            class="border-2 rounded-md p-4 marked max-w-full overflow-x-auto"
            v-html="marked.parse(msg.content ?? '')"
          ></div>
        </div>
      </div>
      <div class="flex-1 flex gap-4">
        <div
          :data-replicated-value="userMessage"
          class="flex-1 grid grow-wrap after:max-h-[100px] after:border-blue-100 after:whitespace-pre-wrap after:invisible after:px-3 after:py-2 after:overflow-hidden"
          @keyup="
            (e) => {
              if (e.key === 'Enter' && e.getModifierState('Control')) {
                send()
                return
              }
            }
          "
        >
          <textarea
            v-model="userMessage"
            class="w-full max-h-[100px] rounded-md border border-blue-100 outline-blue-200 px-3 py-2 resize-none"
          ></textarea>
          <div>
            <span class="text-xs text-gray-400"
              >Press Ctrl + Enter to send.</span
            >&nbsp;
            <span v-if="isLoadingTokensLength" class="text-xs text-gray-400">
              Calculating tokens length...
            </span>
            <span class="text-xs text-gray-400"
              >Current tokens length: {{ userMessagesTokenLength }}</span
            >
          </div>
        </div>
        <c-button
          :disabled="isLoading"
          :is-loading="isLoading"
          @click="sendChat"
          >Send</c-button
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.grow-wrap::after {
  /* Note the weird space! Needed to preventy jumpy behavior */
  content: attr(data-replicated-value) ' ';
}

.grow-wrap > textarea,
.grow-wrap::after {
  /* Identical styling required!! */
  /* Place on top of each other */
  grid-area: 1 / 1 / 2 / 2;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
