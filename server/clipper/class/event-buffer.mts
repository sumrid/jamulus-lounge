const MAX_CLIP_TIME = 600e3

export class EventBufferNode {
  time: number
  timestamp: number
  state: any
  event: any
  next: EventBufferNode | null

  constructor(time: number, timestamp: number, state: any, event: any) {
    this.time = time
    this.timestamp = timestamp
    this.state = state
    this.event = event
    this.next = null
  }
}

interface EventData {
  time: number
  timestamp: number
  data: any
}

export default class EventBuffer {
  head: EventBufferNode | null
  tail: EventBufferNode | null
  size: number

  constructor() {
    this.clear()
  }

  clear(): void {
    this.head = null
    this.tail = null
    this.size = 0
  }

  add(state: any, event: any): void {
    const time = performance.now()
    const node = new EventBufferNode(time, Date.now(), state, event)
    if (this.tail) {
      this.tail.next = node
    }
    this.tail = node
    if (!this.head) {
      this.head = node
    }
    this.prune()
    this.size++
  }

  prune(): void {
    const cutoff = performance.now() - MAX_CLIP_TIME
    while (this.head && this.head.time < cutoff) {
      const oldNode = this.head
      this.head = this.head.next
      this.size--

      oldNode.next = null
      oldNode.event = null
      oldNode.state = null
    }
  }

  slice(startTime: number, endTime: number): [any, EventData[]] | null {
    let node = this.head
    if (!node) return null
    const out: EventData[] = []
    let initialState: any
    while (node && node.time <= endTime) {
      if (node.time >= startTime) {
        if (!initialState) {
          initialState = node.state
        }
        out.push({
          time: node.time,
          timestamp: node.timestamp,
          data: node.event,
        })
      }
      node = node.next
    }
    return [initialState, out]
  }
}
