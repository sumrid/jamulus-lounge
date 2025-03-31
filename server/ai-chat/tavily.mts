import { tavily } from '@tavily/core'
import { TAVILY_API_KEY } from '../env.mjs'
import { TavilySearchResult } from '../models.mts'

const agent = tavily({ apiKey: TAVILY_API_KEY })

export async function search(search: string): Promise<TavilySearchResult[]> {
  const res = await agent.search(search, { maxResults: 3 })
  return res.results
  // return mockResults;
}

const mockResults: TavilySearchResult[] = [
  {
    title: 'Kiss Me - Sixpence None the Richer - Guitar chords and tabs',
    url: 'https://m.e-chords.com/chords/sixpence-none-the-richer/kiss-me',
    content:
      "Lead me out on the moonlit floor. Dm G. Lift your open hand. C C9/B Am Am7/G. Strike up the band and make the fireflies dance, silver moon's. F7M G4 G. sparkling. Kiss Me Guitar chords and tabs by Sixpence None the Richer. Learn to play Guitar by chords / tabs using chord diagrams, watch video lessons and more.",
    rawContent: null,
    score: 0.996852,
    publishedDate: undefined,
  },
  {
    title: 'Kiss Me - Six Pence None The Richer - Guitar chords and tabs',
    url: 'https://m.e-chords.com/chords/six-pence-none-the-richer/kiss-me',
    content:
      'Learn how to play guitar with chords and tabs for the song Kiss Me by Six Pence None The Richer. See the key, chord diagrams, video lesson and more on E-Chords.',
    rawContent: null,
    score: 0.99444515,
    publishedDate: undefined,
  },
  {
    title: 'Kiss Me Chords by Sixpence None The Richer - Songsterr',
    url: 'https://www.songsterr.com/a/wsa/sixpence-none-the-richer-kiss-me-chords-s23039',
    content:
      'Learn how to play Kiss Me by Sixpence None The Richer with chords and rhythm. See the standard notation, the verses, the chorus and the solo sections.',
    rawContent: null,
    score: 0.9795506,
    publishedDate: undefined,
  },
]
