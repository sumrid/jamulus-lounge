import { Message } from '../models.mts'

export function extract(message: string): Message {
  const userRegex = message.match(/<b>(.*)<\/b>/)
  const textRegex = message.match(/<\/font>\s+(.*)/)

  let user = userRegex ? userRegex[1].trim() : 'user'
  let text = textRegex ? textRegex[1].trim() : ''
  let command = ''

  const subUser = text.match(/\[(.*)\]\s+(.*)/)
  if (subUser) {
    user = subUser[1].trim()
    text = subUser[2]
  }

  const commandRegex = text.match(/^(\/[a-z]*)\s(.*)/)
  if (commandRegex) {
    command = commandRegex[1].trim()
    text = commandRegex[2].trim()
  }

  return {
    user,
    text,
    command,
  }
}
