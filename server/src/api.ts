import { Hono } from 'hono'
import { AIMessage, type BaseMessage, HumanMessage, SystemMessage } from 'langchain/schema'
import { ZodError } from 'zod'

import {
  OshaberiChatParameterSchema,
  OshaberiValidLLMProviderSchema
} from './types'
import logger from './logger'
import { providers } from './providers'

const api = new Hono()

api.onError((e, c) => {
  logger.error(e.message, { service: 'oshaberi-service-api' })

  c.status(400)

  if (e instanceof ZodError) {
    return c.json({
      errors: e.errors
    })
  }

  return c.json({
    errors: [(e as any).toString()]
  })
})

api.get('/models', async (c) => {
  const providerId = OshaberiValidLLMProviderSchema.parse(c.req.query('provider'))
  const provider = providers[providerId]

  c.status(200)

  const models = await provider.getModelLists()
  return c.json({ models })
})

api.post('/chat', async (c) => {
  const body = OshaberiChatParameterSchema.parse(await c.req.json())
  const llmProvider = providers[body.provider]

  llmProvider.setModel(body.model)
  llmProvider.setTemperature(body.temperature)

  let messages: BaseMessage[] = []

  for (const m of body.messages) {
    if (m.role === 'user') {
      messages.push(
        new HumanMessage({
          content: m.content
        })
      )
    } else if (m.role === 'assistant') {
      messages.push(
        new AIMessage({
          content: m.content
        })
      )
    } else {
      messages = [
        new SystemMessage({
          content: m.content
        }),
        ...messages
      ]
    }
  }

  logger.info({ body })
  const result = await llmProvider.getModel().predictMessages(messages)

  c.status(200)

  return c.json({
    content: result.content,
    role: 'assistant'
  })
})

export default (app: Hono) => app.route('/api', api)
