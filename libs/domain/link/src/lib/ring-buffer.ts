export class RingBuffer<T> {
  private items: T[] = [];

  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error('RingBuffer capacity must be a positive integer');
    }
  }

  push(item: T): void {
    this.items.push(item);

    if (this.items.length > this.capacity) {
      this.items.shift();
    }
  }

  toArray(): T[] {
    return [...this.items];
  }

  get size(): number {
    return this.items.length;
  }
}
