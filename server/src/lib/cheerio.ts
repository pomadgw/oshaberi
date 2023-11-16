import { load, type SelectorType } from 'cheerio'
import { Document } from 'langchain/document'
import { convert } from 'html-to-text'
import { type AxiosRequestConfig } from 'axios'

import { fetch } from './fetcher'

interface CheerioDocumentLoaderOptions {
  url: string | URL
  selector?: SelectorType
  axiosConfig?: AxiosRequestConfig
}

export async function getCheerioDocument(
  config: CheerioDocumentLoaderOptions
): Promise<Document[]> {
  const metadata = {
    source: config.url.toString()
  }

  const data = await fetch(config.url, config.axiosConfig)

  const $ = load(data)

  const selector = config.selector ?? 'body'
  const text = convert($(selector).html() ?? '')

  return [new Document({ pageContent: text, metadata })]
}
