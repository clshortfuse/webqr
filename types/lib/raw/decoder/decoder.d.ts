/**
 * @param {BitMatrix} matrix
 * @return {DecodedQR}
 */
export function decode(matrix: BitMatrix): DecodedQR;
export type Version = import("./version.js").Version;
export type DecodedQR = import("./decodeData/index.js").DecodedQR;
export type FormatInformation = {
    errorCorrectionLevel: number;
    dataMask: number;
};
import BitMatrix from '../BitMatrix.js';
//# sourceMappingURL=decoder.d.ts.map