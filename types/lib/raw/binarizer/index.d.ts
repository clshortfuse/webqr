/**
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {boolean} returnInverted
 * @param {GrayscaleWeights} grayscaleWeights
 * @param {boolean} [canOverwriteImage]
 * @return {{binarized:BitMatrix, inverted?:BitMatrix}}
 */
export function binarize(data: Uint8ClampedArray, width: number, height: number, returnInverted: boolean, grayscaleWeights: GrayscaleWeights, canOverwriteImage?: boolean): {
    binarized: BitMatrix;
    inverted?: BitMatrix;
};
import BitMatrix from '../BitMatrix.js';
//# sourceMappingURL=index.d.ts.map