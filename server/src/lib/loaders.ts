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
  }

  throw new Error('Invalid loader type')
}
