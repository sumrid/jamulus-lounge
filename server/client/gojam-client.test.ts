import { expect, jest, mock, test } from 'bun:test'
import GoJamClient from './gojam-client.mjs'

// Mock environment variable
process.env.GOJAM_API_PORT = '3000'

// Mock axios
const postMock = jest.fn()
const patchMock = jest.fn()
mock.module('axios', () => ({
  create: jest.fn().mockReturnValue({
    post: postMock,
    patch: patchMock,
  })
}))

test('getInstance returns same instance (singleton)', () => {
  const instance1 = GoJamClient.getInstance()
  const instance2 = GoJamClient.getInstance()
  expect(instance1).toBe(instance2)
})

test.skip('sendJamulusChat sends correct POST request', async () => {
  const client = GoJamClient.getInstance()
  const message = 'Hello, Jamulus!'

  await client.sendJamulusChat(message)

  expect(postMock).toHaveBeenCalledTimes(1)

  expect(postMock).toHaveBeenCalledWith(
    '/chat',
    { message }
  )
})

test.skip('updateChannelInfo sends correct PATCH request', async () => {
  const client = GoJamClient.getInstance()
  const name = 'Test Channel'

  await client.updateChannelInfo(name)

  expect(patchMock).toHaveBeenCalledTimes(1)

  expect(patchMock).toHaveBeenCalledWith(
    '/channel-info',
    expect.objectContaining({
      name
    })
  )
})
