import { type ComputedRef, computed, ref } from 'vue'
import { useChatSession } from '../store'
import { type ChatMessages } from '../lib/types/chat'
import { type ChatCompletionRequestMessage } from 'openai'
import useTokenCalculator, { tokenLength } from './useTokenCalculator'

// eslint-disable-next-line
export default function useMessages() {
  const messageStore = useChatSession()

  const messages = computed({
    get: () => messageStore.getSelectedSession.messages,
    set: (value: ChatMessages<ChatCompletionRequestMessage>) => {
      console.log({ value })
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
