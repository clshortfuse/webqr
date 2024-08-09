/** @typedef {import('./GenericGF.js').default} GenericGF */

import { addOrSubtractGF } from './common.js';

export default class GenericGFPoly {
  /** @type {GenericGF} */
  #field;

  /** @type {Uint8ClampedArray} */
  #coefficients;

  /**
   * @param {GenericGF} field
   * @param {Uint8ClampedArray} coefficients
   */
  constructor(field, coefficients) {
    if (coefficients.length === 0) {
      throw new Error('No coefficients.');
    }
    this.#field = field;
    const coefficientsLength = coefficients.length;
    if (coefficientsLength > 1 && coefficients[0] === 0) {
      // Leading term must be non-zero for anything except the constant polynomial "0"
      let firstNonZero = 1;
      while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
        firstNonZero++;
      }
      if (firstNonZero === coefficientsLength) {
        this.#coefficients = field.zero.#coefficients;
      } else {
        this.#coefficients = new Uint8ClampedArray(coefficientsLength - firstNonZero);
        for (let i = 0; i < this.#coefficients.length; i++) {
          this.#coefficients[i] = coefficients[firstNonZero + i];
        }
      }
    } else {
      this.#coefficients = coefficients;
    }
  }

  degree() {
    return this.#coefficients.length - 1;
  }

  isZero() {
    return this.#coefficients[0] === 0;
  }

  /** @param {number} degree */
  getCoefficient(degree) {
    return this.#coefficients[this.#coefficients.length - 1 - degree];
  }

  /** @param {GenericGFPoly} other */
  addOrSubtract(other) {
    if (this.isZero()) {
      return other;
    }
    if (other.isZero()) {
      return this;
    }

    let smallerCoefficients = this.#coefficients;
    let largerCoefficients = other.#coefficients;
    if (smallerCoefficients.length > largerCoefficients.length) {
      [smallerCoefficients, largerCoefficients] = [largerCoefficients, smallerCoefficients];
    }
    const sumDiff = new Uint8ClampedArray(largerCoefficients.length);
    const lengthDiff = largerCoefficients.length - smallerCoefficients.length;
    for (let i = 0; i < lengthDiff; i++) {
      sumDiff[i] = largerCoefficients[i];
    }

    for (let i = lengthDiff; i < largerCoefficients.length; i++) {
      sumDiff[i] = addOrSubtractGF(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
    }

    return new GenericGFPoly(this.#field, sumDiff);
  }

  /** @param {number} scalar */
  multiply(scalar) {
    if (scalar === 0) {
      return this.#field.zero;
    }
    if (scalar === 1) {
      return this;
    }
    const size = this.#coefficients.length;
    const product = new Uint8ClampedArray(size);
    for (let i = 0; i < size; i++) {
      product[i] = this.#field.multiply(this.#coefficients[i], scalar);
    }

    return new GenericGFPoly(this.#field, product);
  }

  /**
   * @param {GenericGFPoly} other
   * @return {GenericGFPoly}
   */
  multiplyPoly(other) {
    if (this.isZero() || other.isZero()) {
      return this.#field.zero;
    }
    const aCoefficients = this.#coefficients;
    const aLength = aCoefficients.length;
    const bCoefficients = other.#coefficients;
    const bLength = bCoefficients.length;
    const product = new Uint8ClampedArray(aLength + bLength - 1);
    for (let i = 0; i < aLength; i++) {
      const aCoeff = aCoefficients[i];
      for (let j = 0; j < bLength; j++) {
        product[i + j] = addOrSubtractGF(
          product[i + j],
          this.#field.multiply(aCoeff, bCoefficients[j]),
        );
      }
    }
    return new GenericGFPoly(this.#field, product);
  }

  /**
   * @param {number} degree
   * @param {number} coefficient
   */
  multiplyByMonomial(degree, coefficient) {
    if (degree < 0) {
      throw new Error('Invalid degree less than 0');
    }
    if (coefficient === 0) {
      return this.#field.zero;
    }
    const size = this.#coefficients.length;
    const product = new Uint8ClampedArray(size + degree);
    for (let i = 0; i < size; i++) {
      product[i] = this.#field.multiply(this.#coefficients[i], coefficient);
    }
    return new GenericGFPoly(this.#field, product);
  }

  /**
   * @param {number} a
   */
  evaluateAt(a) {
    let result = 0;
    if (a === 0) {
      // Just return the x^0 coefficient
      return this.getCoefficient(0);
    }
    const size = this.#coefficients.length;
    if (a === 1) {
      // Just the sum of the coefficients
      this.#coefficients.forEach((coefficient) => {
        result = addOrSubtractGF(result, coefficient);
      });
      return result;
    }
    result = this.#coefficients[0];
    for (let i = 1; i < size; i++) {
      result = addOrSubtractGF(this.#field.multiply(a, result), this.#coefficients[i]);
    }
    return result;
  }
}
