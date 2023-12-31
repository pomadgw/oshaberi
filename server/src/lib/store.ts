import { HNSWLib } from 'langchain/vectorstores/hnswlib'
import { type Document } from 'langchain/document'
import { Redis } from 'ioredis'
import { CacheBackedEmbeddings } from 'langchain/embeddings/cache_backed'
import { RedisByteStore } from 'langchain/storage/ioredis'

import { type OshaberiValidLLMProvider } from '../types'

const redisClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')
const redisStore = new RedisByteStore({
  client: redisClient
})

const cacheBackedEmbeddings: Record<OshaberiValidLLMProvider, CacheBackedEmbeddings | null> = {
  openai: null,
  ollama: null
}

const getEmbeddingClass = async (provider: OshaberiValidLLMProvider) => {
  if (provider === 'openai') {
    const { OpenAIEmbeddings } = await import('langchain/embeddings/openai')
    if (cacheBackedEmbeddings[provider] == null) {
      cacheBackedEmbeddings[provider] = CacheBackedEmbeddings.fromBytesStore(
        new OpenAIEmbeddings(),
        redisStore,
        {
          namespace: 'openai'
        }
      )
    }
  }

  if (provider === 'ollama') {
    const { OllamaEmbeddings } = await import('langchain/embeddings/ollama')

    if (cacheBackedEmbeddings[provider] == null) {
      cacheBackedEmbeddings[provider] = CacheBackedEmbeddings.fromBytesStore(
        new OllamaEmbeddings(),
        redisStore,
        {
          namespace: 'ollama'
        }
      )
    }
  }

  if (cacheBackedEmbeddings[provider] == null) {
    throw new Error('Invalid provider')
  }

  return cacheBackedEmbeddings[provider]
}

export async function createVectorStore(documents: Document[], provider: OshaberiValidLLMProvider) {
  const embeddings = await getEmbeddingClass(provider)
  if (embeddings == null) {
    throw new Error('Invalid provider')
  }

  return await HNSWLib.fromDocuments(documents, embeddings)
}
