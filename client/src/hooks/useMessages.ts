import { type ComputedRef, computed, ref } from 'vue'
import { useChatSession } from '../store'
import { type Message, type ChatMessages } from '../lib/types/chat'
import { type ChatCompletionRequestMessage } from 'openai'
import useTokenCalculator, { tokenLength } from './useTokenCalculator'

// eslint-disable-next-line
export default function useMessages() {
  const messageStore = useChatSession()

  const messages = computed({
    get: () => messageStore.getSelectedSession.messages,
    set: (value: ChatMessages<ChatCompletionRequestMessage>) => {
      messageStore.setMessagesToSelectedSession(value)
    }
  })

  const clearChat = (): void => {
    messages.value = []
  }

  const systemMessage: ComputedRef<ChatCompletionRequestMessage[]> = computed(
    () => {
      return messageStore.getCurrentSystemMessage !== ''
        ? [{ role: 'system', content: messageStore.getCurrentSystemMessage }]
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

  const currentMessage = ref<Message>()
  const currentMessageTokenLength = computed(() => {
    const message = currentMessage.value
    if (message == null) return 0

    return (
      (message.message === ''
        ? 0
        : tokenLength(
            [
              {
                role: message.role ?? 'user',
                content: message.message
              }
            ],
            true
          )) + tokenCount.value
    )
  })

  return {
    systemMessage,
    messages,
    messagesToSend,
    tokenCount,
    clearChat,
    currentMessage,
    currentMessageTokenLength
  }
}
