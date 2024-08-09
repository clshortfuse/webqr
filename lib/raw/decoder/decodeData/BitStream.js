/* eslint-disable no-bitwise */

export class BitStream {
  /** @type {Uint8ClampedArray} */
  #bytes;

  #byteOffset = 0;

  #bitOffset = 0;

  /** @param {Uint8ClampedArray} bytes */
  constructor(bytes) {
    this.#bytes = bytes;
  }

  /** @return {number} */
  available() {
    return 8 * (this.#bytes.length - this.#byteOffset) - this.#bitOffset;
  }

  /**
   * @param {number} numBits
   * @return {number}
   */
  readBits(numBits) {
    if (numBits < 1 || numBits > 32 || numBits > this.available()) {
      throw new Error(`Cannot read ${numBits.toString()} bits`);
    }

    let result = 0;
    // First, read remainder from current byte
    if (this.#bitOffset > 0) {
      const bitsLeft = 8 - this.#bitOffset;
      const toRead = numBits < bitsLeft ? numBits : bitsLeft;
      const bitsToNotRead = bitsLeft - toRead;

      const mask = (0xFF >> (8 - toRead)) << bitsToNotRead;
      result = (this.#bytes[this.#byteOffset] & mask) >> bitsToNotRead;
      numBits -= toRead;
      this.#bitOffset += toRead;
      if (this.#bitOffset === 8) {
        this.#bitOffset = 0;
        this.#byteOffset++;
      }
    }

    // Next read whole bytes
    if (numBits > 0) {
      while (numBits >= 8) {
        result = (result << 8) | (this.#bytes[this.#byteOffset] & 0xFF);
        this.#byteOffset++;
        numBits -= 8;
      }

      // Finally read a partial byte
      if (numBits > 0) {
        const bitsToNotRead = 8 - numBits;
        const mask = (0xFF >> bitsToNotRead) << bitsToNotRead;
        result = (result << numBits) | ((this.#bytes[this.#byteOffset] & mask) >> bitsToNotRead);
        this.#bitOffset += numBits;
      }
    }
    return result;
  }
}
