export interface ChatMessage<T> {
  message: string
  user: string
  isHTML?: boolean
  value: T
  hide?: boolean
}

export type ChatMessages<T> = Array<ChatMessage<T>>
export type KeyedChatMessages<T> = Record<string, ChatMessages<T>>
