import { z } from 'zod'

export const WebLoaderSchema = z.object({
  url: z.string().url(),
  type: z.literal('web')
})

export const YoutubeLoaderSchema = z.object({
  url: z.string().url(),
  language: z.string().optional(),
  type: z.literal('youtube')
})

export const LoaderSchema = z.discriminatedUnion('type', [WebLoaderSchema, YoutubeLoaderSchema])
export type Loader = z.infer<typeof LoaderSchema>
