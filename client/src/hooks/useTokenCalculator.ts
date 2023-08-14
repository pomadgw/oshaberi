import { computed, type ComputedRef, type Ref } from 'vue'
import { get_encoding } from '@dqbd/tiktoken'

import { type ChatCompletionRequestMessage } from 'openai'

// Load the tokenizer which is designed to work with the embedding model
const tokenizer = get_encoding('cl100k_base')

export function tokenLength(
  messages: string | ChatCompletionRequestMessage[],
  calculateSingleMessage = false
): number {
  if (typeof messages === 'string') {
    return tokenizer.encode(messages).length
  }

  const tokensPerMessage = 4

  if (calculateSingleMessage) {
    return tokensPerMessage + tokenizer.encode(messages[0].content ?? '').length
  }

  let totalTokens = 0

  for (const message of messages) {
    totalTokens += tokensPerMessage
    totalTokens += tokenizer.encode(message.content ?? '').length
  }

  totalTokens += 3

  return totalTokens
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function useTokenCalculator(
  messages:
    | Ref<ChatCompletionRequestMessage[]>
    | ComputedRef<ChatCompletionRequestMessage[]>
) {
  const tokenCount = computed(() => tokenLength(messages.value))
  const tokenCountDisplay = computed(() => {
    return `${tokenCount.value} tokens`
  })

  return {
    tokenCount,
    tokenCountDisplay
  }
}
