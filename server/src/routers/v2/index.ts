import express from 'express'
import { RetrievalQAChain } from 'langchain/chains'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { RedisVectorStore } from 'langchain/vectorstores/redis'
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube'
import { getClient } from '../../lib/redis.js'

const router = express.Router()

router.get('/youtube', async (req, res) => {
  const { videoId, language = 'en', q: query } = req.query

  if (videoId == null) {
    res.status(400).json({ error: 'videoId is required' })
    return
  }

  if (query == null || typeof query !== 'string') {
    res.status(400).json({ error: 'q is required' })
    return
  }

  if (typeof videoId === 'string') {
    const loader = YoutubeLoader.createFromUrl(`https://youtu.be/${videoId}`, {
      language: language as string,
      addVideoInfo: true
    })

    const data = await loader.load()

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 0
    })

    const splitDocs = await textSplitter.splitDocuments(data)

    const embeddings = new OpenAIEmbeddings()

    const vectorStore = await RedisVectorStore.fromDocuments(
      splitDocs,
      embeddings,
      {
        redisClient: await getClient(),
        indexName: 'docs'
      }
    )

    const model = new ChatOpenAI({ modelName: 'gpt-3.5-turbo' })
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever())
    const response = await chain.call({ query })

    res.json({
      data: {
        text: response.text
      }
    })
  } else {
    res.status(400).json({ error: 'videoId must be a string' })
  }
})

export default router
