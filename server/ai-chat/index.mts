import EventSource from 'eventsource'
import { GOJAM_API_PORT } from '../env.mjs'
import { Commands, EventData, Message } from '../models.mts'
import logger from '../utils/logger.mts'
import { extract } from '../utils/message.mts'
import { chat } from './ai.mts'
import { sendJamulusChat } from './gojam-client.mts'
import { search } from './tavily.mts'

let previuosClients: number = 99
let lastWelcomeMessage: Date = new Date()

const eventSource = new EventSource(`http://localhost:${GOJAM_API_PORT}/events`)

/*
 * Add message handler
 */
eventSource.addEventListener('message', (event: MessageEvent<string>) => {
  const { newChatMessage, clients } = JSON.parse(event.data) as EventData
  if (newChatMessage) {
    const msg = extract(newChatMessage.message)
    if (msg.command === Commands.AI) {
      logger.info('matched ai chat')
      handleOnChatMessage(msg)
    }

    if (msg.command === Commands.CHORD) {
      logger.info('matched chord search')
      handleFindChord(msg)
    }

    if (msg.command === Commands.WEB) {
      logger.info('matched web search')
      handleWebSearch(msg)
    }
  }

  if (clients) {
    const currenct = clients.length
    const time = new Date()
    const hasNewClient = currenct > previuosClients
    const isTimePassed =
      time.getTime() - lastWelcomeMessage.getTime() > 5 * 60 * 1000
    if (hasNewClient && isTimePassed) {
      logger.info('new client connected')
      handleOnClient()
      lastWelcomeMessage = time
    }
    previuosClients = currenct
  }
})

async function handleOnChatMessage(message: Message) {
  try {
    const response = await chat(message.user, message.text)
    await sendJamulusChat(response)
  } catch (error) {
    logger.error('Error sending chat message:', error)
  }
}

async function handleFindChord(message: Message) {
  try {
    const response = await search(`${message.text} คอร์ด`)
    const urls = new Set<string>(response.map((i) => i.url))
    const chatMessage = `${message.text}: ${Array.from(urls).join(' , ')}`
    await sendJamulusChat(chatMessage)
  } catch (error) {
    logger.error('Error sending chat message:', error)
  }
}

async function handleWebSearch(message: Message) {
  try {
    await sendJamulusChat('give me a sec...')
    const searchRes = await search(message.text)
    const prompt = `i did web search for "${
      message.text
    }" can you summarize these results for me
    ====
    ${JSON.stringify(searchRes, null, ' ')}
    ====
    `
    const chatMessage = await chat(message.user, prompt)
    await sendJamulusChat(chatMessage)
  } catch (error) {
    logger.error('Error sending chat message:', error)
  }
}

async function handleOnClient() {
  try {
    const message = `give user a short welcome message, and tell them how to use basic commands.
    [THERE ARE ONLY THREE commands]
    /ai <message> for chatting wiht ai
    /chord <song name> to search chords.
    /web <message> i will do web search for you!`

    const response = await chat('newuser', message, {
      includeHistory: false,
      saveHistory: false,
    })
    await sendJamulusChat(response)
  } catch (error) {
    logger.error('Error sending chat message:', error)
  }
}
