import axios from 'axios'
import { GOJAM_API_PORT } from '../env.mjs'

const client = axios.create({ baseURL: `http://localhost:${GOJAM_API_PORT}` })

/**
 * Sends a chat message to the jamulus server.
 *
 * @param {string} message - The chat message to send.
 */
export async function sendJamulusChat(message: string) {
  await client.post('/chat', { message })
}

export async function updateChannelInfo(name: string) {
  await client.patch('/channel-info', {
    name,
    // skillLevel: 3,
    // instrument,
  })
}
