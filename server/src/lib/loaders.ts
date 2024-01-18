import { type DocumentLoader } from 'langchain/document_loaders/base'
import { type SelectorType } from 'cheerio'

import { type Loader } from '../types/loaders'

export async function createLoader(loader: Loader): Promise<DocumentLoader> {
  if (loader.type === 'web') {
    const { CheerioWebBaseLoader } = await import('langchain/document_loaders/web/cheerio')
    return new CheerioWebBaseLoader(loader.url, {
      selector: loader.selector as SelectorType
    })
  } else if (loader.type === 'youtube') {
    const { YoutubeLoader } = await import('langchain/document_loaders/web/youtube')
    return YoutubeLoader.createFromUrl(loader.url.toString(), {
      language: loader.language ?? 'en'
    })
  } else if (loader.type === 'pdf') {
    const { PDFLoader } = await import('langchain/document_loaders/fs/pdf')

    if (loader.path.type === 'path') {
      return new PDFLoader(`uploaded/${loader.path.path}`, {
        splitPages: loader.splitPages
      })
    }

    const content = await fetch(loader.path.url).then(async (r) => r.arrayBuffer())
    // save to file
    const filename = `pdf-${Date.now()}.pdf`
    const path = `/tmp/${filename}`
    await Bun.write(path, content)

    return new PDFLoader(path, {
      splitPages: loader.splitPages
    })
  }

  throw new Error('Invalid loader type')
}
