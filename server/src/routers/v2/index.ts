import express from 'express'
import { RetrievalQAChain, loadSummarizationChain } from 'langchain/chains'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { RedisVectorStore } from 'langchain/vectorstores/redis'
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube'
import { getClient } from '../../lib/redis.js'
import { ChatPromptTemplate } from 'langchain/prompts'
import { type Document } from 'langchain/document'

const router = express.Router()

const model = new ChatOpenAI({ modelName: 'gpt-3.5-turbo' })

enum DocumentSource {
  Youtube = 'youtube'
}

function isDocumentSource(value: any): value is DocumentSource {
  return Object.values(DocumentSource).includes(value)
}

async function getDocuments(
  source: DocumentSource,
  params: any
): Promise<Array<Document<Record<string, any>>> | null> {
  let documents: Array<Document<Record<string, any>>> | null = null
  if (source === DocumentSource.Youtube) {
    const { videoId, language = 'en' } = params

    if (videoId == null) {
      throw new Error('videoId is required')
    }

    if (typeof videoId === 'string') {
      const loader = YoutubeLoader.createFromUrl(
        `https://youtu.be/${videoId}`,
        {
          language: language as string,
          addVideoInfo: true
        }
      )

      console.log('Loading video...')
      documents = await loader.load()
    }
  }

  return documents
}

router.post('/query', async (req, res) => {
  const { q: query, type, modelName = 'gpt-3.5-turbo', ...params } = req.body

  if (type == null || !isDocumentSource(type)) {
    res.status(400).json({ error: 'type is required' })
    return
  }

  if (query == null || typeof query !== 'string') {
    res.status(400).json({ error: 'q is required' })
    return
  }

  try {
    const documents = await getDocuments(type, params)

    if (documents === null) {
      res.status(400).json({ error: 'Invalid type' })
      return
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 0
    })

    const splitDocs = await textSplitter.splitDocuments(documents)

    const embeddings = new OpenAIEmbeddings()

    const vectorStore = await RedisVectorStore.fromDocuments(
      splitDocs,
      embeddings,
      {
        redisClient: await getClient(),
        indexName: 'docs'
      }
    )

    model.modelName = modelName

    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever())
    const response = await chain.call({ query })

    res.json({
      data: {
        text: response.text
      }
    })
  } catch (e) {
    console.error(e)
    const err = e as Error
    res.status(500).json({ error: err.toString() })
  }
})

const chatSummaryPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a helpful assistant to a busy user. You are helping them summarize a text they read. You summarize the text in into an article, with five to twenty sentences. The summary should be concise.`
  ],
  ['human', '# Text\n\n{text}']
])

router.post('/summarize', async (req, res) => {
  const { type, modelName = 'gpt-3.5-turbo', ...params } = req.body

  if (type == null || !isDocumentSource(type)) {
    res.status(400).json({ error: 'type is required' })
    return
  }

  try {
    const documents = await getDocuments(type, params)

    if (documents === null) {
      res.status(400).json({ error: 'Invalid type' })
      return
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 0
    })

    const splitDocs = await textSplitter.splitDocuments(documents)

    model.modelName = modelName

    const summaryChain = loadSummarizationChain(model, {
      type: 'map_reduce',
      combinePrompt: chatSummaryPrompt,
      combineMapPrompt: chatSummaryPrompt
    })

    const response = await summaryChain.call({
      input_documents: splitDocs
    })

    res.json({
      data: {
        text: response.text
      }
    })
  } catch (e) {
    console.error(e)
    const err = e as Error
    res.status(500).json({ error: err.toString() })
  }
})

export default router
