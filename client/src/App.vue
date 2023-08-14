<script setup lang="ts">
import {
  type ChatCompletionResponseMessageRoleEnum,
  type CreateChatCompletionRequest,
  type ChatCompletionRequestMessageFunctionCall,
  type ChatCompletionRequestMessage
} from 'openai'

import CChat from './components/Chat/CChat.vue'
import CChatInput from './components/Chat/CChatInput.vue'
import CToast from './components/CToast.vue'
import CSettings from './components/CSettings.vue'

import { type ChatMessages } from './lib/types/chat'
import { type ComputedRef, ref, watch, nextTick, computed } from 'vue'
import useTokenCalculator, { tokenLength } from './hooks/useTokenCalculator'
import { useChatGPTSetting, useSavedMessages } from './store'
import clipboardEvent from './clipboard'
import useLLM from './hooks/useLLM'
import { marked } from 'marked'
import useToast from './hooks/useToast'

const { openToast } = useToast()

const settingStore = useChatGPTSetting()
const messageStore = useSavedMessages()
// const messages: Ref<ChatMessages<ChatCompletionRequestMessage>> = ref([])

const messages = computed({
  get: () => messageStore.getSelected,
  set: (value: ChatMessages<ChatCompletionRequestMessage>) => {
    console.log({ value })
    messageStore.setSelectedMessages(value)
  }
})

const newKey = ref('')

const clearChat = (): void => {
  messages.value = []
}

const systemMessage: ComputedRef<ChatCompletionRequestMessage[]> = computed(
  () => {
    return settingStore.system !== ''
      ? [{ role: 'system', content: settingStore.system }]
      : []
  }
)

const messagesToSend = computed(() => {
  return [
    ...systemMessage.value,
    ...(messages.value.map((message) => message.value) ?? [])
  ]
})

const { tokenCount } = useTokenCalculator(messagesToSend)

const currentMessage = ref('')
const currentMessageTokenLength = computed(() => {
  return (
    (currentMessage.value === ''
      ? 0
      : tokenLength(
          [
            {
              role: 'user',
              content: currentMessage.value
            }
          ],
          true
        )) + tokenCount.value
  )
})

const cchatRef = ref()

const params: ComputedRef<CreateChatCompletionRequest> = computed(() => ({
  model: settingStore.model,
  messages: messagesToSend.value,
  temperature: settingStore.temperature,
  max_tokens:
    settingStore.maxTokens === 0
      ? undefined
      : settingStore.maxTokens - tokenCount.value,
  presence_penalty: settingStore.presencePenalty,
  frequency_penalty: settingStore.frequencyPenalty
}))

const appendToMessages = (
  role: ChatCompletionResponseMessageRoleEnum,
  content: string,
  functionCall?: ChatCompletionRequestMessageFunctionCall,
  name?: string,
  message?: string
): void => {
  const theMessage = message ?? content
  messages.value = [
    ...messages.value,
    {
      user: role as string,
      message: theMessage,
      isHTML: true,
      value: {
        name,
        function_call: functionCall,
        content,
        role
      }
    }
  ]
}

const { chat, chatFunc } = useLLM()
const send = (isResend = false): void => {
  const messageLength = messages.value.length

  if (!isResend && messages.value[messageLength - 1].user !== 'user') {
    messages.value = messages.value.slice(0, messageLength - 1)
  }

  chat.mutate(params.value)
}

const lastMessage = computed(() => {
  return messages.value[messages.value.length - 1]
})

watch(chat.isSuccess, (value) => {
  if (value) {
    const data = chat.data?.value?.data

    if (data != null) {
      const content = data.choices[0].message?.content ?? ''
      const role = data.choices[0].message?.role ?? 'assistant'
      const functionCall = data.choices[0].message?.function_call

      let message = content
      if (functionCall != null) {
        message = `
${content ?? ''}

**Calling \`${functionCall.name ?? '-'}\` with arguments:**

\`\`\`json
${functionCall.arguments ?? ''}
\`\`\`
    `.trim()
      }

      appendToMessages(role, content, functionCall, undefined, message)

      sendWithFunctionCall()
    }
  }
})

watch(chat.isError, (isError) => {
  if (isError) {
    console.error(chat.error?.value)
    const errorMessage =
      chat.error?.value?.response?.data?.error.toString() ?? 'Unknown error'
    openToast(`Error: ${errorMessage}`)
  }
})

const sendWithFunctionCall = (): void => {
  if (lastMessage.value.value.function_call != null) {
    chatFunc.mutate(params.value)
  }
}

watch(chatFunc.isSuccess, (value) => {
  if (value) {
    const data = chatFunc.data?.value?.data

    if (data != null) {
      const message = data.result.choices[0].message?.content ?? ''
      const role = data.result.choices[0].message?.role ?? 'assistant'
      const functionCall = data.result.choices[0].message?.function_call

      const functionMessage = data.functionMessage

      messages.value = [
        ...messages.value,
        {
          user: functionMessage.role as string,
          message: marked.parse(`
Function returned:

\`\`\`
${functionMessage.content ?? ''}
\`\`\`
          `),
          isHTML: true,
          value: functionMessage,

          hide: true
        }
      ]

      appendToMessages(role, message, functionCall)
      sendWithFunctionCall()
    }
  }
})

const sendMessage = (message: string): void => {
  appendToMessages('user', message)
  currentMessage.value = ''
  send()
}

watch(
  messages,
  async () => {
    if (cchatRef.value != null) {
      await nextTick(() => {
        const element = cchatRef.value.$el as HTMLElement

        element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
      })
    }
  },
  {
    immediate: true
  }
)

const onSuccessCopy = (): void => {
  openToast('Copied!')
}

clipboardEvent.on('success', onSuccessCopy)

const dialogOpen = ref(false)
const openSettings = (): void => {
  dialogOpen.value = true
}
</script>

<template>
  <CSettings v-model:open="dialogOpen" />
  <CToast class="z-50" />
  <div class="flex flex-col max-w-[1200px] m-auto h-screen">
    <div class="navbar bg-base-100">
      <div class="flex-1">
        <a class="btn btn-ghost normal-case text-xl">oShaberi</a>
      </div>
      <div class="navbar-end">
        <button class="btn btn-ghost normal-case" @click="openSettings">
          Settings
        </button>
        <button class="btn btn-ghost normal-case" @click="clearChat">
          Clear chat
        </button>
      </div>
    </div>
    <div class="flex flex-1 w-full gap-5 p-4 md:p-8">
      <div class="py-4 w-72 flex flex-col gap-3">
        <div class="ml-4 text-sm font-bold">Chat history</div>
        <div
          class="overflow-y-auto"
          style="height: calc(100vh - 48px - 124px - 64px - 64px - 18px)"
        >
          <div
            v-for="key in messageStore.getKeys"
            :key="key"
            class="flex gap-2"
          >
            <button
              class="text-left hover:bg-purple-300 dark:hover:bg-purple-800 p-4 w-full rounded-lg"
              :class="{
                'bg-purple-300 dark:bg-purple-800':
                  messageStore.selected === key
              }"
              @click="messageStore.selectChat(key)"
            >
              {{ key }}
            </button>
            <button
              v-if="
                messageStore.getKeys.length > 1 && messageStore.selected !== key
              "
              @click="messageStore.removeKey(key)"
            >
              x
            </button>
            <div v-else class="invisible">x</div>
          </div>
        </div>
        <input v-model="newKey" class="input input-bordered" />
        <button
          class="btn"
          @click="
            () => {
              messageStore.addKey(newKey)
              newKey = ''
            }
          "
        >
          Add
        </button>
      </div>
      <div class="flex flex-col h-full w-full">
        <div class="flex-1">
          <CChat
            ref="cchatRef"
            :messages="messages"
            style="max-height: calc(100vh - 48px - 124px - 64px - 64px)"
          />
        </div>

        <CChatInput
          :token-count="currentMessageTokenLength"
          :is-sending="chat.status.value === 'loading'"
          class="mt-3"
          @send-message="sendMessage"
          @type="currentMessage = $event"
        />
      </div>
    </div>
  </div>
</template>
