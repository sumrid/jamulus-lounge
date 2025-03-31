export interface EventData {
  newChatMessage?: ChatMessage
  clients?: Client[]
  levels?: number[]
}

export interface Client {
  name: string
  city: string
  country: number
  skillLevel: number
  instrument: number
}

export interface ChatMessage {
  id: string
  message: string
  timestamp: string
}

export interface Message {
  user: string
  text: string
  command?: string
}

export enum Commands {
  AI = '/ai',
  CHORD = '/chord',
  WEB = '/web',
}

export interface TavilySearchResult {
  title: string
  url: string
  content: string
  rawContent?: string | null
  score: number
  publishedDate?: string
}
