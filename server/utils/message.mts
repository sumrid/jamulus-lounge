import { type Message } from '../models.mts'

export function extract(message: string): Message {
  const userRegex = message.match(/<b>(.*)<\/b>/)
  const textRegex = message.match(/<\/font>\s+(.*)/)

  let user = getMatche(userRegex, 1, 'user')
  user = user.replace(/\[\d*\]/g, '').trim()
  let text = getMatche(textRegex, 1, '')
  let command = ''

  const subUser = text.match(/\[(.*)\]\s+(.*)/)
  if (subUser) {
    user = getMatche(subUser, 1, 'user')
    text = getMatche(subUser, 2, '')
  }

  const commandRegex = text.match(/^(\/[a-z]*)\s(.*)/)
  if (commandRegex) {
    command = getMatche(commandRegex, 1, '')
    text = getMatche(commandRegex, 2, '')
  }

  return {
    user,
    text,
    command,
  }
}

function getMatche(s: RegExpMatchArray | null, index: number, defaultValue: string): string {
  if (s && s[index]) {
    return s[index].trim()
  }
  return defaultValue
}