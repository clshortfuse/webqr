export default class GenericGF {
    /**
     *
     * @param {number} primitive
     * @param {number} size
     * @param {number} genBase
     */
    constructor(primitive: number, size: number, genBase: number);
    /** @type {number} */ primitive: number;
    /** @type {number} */ size: number;
    /** @type {number} */ generatorBase: number;
    /** @type {GenericGFPoly} */ zero: GenericGFPoly;
    /** @type {GenericGFPoly} */ one: GenericGFPoly;
    /**
     * @param {number} a
     * @param {number} b
     * @return {number}
     */
    multiply(a: number, b: number): number;
    /**
     * @param {number} a
     * @return {number}
     */
    inverse(a: number): number;
    /**
     * @param {number} degree
     * @param {number} coefficient
     * @return {GenericGFPoly}
     */
    buildMonomial(degree: number, coefficient: number): GenericGFPoly;
    /**
     * @param {number} a
     * @return {number}
     */
    log(a: number): number;
    /**
     * @param {number} a
     * @return {number}
     */
    exp(a: number): number;
    #private;
}
import GenericGFPoly from './GenericGFPoly.js';
//# sourceMappingURL=GenericGF.d.ts.map