import { AIMessage, type BaseMessage, HumanMessage, SystemMessage } from 'langchain/schema'

import { type Message } from '../types'

export function toLangChainMessages(messages: Message[]): BaseMessage[] {
  let result: BaseMessage[] = []

  for (const m of messages) {
    if (m.role === 'user') {
      result.push(
        new HumanMessage({
          content: m.content
        })
      )
    } else if (m.role === 'assistant') {
      result.push(
        new AIMessage({
          content: m.content
        })
      )
    } else {
      result = [
        new SystemMessage({
          content: m.content
        }),
        ...result
      ]
    }
  }

  return result
}
