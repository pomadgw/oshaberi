import axios from 'axios'
import { type ChatCompletionFunctions } from 'openai'

interface FunctionLibrary {
  name: string
  schema: Omit<ChatCompletionFunctions, 'name'>
  callback: (parameters: any) => Promise<string>
}

export const functionLibraries: FunctionLibrary[] = [
  {
    name: 'get_location_by_ip_address',
    schema: {
      description: 'Get location by IP address',
      parameters: {
        type: 'object',
        properties: {
          ipAddress: {
            type: 'string',
            description: 'The IP address to get the location of'
          }
        }
      }
    },
    async callback(_parameters: any): Promise<string> {
      const data = await axios.get('https://ifconfig.co/json')

      return JSON.stringify({
        timeZone: data.data.time_zone,
        country: data.data.country,
        city: data.data.city
      })
    }
  }
]

const functions: ChatCompletionFunctions[] = functionLibraries.map((fn) => ({
  ...fn.schema,
  name: fn.name
}))

export default functions
