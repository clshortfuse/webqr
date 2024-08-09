export default class BitMatrix {
    /**
     * @param {number} width
     * @param {number} height
     * @param {Uint8ClampedArray} [data]
     */
    constructor(width: number, height: number, data?: Uint8ClampedArray);
    width: number;
    height: number;
    data: Uint8ClampedArray;
    /**
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    get(x: number, y: number): boolean;
    /**
     * @param {number} x
     * @param {number} y
     * @param {boolean} value
     * @return {void}
     */
    set(x: number, y: number, value: boolean): void;
    /**
     * @param {number} left
     * @param {number} top
     * @param {number} width
     * @param {number} height
     * @param {boolean} value
     * @return {void}
     */
    setRegion(left: number, top: number, width: number, height: number, value: boolean): void;
}
//# sourceMappingURL=BitMatrix.d.ts.map