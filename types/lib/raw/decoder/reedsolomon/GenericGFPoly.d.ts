export default class GenericGFPoly {
    /**
     * @param {GenericGF} field
     * @param {Uint8ClampedArray} coefficients
     */
    constructor(field: GenericGF, coefficients: Uint8ClampedArray);
    degree(): number;
    isZero(): boolean;
    /** @param {number} degree */
    getCoefficient(degree: number): number;
    /** @param {GenericGFPoly} other */
    addOrSubtract(other: GenericGFPoly): GenericGFPoly;
    /** @param {number} scalar */
    multiply(scalar: number): GenericGFPoly;
    /**
     * @param {GenericGFPoly} other
     * @return {GenericGFPoly}
     */
    multiplyPoly(other: GenericGFPoly): GenericGFPoly;
    /**
     * @param {number} degree
     * @param {number} coefficient
     */
    multiplyByMonomial(degree: number, coefficient: number): GenericGFPoly;
    /**
     * @param {number} a
     */
    evaluateAt(a: number): number;
    #private;
}
export type GenericGF = import("./GenericGF.js").default;
//# sourceMappingURL=GenericGFPoly.d.ts.map