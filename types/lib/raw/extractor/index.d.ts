/**
 * @param {BitMatrix} image
 * @param {QRLocation} location
 */
export function extract(image: BitMatrix, location: QRLocation): {
    matrix: BitMatrix;
    mappingFunction: (x: number, y: number) => Point;
};
export type PerspectiveTransform = {
    a11: number;
    a21: number;
    a31: number;
    a12: number;
    a22: number;
    a32: number;
    a13: number;
    a23: number;
    a33: number;
};
import BitMatrix from '../BitMatrix.js';
//# sourceMappingURL=index.d.ts.map