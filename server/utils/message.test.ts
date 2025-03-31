import { extract } from './message.mts'

describe('extract', () => {
  it('should extract user, text, and command from a simple message', () => {
    const result = extract(
      '<font color="darkorchid">(07:55:01 PM) <b>testing</b></font> /ai message',
    )
    expect(result).toEqual({
      user: 'testing',
      text: 'message',
      command: '/ai',
    })
  })

  it('should extract user, sub-user, text, and command from a message with sub-user', () => {
    const result = extract(
      '<font color="mediumblue">(07:32:37 PM) <b>testing</b></font> [sub-user] /ai message',
    )
    expect(result).toEqual({
      user: 'sub-user',
      text: 'message',
      command: '/ai',
    })
  })

  it('should handle extra spaces in user and text', () => {
    const result = extract(
      '<font color="mediumblue">(07:32:37 PM) <b>testing</b></font> [ listener ] /ai  this is the message   ',
    )
    expect(result).toEqual({
      user: 'listener',
      text: 'this is the message',
      command: '/ai',
    })
  })

  it('should extract command and text without sub-user', () => {
    const result = extract(
      '<font color="darkorchid">(07:55:01 PM) <b>testing</b></font> /chord this is song name',
    )
    expect(result).toEqual({
      user: 'testing',
      text: 'this is song name',
      command: '/chord',
    })
  })

  it('should handle cases where no command is present', () => {
    const result = extract(
      '<font color="darkorchid">(07:55:01 PM) <b>testing</b></font> this is just a message',
    )
    expect(result).toEqual({
      user: 'testing',
      text: 'this is just a message',
      command: '',
    })
  })

  it('should handle cases where user is malformed', () => {
    const result = extract(
      '<font color="darkorchid">(07:55:01 PM) <b>   testing  [0]   </b></font> this should not match /ai this should not match',
    )
    expect(result).toEqual({
      user: 'user',
      text: 'this should not match /ai this should not match',
      command: '',
    })
  })
})
