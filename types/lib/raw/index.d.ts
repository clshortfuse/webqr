export default jsQR;
export type QRCode = {
    binaryData: number[];
    data: string;
    chunks: Chunks;
    version: number;
    location: {
        topRightCorner: Point;
        topLeftCorner: Point;
        bottomRightCorner: Point;
        bottomLeftCorner: Point;
        topRightFinderPattern: Point;
        topLeftFinderPattern: Point;
        bottomLeftFinderPattern: Point;
        bottomRightAlignmentPattern?: Point;
    };
    matrix: BitMatrix;
};
export type BitMatrix = import("./BitMatrix.js").default;
export type Chunks = import("./decoder/decodeData/index.js").Chunks;
export type Options = {
    inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst";
    greyScaleWeights?: GrayscaleWeights;
    canOverwriteImage?: boolean;
};
/**
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {Options} providedOptions
 * @return {QRCode | null}
 */
declare function jsQR(data: Uint8ClampedArray, width: number, height: number, providedOptions?: Options): QRCode | null;
//# sourceMappingURL=index.d.ts.map