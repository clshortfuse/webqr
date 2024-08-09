/**
 * @param {BitMatrix} matrix
 * @return {QRLocation[]}
 */
export function locate(matrix: BitMatrix): QRLocation[];
export type Quad = {
    top: {
        startX: number;
        endX: number;
        y: number;
    };
    bottom: {
        startX: number;
        endX: number;
        y: number;
    };
};
export type BitMatrix = import("../BitMatrix.js").default;
//# sourceMappingURL=index.d.ts.map