import express from 'express'
import { RetrievalQAChain, loadSummarizationChain } from 'langchain/chains'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import multer from 'multer'

import { isDocumentSource, getDocuments } from './isDocumentSource.js'
import { getVectorStore } from '../../lib/getVectorStore.js'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

let model: ChatOpenAI | undefined

function getModel(): ChatOpenAI {
  if (model == null) {
    model = new ChatOpenAI({ modelName: 'gpt-3.5-turbo' })
  }

  return model
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

    const vectorStore = await getVectorStore(splitDocs)

    getModel().modelName = modelName

    console.log('Loading model...')
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
