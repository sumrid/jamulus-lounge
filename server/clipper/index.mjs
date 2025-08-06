import archiver from 'archiver'
import axios from 'axios'
import EventSource from 'eventsource'
import Fastify from 'fastify'
import { createWriteStream } from 'fs'
import http from 'http'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import {
  CLIPPER_DIR,
  CLIPPER_UPLOAD_KEY,
  CLIPPER_UPLOAD_NAMESPACE,
  CLIPPER_UPLOAD_URL,
  GOJAM_API_PORT,
  LOUNGE_ADMIN_PORT,
  LOUNGE_CLIPPER_PORT,
} from '../env.mjs'
import ClipBuffer from './class/clip-buffer.mts'
import EventBuffer from './class/event-buffer.mts'
import GoJamClient from '../client/gojam-client.mts'

const canUpload = !!CLIPPER_UPLOAD_URL && !!CLIPPER_UPLOAD_KEY

let enabled = false

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
    },
  },
})
const logger = fastify.log
const gojamClient = GoJamClient.getInstance()
const clipBuffer = new ClipBuffer()
const eventBuffer = new EventBuffer()

http.get(`http://localhost:${GOJAM_API_PORT}/mp3`, async (res) => {
  if (res.statusCode !== 200) {
    throw new Error('Bad status code')
  }
  for await (const buffer of res) {
    if (enabled) {
      clipBuffer.add(buffer)
    }
  }
  process.exit(1)
})

async function worker() {
  try {
    const state = await axios.get(`http://localhost:${LOUNGE_ADMIN_PORT}/state`)
    if (state.data?.recording !== enabled) {
      logger.info(`Setting recording to ${enabled}`)
      await axios.patch(`http://localhost:${LOUNGE_ADMIN_PORT}/state`, {
        recording: enabled,
      })
    }
  } catch (err) {
    logger.error({ err })
  }
}

setInterval(worker, 2500)
worker()

function enable() {
  if (enabled) return false
  if (!canUpload) {
    logger.error('Cannot enable recording without upload URL and key')
    return false
  }
  enabled = true
  logger.info('Enabled recording')
  return true
}

function disable() {
  if (!enabled) return false
  enabled = false
  clipBuffer.clear()
  eventBuffer.clear()
  logger.info('Disabled recording')
  return true
}

const eventSource = new EventSource(`http://localhost:${GOJAM_API_PORT}/events`)
let currentState = {}
const seenId = new Set()
eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data)
  if (enabled) {
    eventBuffer.add(currentState, data)
  }
  if (data.clients) {
    currentState = { ...currentState, clients: data.clients }
  }
  if (data.levels) {
    currentState = { ...currentState, levels: data.levels }
  }
  if (data.newChatMessage) {
    const { id, message } = data.newChatMessage
    if (!seenId.has(id)) {
      seenId.add(id)
      if (message.match(/>\s+\/clip\s*$/)) {
        generateClipMessage()
      } else if (message.match(/>\s+\/on\s*$/)) {
        if (enable()) {
          gojamClient
            .sendJamulusChat(
              'clipper is now active. type "/clip" to save the previous 10 minute. type "/off" to deactivate.',
            )
            .catch((e) => {
              fastify.log.error({ err: e }, 'Error sending chat message')
            })
        }
      } else if (message.match(/>\s+\/off\s*$/)) {
        if (disable()) {
          gojamClient
            .sendJamulusChat(
              'clipper is now deactivated. type "/on" to turn it back on.',
            )
            .catch((e) => {
              fastify.log.error({ err: e }, 'Error sending chat message')
            })
        }
      }
    }
  }
})

async function* clipToStream(clip) {
  for (const node of clip) {
    yield node.data
  }
}

fastify.get('/', async (request, reply) => {
  return {
    name: 'jamulus-clipper',
    enabled: enabled,
    audio: clipBuffer.offset,
    events: eventBuffer.size,
  }
})

async function generateClipArchive() {
  const clip = clipBuffer.clip()
  if (!clip) return null
  if (!CLIPPER_DIR) return null
  const archive = archiver('zip', { store: true })
  const stream = Readable.from(clipToStream(clip), { objectMode: false })
  archive.append(stream, { name: 'audio.mp3' })
  const [initialState, events] = eventBuffer.slice(clip.startTime, clip.endTime)
  const result = [
    {
      initial: {
        state: initialState,
        startTime: clip.startTime,
        endTime: clip.endTime,
      },
    },
    ...events.map((event) => ({ event })),
  ]
    .map((event) => JSON.stringify(event))
    .join('\n')
  archive.append(result, { name: 'events.ndjson' })
  archive.finalize()
  const filename =
    'clip-' +
    new Date(Date.now() - 60e3 * new Date().getTimezoneOffset())
      .toISOString()
      .replace(/:/g, '-')
      .split('.')[0] +
    '.zip'
  await pipeline(archive, createWriteStream(CLIPPER_DIR + '/' + filename))
  return filename
}

async function generateAndUploadClipFiles() {
  const clip = clipBuffer.clip()
  if (!clip) return null

  const uploadUrl = CLIPPER_UPLOAD_URL
  const uploadKey = CLIPPER_UPLOAD_KEY
  const stream = Readable.from(clipToStream(clip), { objectMode: false })

  const [initialState, events] = eventBuffer.slice(clip.startTime, clip.endTime)
  const eventsString = [
    {
      initial: {
        state: initialState,
        startTime: clip.startTime,
        endTime: clip.endTime,
      },
    },
    ...events.map((event) => ({ event })),
  ]
    .map((event) => JSON.stringify(event))
    .join('\n')

  const clipNamespace = CLIPPER_UPLOAD_NAMESPACE
  const base =
    `${clipNamespace}/` +
    new Date(Date.now() - 60e3 * new Date().getTimezoneOffset())
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\./, '-')
      .replace('T', '/')

  const audioFilename = base + '/audio.mp3'
  const eventsFilename = base + '/events.ndjson'

  const audioUpload = await axios.put(uploadUrl, stream, {
    params: {
      path: audioFilename,
    },
    headers: {
      'Content-Type': 'audio/mpeg',
      Authorization: `Bearer ${uploadKey}`,
    },
  })
  logger.info(`Uploaded audio: ${audioUpload.data.url}`)

  const eventsUpload = await axios.put(uploadUrl, eventsString, {
    params: {
      path: eventsFilename,
    },
    headers: {
      'Content-Type': 'application/x-ndjson',
      Authorization: `Bearer ${uploadKey}`,
    },
  })
  logger.info(`Uploaded events: ${eventsUpload.data.url}`)

  return {
    audio: audioUpload.data.url,
    events: eventsUpload.data.url,
    replayUrl: `https://jamviz.vercel.app/?replay=${audioUpload.data.url.replace(
      '/audio.mp3',
      '',
    )}`,
  }
}

let lastClipMessage = 0
async function generateClipMessage() {
  try {
    if (!enabled) {
      await gojamClient.sendJamulusChat(
        'clipper is not active. type "/on" to activate.',
      )
      return
    }
    if (Date.now() - lastClipMessage < 10e3) {
      fastify.log.info('clip message rate limit')
      await gojamClient.sendJamulusChat(
        'sorry, please wait 10 seconds between clips.',
      )
      return
    }
    lastClipMessage = Date.now()
    await gojamClient.sendJamulusChat('generating clip... please wait!')
    const clip = await generateAndUploadClipFiles()
    if (!clip) {
      fastify.log.info('no clip available')
      await gojamClient.sendJamulusChat('sorry, no clip data available.')
      return
    }
    await gojamClient.sendJamulusChat(clip.replayUrl)
  } catch (e) {
    await gojamClient
      .sendJamulusChat('sorry, there is an error.')
      .catch((e) => {
        fastify.log.error({ err: e }, 'Error sending chat message')
      })
    fastify.log.error({ err: e }, 'Error generating clip')
  }
}

fastify.post('/generate', async (request, reply) => {
  const clip = await generateClipArchive()
  return { clip }
})

fastify.post('/upload', async (request, reply) => {
  const result = await generateAndUploadClipFiles()
  return result
})

fastify.post('/enable', async (request, reply) => {
  enable()
  return { enabled }
})

fastify.post('/disable', async (request, reply) => {
  disable()
  return { enabled }
})

fastify.get('/clip', async (request, reply) => {
  const clip = clipBuffer.clip()
  if (!clip) {
    return reply.code(404).send('No clip available')
  }
  reply.header('Content-Type', 'audio/mpeg')
  reply.header('Content-Length', clip.size)
  const filename =
    'clip-' +
    new Date(clip.timestamp - 60e3 * new Date().getTimezoneOffset())
      .toISOString()
      .replace(/:/g, '-')
      .split('.')[0] +
    '.mp3'
  reply.header('Content-Disposition', `attachment; filename="${filename}"`)
  const stream = Readable.from(clipToStream(clip), { objectMode: false })
  return reply.send(stream)
})

fastify.listen({ port: LOUNGE_CLIPPER_PORT, host: '127.0.0.1' })
