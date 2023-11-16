import { YoutubeLoader } from 'langchain/document_loaders/web/youtube'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { Document } from 'langchain/document'
import { type SelectorType } from 'cheerio'

import { getCheerioDocument } from '../../lib/cheerio.js'
import { fetch } from '../../lib/fetcher.js'

enum DocumentSource {
  Youtube = 'youtube',
  Web = 'web',
  Text = 'text',
  PDF = 'pdf'
}

export function isDocumentSource(value: any): value is DocumentSource {
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

export async function getDocuments(
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
