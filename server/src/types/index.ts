/* eslint-disable @typescript-eslint/no-redeclare */

import { z } from 'zod'

const BaseMessage = z.object({
  content: z.string()
})

export const UserMessage = BaseMessage.extend({
  role: z.literal('user')
})
export type UserMessage = z.infer<typeof UserMessage>

export const AssistantMessage = BaseMessage.extend({
  role: z.literal('assistant')
})
export type AssistantMessage = z.infer<typeof AssistantMessage>

export const SystemMessage = BaseMessage.extend({
  role: z.literal('system')
})
export type SystemMessage = z.infer<typeof SystemMessage>

export const Message = z.discriminatedUnion('role', [UserMessage, AssistantMessage, SystemMessage])
export type Message = z.infer<typeof Message>

export const OshaberiValidLLMProvider = z.enum(['openai', 'ollama'])
export type OshaberiValidLLMProvider = z.infer<typeof OshaberiValidLLMProvider>

export const OshaberiListModelParameterSchema = z.object({
  provider: OshaberiValidLLMProvider
})
export type OshaberiListModelParameter = z.infer<typeof OshaberiListModelParameterSchema>

export const OshaberiLLMParameter = z.object({
  temperature: z.number(),
  provider: OshaberiValidLLMProvider,
  model: z.string()
})
export type OshaberiLLMParameter = z.infer<typeof OshaberiLLMParameter>

export const OshaberiChatParameter = OshaberiLLMParameter.extend({
  messages: z.array(Message)
})
export type OshaberiChatParameter = z.infer<typeof OshaberiChatParameter>
