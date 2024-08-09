export default class BitMatrix {
  /**
   * @param {number} width
   * @param {number} height
   * @param {Uint8ClampedArray} [data]
   */
  constructor(width, height, data = new Uint8ClampedArray(width * height)) {
    this.width = width;
    this.height = height;
    this.data = data;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @return {boolean}
   */
  get(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    return Boolean(this.data[y * this.width + x]);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {boolean} value
   * @return {void}
   */
  set(x, y, value) {
    this.data[y * this.width + x] = value ? 1 : 0;
  }

  /**
   * @param {number} left
   * @param {number} top
   * @param {number} width
   * @param {number} height
   * @param {boolean} value
   * @return {void}
   */
  setRegion(left, top, width, height, value) {
    for (let y = top; y < top + height; y++) {
      for (let x = left; x < left + width; x++) {
        this.set(x, y, Boolean(value));
      }
    }
  }
}
