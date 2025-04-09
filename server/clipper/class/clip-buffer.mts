import logger from '../../utils/logger.mts'
const MAX_CLIP_TIME = 600e3

export class ClipBufferNode {
  data: Buffer | null
  time: number
  timestamp: number
  offset: number
  size: number
  next: ClipBufferNode | null

  constructor(
    data: Buffer,
    time: number,
    timestamp: number,
    offset: number,
    size: number,
  ) {
    this.data = data
    this.time = time
    this.timestamp = timestamp
    this.offset = offset
    this.size = size
    this.next = null
  }
}

export default class ClipBuffer {
  private head: ClipBufferNode | null
  private tail: ClipBufferNode | null
  public offset: number

  constructor() {
    this.clear()
  }

  clear(): void {
    this.head = null
    this.tail = null
    this.offset = 0
  }

  add(buffer: Buffer, size: number = buffer.length): void {
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

  prune(): void {
    const cutoff = performance.now() - MAX_CLIP_TIME
    while (this.head && this.head.time < cutoff) {
      const oldNode = this.head
      this.head = this.head.next

      // free memory
      oldNode.next = null
      oldNode.data = null
    }
  }

  clip(): {
    size: number
    timestamp: number
    startTime: number
    endTime: number
    [Symbol.iterator](): Generator<ClipBufferNode, void, unknown>
  } | null {
    this.prune()
    let node = this.head
    if (!node) return null
    const cutoff = this.tail!.time
    const size = this.tail!.offset - node.offset + this.tail!.size
    const timestamp = node.timestamp
    const time = node.time
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
