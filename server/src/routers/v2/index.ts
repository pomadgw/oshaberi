import express from 'express'
import { RetrievalQAChain, loadSummarizationChain } from 'langchain/chains'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { RedisVectorStore } from 'langchain/vectorstores/redis'
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'

import multer from 'multer'

import { getClient } from '../../lib/redis.js'
import { Document } from 'langchain/document'
import { getCheerioDocument } from '../../lib/cheerio.js'
import { fetch } from '../../lib/fetcher.js'
import { type SelectorType } from 'cheerio'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

let model: ChatOpenAI | undefined

function getModel(): ChatOpenAI {
  if (model == null) {
    model = new ChatOpenAI({ modelName: 'gpt-3.5-turbo' })
  }

  return model
}

enum DocumentSource {
  Youtube = 'youtube',
  Web = 'web',
  Text = 'text',
  PDF = 'pdf'
}

function isDocumentSource(value: any): value is DocumentSource {
  return Object.values(DocumentSource).includes(value)
}

interface YoutubeDocumentSourceParams {
  type: DocumentSource.Youtube
  videoId: string
  language?: string
}

interface WebDocumentSourceParams {
  type: DocumentSource.Web
  url: string
  selector?: SelectorType
}

interface TextDocumentSourceParams {
  type: DocumentSource.Text
  file?: Express.Multer.File
  url?: string | URL
}

interface PDFDocumentSourceParams {
  type: DocumentSource.PDF
  file: Express.Multer.File
}

type DocumentSourceParams =
  | YoutubeDocumentSourceParams
  | WebDocumentSourceParams
  | TextDocumentSourceParams
  | PDFDocumentSourceParams

async function getDocuments(
  params: DocumentSourceParams
): Promise<Array<Document<Record<string, any>>> | null> {
  let documents: Array<Document<Record<string, any>>> | null = null
  if (params.type === DocumentSource.Youtube) {
    const { videoId, language = 'en' } = params

    if (videoId == null) {
      throw new Error('videoId is required')
    }

    if (typeof videoId === 'string') {
      const loader = YoutubeLoader.createFromUrl(
        `https://youtu.be/${videoId}`,
        {
          language,
          addVideoInfo: true
        }
      )

      console.log('Loading video...')
      documents = await loader.load()
    }
  } else if (params.type === DocumentSource.Web) {
    const { url, selector = 'body' } = params

    if (url == null) {
      throw new Error('url is required')
    }

    if (typeof url === 'string') {
      console.log('Loading web...')
      documents = await getCheerioDocument({
        url,
        selector
      })
    }
  } else if (params.type === DocumentSource.Text) {
    const { file, url } = params

    if (file == null && url == null) {
      throw new Error('file or url is required')
    }

    if (typeof file === 'object') {
      console.log('Loading text...')
      documents = [new Document({ pageContent: file.buffer.toString() })]
    } else if (typeof url === 'string') {
      console.log('Loading text...')
      const text = await fetch(url)
      documents = [new Document({ pageContent: text })]
    }
  } else if (params.type === DocumentSource.PDF) {
    const { file } = params

    if (file == null) {
      throw new Error('file is required')
    }

    if (typeof file === 'object') {
      console.log('Loading pdf...')
      const loader = new PDFLoader(new Blob([file.buffer]))

      documents = await loader.load()
    }
  }

  return documents
}

router.post('/query', upload.single('file'), async (req, res) => {
  const { q: query, type, modelName = 'gpt-3.5-turbo', ...params } = req.body
  const { file } = req

  if (type == null || !isDocumentSource(type)) {
    res.status(400).json({ error: 'type is required' })
    return
  }

  if (query == null || typeof query !== 'string') {
    res.status(400).json({ error: 'q is required' })
    return
  }

  try {
    const documents = await getDocuments({ type, file, ...params })

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

    getModel().modelName = modelName

    const chain = RetrievalQAChain.fromLLM(
      getModel(),
      vectorStore.asRetriever()
    )
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

router.post('/summarize', upload.single('file'), async (req, res) => {
  const { type, modelName = 'gpt-3.5-turbo', ...params } = req.body
  const { file } = req

  if (type == null || !isDocumentSource(type)) {
    res.status(400).json({ error: 'type is required' })
    return
  }

  try {
    const documents = await getDocuments({ type, file, ...params })

    if (documents === null) {
      res.status(400).json({ error: 'Invalid type' })
      return
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    })

    const splitDocs = await textSplitter.splitDocuments(documents)

    getModel().modelName = modelName

    const summaryChain = loadSummarizationChain(getModel(), {
      verbose: true,
      type: 'map_reduce'
    })

    console.log('Summarizing...')

    const response = await summaryChain.call({
      input_documents: splitDocs
    })

    console.log('Done summarizing')

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
