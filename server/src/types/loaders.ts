import { z } from 'zod'

export const WebLoaderSchema = z.object({
  url: z.string().url(),
  selector: z.string().default('body'),
  type: z.literal('web')
})

export const YoutubeLoaderSchema = z.object({
  url: z.string().url(),
  language: z.string().optional(),
  type: z.literal('youtube')
})

export const PathOrUrlSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('path'),
    path: z.string()
  }),
  z.object({
    type: z.literal('url'),
    url: z.string().url()
  })
])

export const PDFLoaderSchema = z.object({
  path: PathOrUrlSchema,
  splitPages: z.boolean().default(false),
  type: z.literal('pdf')
})
export type PDFLoader = z.infer<typeof PDFLoaderSchema>

export const TextFileLoaderSchema = z.object({
  path: PathOrUrlSchema,
  type: z.literal('text')
})
export type TextFileLoader = z.infer<typeof TextFileLoaderSchema>

export const LoaderSchema = z.discriminatedUnion('type', [
  WebLoaderSchema,
  YoutubeLoaderSchema,
  PDFLoaderSchema,
  TextFileLoaderSchema
])
export type Loader = z.infer<typeof LoaderSchema>
