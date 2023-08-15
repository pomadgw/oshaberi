import { type ComputedRef, computed, ref, watch } from 'vue'
import { useChatGPTSetting } from '../store'
import {
  type CreateChatCompletionRequest,
  type ChatCompletionResponseMessageRoleEnum,
  type ChatCompletionRequestMessageFunctionCall
} from 'openai'
import useMessages from './useMessages'
import useLLM from './useLLM'
import useToast from './useToast'
import { marked } from 'marked'

// eslint-disable-next-line
export default function useChat() {
  const { openToast } = useToast()

  const settingStore = useChatGPTSetting()

  const cchatRef = ref()

  const { messages, messagesToSend, tokenCount, currentMessage } = useMessages()

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

  return {
    cchatRef,
    appendToMessages,
    send,
    isSendingChat: chat.isLoading,
    sendMessage
  }
}
