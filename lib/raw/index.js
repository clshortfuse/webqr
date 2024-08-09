/** @typedef {import('./BitMatrix.js').default} BitMatrix */
/** @typedef {import('./decoder/decodeData/index.js').Chunks} Chunks */

import { binarize } from './binarizer/index.js';
import { decode } from './decoder/decoder.js';
import { extract } from './extractor/index.js';
import { locate } from './locator/index.js';

/**
 * @typedef {{
 *   binaryData: number[];
 *   data: string;
 *   chunks: Chunks;
 *   version: number;
 *   location: {
 *     topRightCorner: Point;
 *     topLeftCorner: Point;
 *     bottomRightCorner: Point;
 *     bottomLeftCorner: Point;
 *     topRightFinderPattern: Point;
 *     topLeftFinderPattern: Point;
 *     bottomLeftFinderPattern: Point;
 *     bottomRightAlignmentPattern?: Point;
 *   };
 *   matrix: BitMatrix;
 * }} QRCode
 */

/**
 * @param {BitMatrix} matrix
 * @return {QRCode|null}
 */
function scan(matrix) {
  const locations = locate(matrix);
  if (!locations) {
    return null;
  }

  for (const location of locations) {
    const extracted = extract(matrix, location);
    const decoded = decode(extracted.matrix);
    if (decoded) {
      return {
        binaryData: decoded.bytes,
        data: decoded.text,
        chunks: decoded.chunks,
        version: decoded.version,
        location: {
          topRightCorner: extracted.mappingFunction(location.dimension, 0),
          topLeftCorner: extracted.mappingFunction(0, 0),
          bottomRightCorner: extracted.mappingFunction(location.dimension, location.dimension),
          bottomLeftCorner: extracted.mappingFunction(0, location.dimension),

          topRightFinderPattern: location.topRight,
          topLeftFinderPattern: location.topLeft,
          bottomLeftFinderPattern: location.bottomLeft,

          bottomRightAlignmentPattern: location.alignmentPattern,
        },
        matrix: extracted.matrix,
      };
    }
  }
  return null;
}

/**
 * @typedef Options
 * @prop {'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst'} [inversionAttempts]
 * @prop {GrayscaleWeights} [greyScaleWeights]
 * @prop {boolean} [canOverwriteImage]
 */

/** @type {Options} */
const defaultOptions = {
  inversionAttempts: 'attemptBoth',
  greyScaleWeights: {
    red: 0.2126,
    green: 0.7152,
    blue: 0.0722,
    useIntegerApproximation: false,
  },
  canOverwriteImage: true,
};

/**
 * @param {any} target
 * @param {any} src
 */
function mergeObject(target, src) {
  Object.keys(src).forEach((opt) => { // Sad implementation of Object.assign since we target es5 not es6
    target[opt] = src[opt];
  });
}

/**
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {Options} providedOptions
 * @return {QRCode | null}
 */
function jsQR(data, width, height, providedOptions = {}) {
  const options = Object.create(null);
  mergeObject(options, defaultOptions);
  mergeObject(options, providedOptions);

  const tryInvertedFirst = options.inversionAttempts === 'onlyInvert'
    || options.inversionAttempts === 'invertFirst';
  const shouldInvert = options.inversionAttempts === 'attemptBoth'
    || tryInvertedFirst;
  const { binarized, inverted } = binarize(
    data,
    width,
    height,
    shouldInvert,
    options.greyScaleWeights,
    options.canOverwriteImage,
  );
  let result = scan(tryInvertedFirst ? inverted : binarized);
  if (!result && (options.inversionAttempts === 'attemptBoth' || options.inversionAttempts === 'invertFirst')) {
    result = scan(tryInvertedFirst ? binarized : inverted);
  }
  return result;
}

/** @type {any} */ (jsQR).default = jsQR;
export default jsQR;
