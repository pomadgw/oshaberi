import { HNSWLib } from 'langchain/vectorstores/hnswlib'
import { type Document } from 'langchain/document'

import { type OshaberiValidLLMProvider } from '../types'

const getEmbeddingClass = async (provider: OshaberiValidLLMProvider) => {
  if (provider === 'openai') {
    const { OpenAIEmbeddings } = await import('langchain/embeddings/openai')

    return new OpenAIEmbeddings()
  }

  if (provider === 'ollama') {
    const { OllamaEmbeddings } = await import('langchain/embeddings/ollama')

    return new OllamaEmbeddings({ model: 'mistral-lower-gpu:latest' })
  }

  throw new Error('Invalid provider')
}

export async function createVectorStore(documents: Document[], provider: OshaberiValidLLMProvider) {
  return await HNSWLib.fromDocuments(documents, await getEmbeddingClass(provider))
}
