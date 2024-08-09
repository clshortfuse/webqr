import BitMatrix from '../BitMatrix.js';

const REGION_SIZE = 8;
const MIN_DYNAMIC_RANGE = 24;

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function numBetween(value, min, max) {
  return value < min ? min : (value > max ? max : value);
}

// Like BitMatrix but accepts arbitry Uint8 values
class Matrix {
  /**
   * @param {number} width
   * @param {number} height
   * @param {Uint8ClampedArray} [buffer]
   */
  constructor(width, height, buffer) {
    this.width = width;
    const bufferSize = width * height;
    if (buffer && buffer.length !== bufferSize) {
      throw new Error('Wrong buffer size');
    }
    this.data = buffer || new Uint8ClampedArray(bufferSize);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @return {number}
   */
  get(x, y) {
    return this.data[y * this.width + x];
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} value
   */
  set(x, y, value) {
    this.data[y * this.width + x] = value;
  }
}

/**
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {boolean} returnInverted
 * @param {GrayscaleWeights} grayscaleWeights
 * @param {boolean} [canOverwriteImage]
 * @return {{binarized:BitMatrix, inverted?:BitMatrix}}
 */
export function binarize(
  data,
  width,
  height,
  returnInverted,
  grayscaleWeights,
  canOverwriteImage,
) {
  const pixelCount = width * height;
  if (data.length !== pixelCount * 4) {
    throw new Error('Malformed data passed to binarizer.');
  }
  // assign the grayscale and binary image within the rgba buffer as the rgba
  // image will not be needed after conversion
  let bufferOffset = 0;
  // Convert image to grayscale
  /** @type {Uint8ClampedArray} */
  let grayscaleBuffer;
  if (canOverwriteImage) {
    grayscaleBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
    bufferOffset += pixelCount;
  }
  const grayscalePixels = new Matrix(width, height, grayscaleBuffer);
  if (grayscaleWeights.useIntegerApproximation) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelPosition = (y * width + x) * 4;
        const r = data[pixelPosition];
        const g = data[pixelPosition + 1];
        const b = data[pixelPosition + 2];
        grayscalePixels.set(
          x,
          y,
          // eslint-disable-next-line no-bitwise
          (grayscaleWeights.red * r + grayscaleWeights.green * g + grayscaleWeights.blue * b + 128) >> 8,
        );
      }
    }
  } else {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelPosition = (y * width + x) * 4;
        const r = data[pixelPosition];
        const g = data[pixelPosition + 1];
        const b = data[pixelPosition + 2];
        grayscalePixels.set(
          x,
          y,
          grayscaleWeights.red * r + grayscaleWeights.green * g + grayscaleWeights.blue * b,
        );
      }
    }
  }
  const horizontalRegionCount = Math.ceil(width / REGION_SIZE);
  const verticalRegionCount = Math.ceil(height / REGION_SIZE);
  const blackPointsCount = horizontalRegionCount * verticalRegionCount;

  /** @type {Uint8ClampedArray} */
  let blackPointsBuffer;
  if (canOverwriteImage) {
    blackPointsBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, blackPointsCount);
    bufferOffset += blackPointsCount;
  }
  const blackPoints = new Matrix(horizontalRegionCount, verticalRegionCount, blackPointsBuffer);
  for (let verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
    for (let hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
      let min = Number.POSITIVE_INFINITY;
      let max = 0;
      for (let y = 0; y < REGION_SIZE; y++) {
        for (let x = 0; x < REGION_SIZE; x++) {
          const pixelLumosity = grayscalePixels.get(
            hortizontalRegion * REGION_SIZE + x,
            verticalRegion * REGION_SIZE + y,
          );
          min = Math.min(min, pixelLumosity);
          max = Math.max(max, pixelLumosity);
        }
      }
      // We could also compute the real average of all pixels but following the
      // assumption that the qr code consists of bright and dark pixels and
      // essentially not much in between, by (min + max)/2 we make the cut
      // really between those two classes. If using the average over all pixel
      // in a block of mostly bright pixels and few dark pixels, the avg would
      // tend to the bright side and darker bright pixels could be interpreted
      // as dark.
      let average = (min + max) / 2;
      // Small bias towards black by moving the threshold up. We do this, as in
      // the finder patterns white holes tend to appear which makes them undetectable.
      const blackBias = 1.11;
      average = Math.min(255, average * blackBias);
      if (max - min <= MIN_DYNAMIC_RANGE) {
        // If variation within the block is low, assume this is a block with only light or only
        // dark pixels. In that case we do not want to use the average, as it would divide this
        // low contrast area into black and white pixels, essentially creating data out of noise.
        //
        // Default the blackpoint for these blocks to be half the min - effectively white them out
        average = min / 2;

        if (verticalRegion > 0 && hortizontalRegion > 0) {
          // Correct the "white background" assumption for blocks that have neighbors by comparing
          // the pixels in this block to the previously calculated black points. This is based on
          // the fact that dark barcode symbology is always surrounded by some amount of light
          // background for which reasonable black point estimates were made. The bp estimated at
          // the boundaries is used for the interior.

          // The (min < bp) is arbitrary but works better than other heuristics that were tried.
          const averageNeighborBlackPoint = (
            blackPoints.get(hortizontalRegion, verticalRegion - 1)
            + (2 * blackPoints.get(hortizontalRegion - 1, verticalRegion))
            + blackPoints.get(hortizontalRegion - 1, verticalRegion - 1)
          ) / 4;
          if (min < averageNeighborBlackPoint) {
            average = averageNeighborBlackPoint; // no need to apply black bias as already applied to neighbors
          }
        }
      }
      blackPoints.set(hortizontalRegion, verticalRegion, average);
    }
  }

  /** @type {BitMatrix} */
  let binarized;
  if (canOverwriteImage) {
    const binarizedBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
    bufferOffset += pixelCount;
    binarized = new BitMatrix(width, height, binarizedBuffer);
  } else {
    binarized = new BitMatrix(width, height);
  }

  /** @type {BitMatrix} */
  let inverted = null;
  if (returnInverted) {
    if (canOverwriteImage) {
      const invertedBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
      inverted = new BitMatrix(width, height, invertedBuffer);
    } else {
      inverted = new BitMatrix(width, height);
    }
  }

  for (let verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
    for (let hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
      const left = numBetween(hortizontalRegion, 2, horizontalRegionCount - 3);
      const top = numBetween(verticalRegion, 2, verticalRegionCount - 3);
      let sum = 0;
      for (let xRegion = -2; xRegion <= 2; xRegion++) {
        for (let yRegion = -2; yRegion <= 2; yRegion++) {
          sum += blackPoints.get(left + xRegion, top + yRegion);
        }
      }
      const threshold = sum / 25;
      for (let xRegion = 0; xRegion < REGION_SIZE; xRegion++) {
        for (let yRegion = 0; yRegion < REGION_SIZE; yRegion++) {
          const x = hortizontalRegion * REGION_SIZE + xRegion;
          const y = verticalRegion * REGION_SIZE + yRegion;
          const lum = grayscalePixels.get(x, y);
          binarized.set(x, y, lum <= threshold);
          if (returnInverted) {
            inverted.set(x, y, !(lum <= threshold));
          }
        }
      }
    }
  }
  if (returnInverted) {
    return { binarized, inverted };
  }
  return { binarized };
}
