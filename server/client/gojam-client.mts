import axios from 'axios'
import { GOJAM_API_PORT } from '../env.mjs'

class GoJamClient {
  private static instance: GoJamClient
  private client = axios.create({
    baseURL: `http://localhost:${GOJAM_API_PORT}`,
  })

  private constructor() {}

  public static getInstance(): GoJamClient {
    if (!GoJamClient.instance) {
      GoJamClient.instance = new GoJamClient()
    }
    return GoJamClient.instance
  }

  /**
   * Sends a chat message to the jamulus server.
   *
   * @param {string} message - The chat message to send.
   */
  public async sendJamulusChat(message: string) {
    await this.client.post('/chat', { message })
  }

  public async updateChannelInfo(
    name: string,
    skillLevel?: number,
    instrument?: number,
  ) {
    await this.client.patch('/channel-info', {
      name,
      skillLevel,
      instrument,
    })
  }
}

export default GoJamClient
