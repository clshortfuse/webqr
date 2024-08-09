import GenericGFPoly from './GenericGFPoly.js';

export default class GenericGF {
  /** @type {number[]} */
  #expTable;

  /** @type {number[]} */
  #logTable;

  /** @type {number} */ primitive;

  /** @type {number} */ size;

  /** @type {number} */ generatorBase;

  /** @type {GenericGFPoly} */ zero;

  /** @type {GenericGFPoly} */ one;

  /**
   *
   * @param {number} primitive
   * @param {number} size
   * @param {number} genBase
   */
  constructor(primitive, size, genBase) {
    this.primitive = primitive;
    this.size = size;
    this.generatorBase = genBase;
    // eslint-disable-next-line unicorn/no-new-array
    this.#expTable = new Array(this.size);
    // eslint-disable-next-line unicorn/no-new-array
    this.#logTable = new Array(this.size);

    let x = 1;
    for (let i = 0; i < this.size; i++) {
      this.#expTable[i] = x;
      x *= 2;
      if (x >= this.size) {
        x = (x ^ this.primitive) & (this.size - 1); // eslint-disable-line no-bitwise
      }
    }

    for (let i = 0; i < this.size - 1; i++) {
      this.#logTable[this.#expTable[i]] = i;
    }
    this.zero = new GenericGFPoly(this, Uint8ClampedArray.from([0]));
    this.one = new GenericGFPoly(this, Uint8ClampedArray.from([1]));
  }

  /**
   * @param {number} a
   * @param {number} b
   * @return {number}
   */
  multiply(a, b) {
    if (a === 0 || b === 0) {
      return 0;
    }
    return this.#expTable[(this.#logTable[a] + this.#logTable[b]) % (this.size - 1)];
  }

  /**
   * @param {number} a
   * @return {number}
   */
  inverse(a) {
    if (a === 0) {
      throw new Error("Can't invert 0");
    }
    return this.#expTable[this.size - this.#logTable[a] - 1];
  }

  /**
   * @param {number} degree
   * @param {number} coefficient
   * @return {GenericGFPoly}
   */
  buildMonomial(degree, coefficient) {
    if (degree < 0) {
      throw new Error('Invalid monomial degree less than 0');
    }
    if (coefficient === 0) {
      return this.zero;
    }
    const coefficients = new Uint8ClampedArray(degree + 1);
    coefficients[0] = coefficient;
    return new GenericGFPoly(this, coefficients);
  }

  /**
   * @param {number} a
   * @return {number}
   */
  log(a) {
    if (a === 0) {
      throw new Error("Can't take log(0)");
    }
    return this.#logTable[a];
  }

  /**
   * @param {number} a
   * @return {number}
   */
  exp(a) {
    return this.#expTable[a];
  }
}
