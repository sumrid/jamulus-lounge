import logger from "../../utils/logger.mts"
const MAX_CLIP_TIME = 600e3

export class ClipBufferNode {
  constructor(data, time, timestamp, offset, size) {
    this.data = data

    /** High performance timer */
    this.time = time

    /** Date.now() */
    this.timestamp = timestamp

    this.offset = offset
    this.size = size
    this.next = null
  }
}

export default class ClipBuffer {
  constructor() {
    this.clear()
  }
  clear() {
    this.head = null
    this.tail = null
    this.offset = 0
  }
  add(buffer, size = buffer.length) {
    const time = performance.now()
    const node = new ClipBufferNode(buffer, time, Date.now(), this.offset, size)
    if (this.tail) {
      this.tail.next = node
    }
    this.tail = node
    if (!this.head) {
      this.head = node
    }
    this.prune()
    this.offset += size
  }
  prune() {
    const cutoff = performance.now() - MAX_CLIP_TIME
    while (this.head && this.head.time < cutoff) {
      this.head = this.head.next
    }
  }
  clip() {
    this.prune()
    let node = this.head
    if (!node) return null
    const cutoff = this.tail.time
    const size = this.tail.offset - this.head.offset + this.tail.size
    const timestamp = this.head.timestamp
    const time = this.head.time
    logger.info(
      'Clipping from ' +
        new Date(timestamp).toISOString() +
        ' with length ' +
        Math.round(cutoff - node.time) +
        'ms',
    )
    const iterator = (function* () {
      let sent = 0
      while (node && node.time <= cutoff) {
        yield node
        sent += node.size
        node = node.next
      }
      logger.info(`Sent ${sent}/${size} bytes of clip`)
    })()
    return {
      size,
      timestamp,
      startTime: time,
      endTime: cutoff,
      [Symbol.iterator]() {
        return iterator
      },
    }
  }
}
