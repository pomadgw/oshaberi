import { Hono } from 'hono'
import { HumanMessage, SystemMessage } from 'langchain/schema'
import { ZodError } from 'zod'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { loadSummarizationChain } from 'langchain/chains'
import { formatDocumentsAsString } from 'langchain/util/document'
import { HumanMessagePromptTemplate } from 'langchain/prompts'

import {
  OshaberiChatOverDocumentParameterSchema,
  OshaberiChatParameterSchema,
  OshaberiSummarizeParameterSchema,
  OshaberiValidLLMProviderSchema
} from './types'
import logger from './logger'
import { providers } from './providers'
import { createLoader } from './lib/loaders'
import { createVectorStore } from './lib/store'
import { toLangChainMessages } from './lib/message'

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

  llmProvider.setTemperature(body.temperature)

  const modelList = await llmProvider.getModelLists()

  if (!modelList.includes(body.model)) {
    throw new Error('Invalid model')
  }

  llmProvider.setModel(body.model)

  logger.info({ body })
  const result = await llmProvider.getModel().predictMessages(toLangChainMessages(body.messages))

  c.status(200)

  return c.json({
    content: result.content,
    role: 'assistant'
  })
})

api.post('/summarize', async (c) => {
  const body = OshaberiSummarizeParameterSchema.parse(await c.req.json())

  const llmProvider = providers[body.provider]

  llmProvider.setTemperature(body.temperature)

  const modelList = await llmProvider.getModelLists()

  if (!modelList.includes(body.model)) {
    throw new Error('Invalid model')
  }

  llmProvider.setModel(body.model)

  const loader = await createLoader(body.document)

  const docs = await loader.load()

  const splitter = new RecursiveCharacterTextSplitter({
    chunkOverlap: 0,
    chunkSize: 500
  })

  const splitDocuments = await splitter.splitDocuments(docs)

  const summarizeChain = loadSummarizationChain(llmProvider.getModel(), { type: 'refine' })

  const res = await summarizeChain.call({
    input_documents: splitDocuments
  })

  c.status(200)

  return c.json({
    content: res.output_text,
    role: 'assistant'
  })
})

api.post('/document/upload', async (c) => {
  const data = await c.req.parseBody()

  const file = data.file

  if (file instanceof File) {
    logger.info('Uploading file', { name: file.name, service: 'oshaberi-service-api' })

    // write to file with path <root>/uploaded/<filename>
    await Bun.write(`uploaded/${file.name}`, await file.arrayBuffer())
  }

  return c.json({
    message: 'ok'
  })
})

api.post('/document/chat', async (c) => {
  const body = OshaberiChatOverDocumentParameterSchema.parse(await c.req.json())

  const llmProvider = providers[body.provider]

  llmProvider.setTemperature(body.temperature)

  const modelList = await llmProvider.getModelLists()

  if (!modelList.includes(body.model)) {
    throw new Error('Invalid model')
  }

  llmProvider.setModel(body.model)

  logger.info('Loading the document')
  const docs = await Promise.all(
    body.documents.map(async (document) => {
      const loader = await createLoader(document)
      return loader.load()
    })
  )

  const splitter = new RecursiveCharacterTextSplitter({
    chunkOverlap: 0,
    chunkSize: 500
  })

  const splitDocuments = await splitter.splitDocuments(docs.flat())

  logger.info('Creating the vector store')
  const vectorStore = await createVectorStore(splitDocuments, body.embedding_provider)
  const retriever = vectorStore.asRetriever()

  const messages = toLangChainMessages(body.messages)

  // create a standalone question
  const lastMessage = messages[body.messages.length - 1]
  const restOfMessages = messages.slice(0, body.messages.length - 1)
  const questionTemplate = HumanMessagePromptTemplate.fromTemplate(
    `
Given a follow up question, rephrase the follow up question to be a standalone question.

FOLLOWUP QUESTION: {question}
    `.trim()
  )
  const question = await questionTemplate.formatMessages({ question: lastMessage.content })

  logger.info('Fetch the answer')
  const { content: actualQuestion } = await llmProvider
    .getModel()
    .predictMessages([...restOfMessages, ...question])

  logger.info('Fetch the relevant documents', { question: actualQuestion })

  const relevantDocuments = await retriever.getRelevantDocuments(actualQuestion.toString())
  const serialized = formatDocumentsAsString(relevantDocuments)

  const result = await llmProvider.getModel().predictMessages([
    new SystemMessage({
      content: `
You are an assistant that answers questions about the following document.

# Document
${serialized}
      `.trim()
    }),
    ...restOfMessages,
    new HumanMessage({
      content: actualQuestion
    })
  ])

  c.status(200)

  return c.json({
    content: result.content,
    role: 'assistant'
  })
})

export default (app: Hono) => app.route('/api', api)
