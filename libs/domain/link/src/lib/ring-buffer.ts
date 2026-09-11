export class RingBuffer<T> {
  private readonly items: (T | undefined)[];
  private head = 0;
  private count = 0;

  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error('RingBuffer capacity must be a positive integer');
    }

    this.items = new Array(capacity);
  }

  push(item: T): void {
    const tail = (this.head + this.count) % this.capacity;
    this.items[tail] = item;

    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  toArray(): T[] {
    const result: T[] = [];

    for (let i = 0; i < this.count; i++) {
      result.push(this.items[(this.head + i) % this.capacity] as T);
    }

    return result;
  }

  get size(): number {
    return this.count;
  }
}
