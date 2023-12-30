/* eslint-disable @typescript-eslint/no-redeclare */

import { z } from 'zod'

import { LoaderSchema } from './loaders'

const BaseMessage = z.object({
  content: z.string()
})

export const UserMessageSchema = BaseMessage.extend({
  role: z.literal('user')
})
export type UserMessage = z.infer<typeof UserMessageSchema>

export const AssistantMessageSchema = BaseMessage.extend({
  role: z.literal('assistant')
})
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>

export const SystemMessageSchema = BaseMessage.extend({
  role: z.literal('system')
})
export type SystemMessage = z.infer<typeof SystemMessageSchema>

export const MessageSchema = z.discriminatedUnion('role', [
  UserMessageSchema,
  AssistantMessageSchema,
  SystemMessageSchema
])
export type Message = z.infer<typeof MessageSchema>

export const OshaberiValidLLMProviderSchema = z.enum(['openai', 'ollama'])
export type OshaberiValidLLMProvider = z.infer<typeof OshaberiValidLLMProviderSchema>

export const OshaberiListModelParameterSchema = z.object({
  provider: OshaberiValidLLMProviderSchema
})
export type OshaberiListModelParameter = z.infer<typeof OshaberiListModelParameterSchema>

export const OshaberiLLMParameterSchema = z.object({
  temperature: z.number(),
  provider: OshaberiValidLLMProviderSchema,
  model: z.string()
})
export type OshaberiLLMParameter = z.infer<typeof OshaberiLLMParameterSchema>

export const OshaberiChatParameterSchema = OshaberiLLMParameterSchema.extend({
  messages: z.array(MessageSchema)
})
export type OshaberiChatParameter = z.infer<typeof OshaberiChatParameterSchema>

export const OshaberiSummarizeParameterSchema = OshaberiLLMParameterSchema.extend({
  document: LoaderSchema
})
export type OshaberiSummarizeParameter = z.infer<typeof OshaberiSummarizeParameterSchema>

export const OshaberiChatOverDocumentParameterSchema = OshaberiChatParameterSchema.extend({
  document: LoaderSchema
})
export type OshaberiChatOverDocumentParameter = z.infer<typeof OshaberiChatOverDocumentParameterSchema>
