export class BitStream {
    /** @param {Uint8ClampedArray} bytes */
    constructor(bytes: Uint8ClampedArray);
    /** @return {number} */
    available(): number;
    /**
     * @param {number} numBits
     * @return {number}
     */
    readBits(numBits: number): number;
    #private;
}
//# sourceMappingURL=BitStream.d.ts.map