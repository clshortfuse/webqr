/**
 * @param {Uint8ClampedArray} data
 * @param {number} version
 * @return {DecodedQR|null}
 */
export function decode(data: Uint8ClampedArray, version: number): DecodedQR | null;
export namespace Mode {
    let Numeric: "numeric";
    let Alphanumeric: "alphanumeric";
    let Byte: "byte";
    let Kanji: "kanji";
    let ECI: "eci";
    let StructuredAppend: "structuredappend";
}
/**
 * <T>
 */
export type EnumOf<T> = T[keyof T];
export type Chunk = {
    type: EnumOf<{
        Numeric: "numeric";
        Alphanumeric: "alphanumeric";
        Byte: "byte";
        Kanji: "kanji";
        ECI: "eci";
        StructuredAppend: "structuredappend";
    }>;
    text: string;
};
export type ByteChunk = {
    type: typeof Mode.Byte | typeof Mode.Kanji;
    bytes: number[];
};
export type ECIChunk = {
    type: typeof Mode.ECI | typeof Mode.Kanji;
    assignmentNumber: number;
};
export type StructuredAppend = {
    type: typeof Mode.StructuredAppend;
    currentSequence: number;
    totalSequence: number;
    parity: number;
};
export type Chunks = Array<Chunk | ByteChunk | ECIChunk | StructuredAppend>;
export type DecodedQR = {
    text: string;
    bytes: number[];
    chunks: Chunks;
    version: number;
};
//# sourceMappingURL=index.d.ts.map