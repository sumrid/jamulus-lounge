import { tavily } from '@tavily/core'
import { TAVILY_API_KEY } from '../env.mjs'
import { TavilySearchResult } from '../models.mts'

const agent = tavily({ apiKey: TAVILY_API_KEY })

export async function search(search: string): Promise<TavilySearchResult[]> {
  const res = await agent.search(search, { maxResults: 3 })
  return res.results
}
