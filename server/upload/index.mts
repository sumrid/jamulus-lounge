import multipart from '@fastify/multipart'
import Fastify from 'fastify'
import * as Minio from 'minio'
import {
  CLIPPER_UPLOAD_KEY,
  STORAGE_AK,
  STORAGE_BUCKET,
  STORAGE_ENDPOINT,
  STORAGE_PUBLIC_URL,
  STORAGE_REGION,
  STORAGE_SK,
  UPLOAD_SERVER_PORT,
} from '../env.mjs'
import logger from '../utils/logger.mjs'

const minioClient = new Minio.Client({
  endPoint: STORAGE_ENDPOINT,
  useSSL: true,
  accessKey: STORAGE_AK,
  secretKey: STORAGE_SK,
  region: STORAGE_REGION,
})

const fastify = Fastify({ logger: true })

fastify.register(async function multipartContext(child) {
  child.register(multipart, {
    limits: {
      fileSize: 32 * 1024 * 1024,
    },
  })

  child.put('/upload', async function (req, reply) {
    const authHeader = req.headers.authorization
    if (authHeader !== `Bearer ${CLIPPER_UPLOAD_KEY}`) {
      reply.status(403)
      return { error: 'invalid key' }
    }
    const data = await req.file()
    const key = req.query.path
    const url = STORAGE_PUBLIC_URL + '/' + key
    const metaData = { 'Content-Type': data.mimetype }
    await minioClient.putObject(
      STORAGE_BUCKET,
      key,
      data.file,
      undefined,
      metaData,
    )
    return { url }
  })
})

fastify.register(async function rawContext(child) {
  fastify.removeAllContentTypeParsers()
  fastify.addContentTypeParser('*', function (request, payload, done) {
    done()
  })

  fastify.put('/upload-raw', async function (req, reply) {
    const authHeader = req.headers.authorization
    if (authHeader !== `Bearer ${CLIPPER_UPLOAD_KEY}`) {
      reply.status(403)
      return { error: 'invalid key' }
    }
    const body = req.raw
    const key = req.query.path
    const url = STORAGE_PUBLIC_URL + '/' + key
    const metaData = {
      'Content-Type': req.headers['content-type'] || 'application/octet-stream',
    }
    await minioClient.putObject(STORAGE_BUCKET, key, body, undefined, metaData)
    return { url }
  })
})

fastify.listen({ port: UPLOAD_SERVER_PORT, host: '0.0.0.0' }, (err) => {
  if (err) throw err
  logger.info(`server listening on ${fastify.server.address().port}`)
})
