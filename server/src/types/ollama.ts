import { z } from 'zod'

export const DetailsSchema = z.object({
  format: z.string(),
  family: z.string(),
  families: z.array(z.string()).nullable(),
  parameter_size: z.string(),
  quantization_level: z.string()
})
export type Details = z.infer<typeof DetailsSchema>

export const OllamaModelSchema = z.object({
  name: z.string(),
  modified_at: z.coerce.date(),
  size: z.number(),
  digest: z.string(),
  details: DetailsSchema
})
export type Model = z.infer<typeof OllamaModelSchema>

export const OllamaTagSchema = z.object({
  models: z.array(OllamaModelSchema)
})
export type OllamaTag = z.infer<typeof OllamaTagSchema>
