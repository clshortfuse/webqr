/**
 * @typedef {{
 * infoBits: number;
 * versionNumber: number;
 * alignmentPatternCenters: number[];
 * errorCorrectionLevels: Array<{
 *   ecCodewordsPerBlock: number;
 *   ecBlocks: Array<{
 *     numBlocks: number;
 *     dataCodewordsPerBlock: number;
 *   }>
 * }>
 * }} Version
 */
/** @type {Version[]} */
export const VERSIONS: Version[];
export type Version = {
    infoBits: number;
    versionNumber: number;
    alignmentPatternCenters: number[];
    errorCorrectionLevels: Array<{
        ecCodewordsPerBlock: number;
        ecBlocks: Array<{
            numBlocks: number;
            dataCodewordsPerBlock: number;
        }>;
    }>;
};
//# sourceMappingURL=version.d.ts.map