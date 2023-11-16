import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { RedisVectorStore } from 'langchain/vectorstores/redis'
import { type Document } from 'langchain/document'

import { getClient } from './redis.js'

export async function getVectorStore(
  splitDocs: Document[]
): Promise<RedisVectorStore> {
  const embeddings = new OpenAIEmbeddings()

  console.log('Loading embeddings...')
  const vectorStore = await RedisVectorStore.fromDocuments(
    splitDocs,
    embeddings,
    {
      redisClient: await getClient(),
      indexName: 'docs'
    }
  )
  return vectorStore
}
