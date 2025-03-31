const MAX_CLIP_TIME = 600e3

export class EventBufferNode {
  constructor(time, timestamp, state, event) {
    this.time = time
    this.timestamp = timestamp
    this.state = state
    this.event = event
    this.next = null
  }
}

export default class EventBuffer {
  constructor() {
    this.clear()
  }
  clear() {
    this.head = null
    this.tail = null
    this.size = 0
  }
  add(state, event) {
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
  prune() {
    const cutoff = performance.now() - MAX_CLIP_TIME
    while (this.head && this.head.time < cutoff) {
      this.head = this.head.next
      this.size--
    }
  }
  slice(startTime, endTime) {
    let node = this.head
    if (!node) return null
    const out = []
    let initialState
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
