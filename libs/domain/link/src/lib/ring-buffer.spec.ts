import { RingBuffer } from './ring-buffer';

describe('RingBuffer', () => {
  it('stores items up to capacity', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    expect(buf.toArray()).toEqual([1, 2, 3]);
  });

  it('drops the oldest item once capacity is exceeded', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    buf.push(4);
    expect(buf.toArray()).toEqual([2, 3, 4]);
  });

  it('reports the correct size', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    expect(buf.size).toBe(1);
  });

  it('rejects a non-positive or non-integer capacity', () => {
    expect(() => new RingBuffer<number>(0)).toThrow(
      'RingBuffer capacity must be a positive integer',
    );

    expect(() => new RingBuffer<number>(-1)).toThrow(
      'RingBuffer capacity must be a positive integer',
    );

    expect(() => new RingBuffer<number>(1.5)).toThrow(
      'RingBuffer capacity must be a positive integer',
    );
  });
});
