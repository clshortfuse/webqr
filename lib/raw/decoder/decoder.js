import BitMatrix from '../BitMatrix.js';

import { decode as decodeData } from './decodeData/index.js';
import { decode as rsDecode } from './reedsolomon/index.js';
import { VERSIONS } from './version.js';

/** @typedef {import('./version.js').Version} Version */
/** @typedef {import('./decodeData/index.js').DecodedQR} DecodedQR */

/* eslint-disable no-bitwise */

/**
 * @param {number} x
 * @param {number} y
 * @return {number}
 */
function numBitsDiffering(x, y) {
  let z = x ^ y;
  let bitCount = 0;
  while (z) {
    bitCount++;
    z &= z - 1;
  }
  return bitCount;
}

/**
 * @param {any} bit
 * @param {number} byte
 * @return {number}
 */
function pushBit(bit, byte) {
  return (byte << 1) | bit;
}
// tslint:enable:no-bitwise

const FORMAT_INFO_TABLE = [
  { bits: 0x54_12, formatInfo: { errorCorrectionLevel: 1, dataMask: 0 } },
  { bits: 0x51_25, formatInfo: { errorCorrectionLevel: 1, dataMask: 1 } },
  { bits: 0x5E_7C, formatInfo: { errorCorrectionLevel: 1, dataMask: 2 } },
  { bits: 0x5B_4B, formatInfo: { errorCorrectionLevel: 1, dataMask: 3 } },
  { bits: 0x45_F9, formatInfo: { errorCorrectionLevel: 1, dataMask: 4 } },
  { bits: 0x40_CE, formatInfo: { errorCorrectionLevel: 1, dataMask: 5 } },
  { bits: 0x4F_97, formatInfo: { errorCorrectionLevel: 1, dataMask: 6 } },
  { bits: 0x4A_A0, formatInfo: { errorCorrectionLevel: 1, dataMask: 7 } },
  { bits: 0x77_C4, formatInfo: { errorCorrectionLevel: 0, dataMask: 0 } },
  { bits: 0x72_F3, formatInfo: { errorCorrectionLevel: 0, dataMask: 1 } },
  { bits: 0x7D_AA, formatInfo: { errorCorrectionLevel: 0, dataMask: 2 } },
  { bits: 0x78_9D, formatInfo: { errorCorrectionLevel: 0, dataMask: 3 } },
  { bits: 0x66_2F, formatInfo: { errorCorrectionLevel: 0, dataMask: 4 } },
  { bits: 0x63_18, formatInfo: { errorCorrectionLevel: 0, dataMask: 5 } },
  { bits: 0x6C_41, formatInfo: { errorCorrectionLevel: 0, dataMask: 6 } },
  { bits: 0x69_76, formatInfo: { errorCorrectionLevel: 0, dataMask: 7 } },
  { bits: 0x16_89, formatInfo: { errorCorrectionLevel: 3, dataMask: 0 } },
  { bits: 0x13_BE, formatInfo: { errorCorrectionLevel: 3, dataMask: 1 } },
  { bits: 0x1C_E7, formatInfo: { errorCorrectionLevel: 3, dataMask: 2 } },
  { bits: 0x19_D0, formatInfo: { errorCorrectionLevel: 3, dataMask: 3 } },
  { bits: 0x07_62, formatInfo: { errorCorrectionLevel: 3, dataMask: 4 } },
  { bits: 0x02_55, formatInfo: { errorCorrectionLevel: 3, dataMask: 5 } },
  { bits: 0x0D_0C, formatInfo: { errorCorrectionLevel: 3, dataMask: 6 } },
  { bits: 0x08_3B, formatInfo: { errorCorrectionLevel: 3, dataMask: 7 } },
  { bits: 0x35_5F, formatInfo: { errorCorrectionLevel: 2, dataMask: 0 } },
  { bits: 0x30_68, formatInfo: { errorCorrectionLevel: 2, dataMask: 1 } },
  { bits: 0x3F_31, formatInfo: { errorCorrectionLevel: 2, dataMask: 2 } },
  { bits: 0x3A_06, formatInfo: { errorCorrectionLevel: 2, dataMask: 3 } },
  { bits: 0x24_B4, formatInfo: { errorCorrectionLevel: 2, dataMask: 4 } },
  { bits: 0x21_83, formatInfo: { errorCorrectionLevel: 2, dataMask: 5 } },
  { bits: 0x2E_DA, formatInfo: { errorCorrectionLevel: 2, dataMask: 6 } },
  { bits: 0x2B_ED, formatInfo: { errorCorrectionLevel: 2, dataMask: 7 } },
];

/** @type {Array<(p: Point) => boolean>} */
const DATA_MASKS = [
  (p) => ((p.y + p.x) % 2) === 0,
  (p) => (p.y % 2) === 0,
  (p) => p.x % 3 === 0,
  (p) => (p.y + p.x) % 3 === 0,
  (p) => (Math.floor(p.y / 2) + Math.floor(p.x / 3)) % 2 === 0,
  (p) => ((p.x * p.y) % 2) + ((p.x * p.y) % 3) === 0,
  (p) => (((p.y * p.x) % 2) + ((p.y * p.x) % 3)) % 2 === 0,
  (p) => (((p.y + p.x) % 2) + ((p.y * p.x) % 3)) % 2 === 0,
];

/**
 * @typedef FormatInformation
 * @prop {number} errorCorrectionLevel
 * @prop {number} dataMask
 */

/**
 * @param {Version} version
 * @return {BitMatrix}
 */
function buildFunctionPatternMask(version) {
  const dimension = 17 + 4 * version.versionNumber;
  const matrix = new BitMatrix(dimension, dimension);

  matrix.setRegion(0, 0, 9, 9, true); // Top left finder pattern + separator + format
  matrix.setRegion(dimension - 8, 0, 8, 9, true); // Top right finder pattern + separator + format
  matrix.setRegion(0, dimension - 8, 9, 8, true); // Bottom left finder pattern + separator + format

  // Alignment patterns
  for (const x of version.alignmentPatternCenters) {
    for (const y of version.alignmentPatternCenters) {
      if (!(
        (x === 6 && y === 6)
        || (x === 6 && y === dimension - 7)
        || (x === dimension - 7 && y === 6))
      ) {
        matrix.setRegion(x - 2, y - 2, 5, 5, true);
      }
    }
  }

  matrix.setRegion(6, 9, 1, dimension - 17, true); // Vertical timing pattern
  matrix.setRegion(9, 6, dimension - 17, 1, true); // Horizontal timing pattern

  if (version.versionNumber > 6) {
    matrix.setRegion(dimension - 11, 0, 3, 6, true); // Version info, top right
    matrix.setRegion(0, dimension - 11, 6, 3, true); // Version info, bottom left
  }

  return matrix;
}

/**
 * @param {BitMatrix} matrix
 * @param {Version} version
 * @param {FormatInformation} formatInfo
 */
function readCodewords(matrix, version, formatInfo) {
  const dataMask = DATA_MASKS[formatInfo.dataMask];
  const dimension = matrix.height;

  const functionPatternMask = buildFunctionPatternMask(version);

  /** @type {number[]} */
  const codewords = [];
  let currentByte = 0;
  let bitsRead = 0;

  // Read columns in pairs, from right to left
  let readingUp = true;
  for (let columnIndex = dimension - 1; columnIndex > 0; columnIndex -= 2) {
    if (columnIndex === 6) { // Skip whole column with vertical alignment pattern;
      columnIndex--;
    }
    for (let i = 0; i < dimension; i++) {
      const y = readingUp ? dimension - 1 - i : i;
      for (let columnOffset = 0; columnOffset < 2; columnOffset++) {
        const x = columnIndex - columnOffset;
        if (!functionPatternMask.get(x, y)) {
          bitsRead++;
          let bit = matrix.get(x, y);
          if (dataMask({ y, x })) {
            bit = !bit;
          }
          currentByte = pushBit(bit, currentByte);
          if (bitsRead === 8) { // Whole bytes
            codewords.push(currentByte);
            bitsRead = 0;
            currentByte = 0;
          }
        }
      }
    }
    readingUp = !readingUp;
  }
  return codewords;
}

/**
 * @param {BitMatrix} matrix
 * @return {Version|null}
 */
function readVersion(matrix) {
  const dimension = matrix.height;

  const provisionalVersion = Math.floor((dimension - 17) / 4);
  if (provisionalVersion <= 6) { // 6 and under dont have version info in the QR code
    return VERSIONS[provisionalVersion - 1];
  }

  let topRightVersionBits = 0;
  for (let y = 5; y >= 0; y--) {
    for (let x = dimension - 9; x >= dimension - 11; x--) {
      topRightVersionBits = pushBit(matrix.get(x, y), topRightVersionBits);
    }
  }

  let bottomLeftVersionBits = 0;
  for (let x = 5; x >= 0; x--) {
    for (let y = dimension - 9; y >= dimension - 11; y--) {
      bottomLeftVersionBits = pushBit(matrix.get(x, y), bottomLeftVersionBits);
    }
  }

  let bestDifference = Number.POSITIVE_INFINITY;
  /** @type {Version} */
  let bestVersion;
  for (const version of VERSIONS) {
    if (version.infoBits === topRightVersionBits || version.infoBits === bottomLeftVersionBits) {
      return version;
    }

    let difference = numBitsDiffering(topRightVersionBits, version.infoBits);
    if (difference < bestDifference) {
      bestVersion = version;
      bestDifference = difference;
    }

    difference = numBitsDiffering(bottomLeftVersionBits, version.infoBits);
    if (difference < bestDifference) {
      bestVersion = version;
      bestDifference = difference;
    }
  }
  // We can tolerate up to 3 bits of error since no two version info codewords will
  // differ in less than 8 bits.
  if (bestDifference <= 3) {
    return bestVersion;
  }

  return null;
}

/**
 * @param {BitMatrix} matrix
 */
function readFormatInformation(matrix) {
  let topLeftFormatInfoBits = 0;
  for (let x = 0; x <= 8; x++) {
    if (x !== 6) { // Skip timing pattern bit
      topLeftFormatInfoBits = pushBit(matrix.get(x, 8), topLeftFormatInfoBits);
    }
  }
  for (let y = 7; y >= 0; y--) {
    if (y !== 6) { // Skip timing pattern bit
      topLeftFormatInfoBits = pushBit(matrix.get(8, y), topLeftFormatInfoBits);
    }
  }

  const dimension = matrix.height;
  let topRightBottomRightFormatInfoBits = 0;
  for (let y = dimension - 1; y >= dimension - 7; y--) { // bottom left
    topRightBottomRightFormatInfoBits = pushBit(matrix.get(8, y), topRightBottomRightFormatInfoBits);
  }
  for (let x = dimension - 8; x < dimension; x++) { // top right
    topRightBottomRightFormatInfoBits = pushBit(matrix.get(x, 8), topRightBottomRightFormatInfoBits);
  }

  let bestDifference = Number.POSITIVE_INFINITY;
  let bestFormatInfo = null;
  for (const { bits, formatInfo } of FORMAT_INFO_TABLE) {
    if (bits === topLeftFormatInfoBits || bits === topRightBottomRightFormatInfoBits) {
      return formatInfo;
    }
    let difference = numBitsDiffering(topLeftFormatInfoBits, bits);
    if (difference < bestDifference) {
      bestFormatInfo = formatInfo;
      bestDifference = difference;
    }
    if (topLeftFormatInfoBits !== topRightBottomRightFormatInfoBits) { // also try the other option
      difference = numBitsDiffering(topRightBottomRightFormatInfoBits, bits);
      if (difference < bestDifference) {
        bestFormatInfo = formatInfo;
        bestDifference = difference;
      }
    }
  }
  // Hamming distance of the 32 masked codes is 7, by construction, so <= 3 bits differing means we found a match
  if (bestDifference <= 3) {
    return bestFormatInfo;
  }
  return null;
}

/**
 *
 * @param {number[]} codewords
 * @param {Version} version
 * @param {number} ecLevel
 */
function getDataBlocks(codewords, version, ecLevel) {
  const ecInfo = version.errorCorrectionLevels[ecLevel];
  /** @type {Array<{numDataCodewords: number, codewords: number[]}>} */
  const dataBlocks = [];

  let totalCodewords = 0;
  ecInfo.ecBlocks.forEach((block) => {
    for (let i = 0; i < block.numBlocks; i++) {
      dataBlocks.push({ numDataCodewords: block.dataCodewordsPerBlock, codewords: [] });
      totalCodewords += block.dataCodewordsPerBlock + ecInfo.ecCodewordsPerBlock;
    }
  });

  // In some cases the QR code will be malformed enough that we pull off more or less than we should.
  // If we pull off less there's nothing we can do.
  // If we pull off more we can safely truncate
  if (codewords.length < totalCodewords) {
    return null;
  }
  codewords = codewords.slice(0, totalCodewords);

  const shortBlockSize = ecInfo.ecBlocks[0].dataCodewordsPerBlock;
  // Pull codewords to fill the blocks up to the minimum size
  for (let i = 0; i < shortBlockSize; i++) {
    for (const dataBlock of dataBlocks) {
      dataBlock.codewords.push(codewords.shift());
    }
  }

  // If there are any large blocks, pull codewords to fill the last element of those
  if (ecInfo.ecBlocks.length > 1) {
    const smallBlockCount = ecInfo.ecBlocks[0].numBlocks;
    const largeBlockCount = ecInfo.ecBlocks[1].numBlocks;
    for (let i = 0; i < largeBlockCount; i++) {
      dataBlocks[smallBlockCount + i].codewords.push(codewords.shift());
    }
  }

  // Add the rest of the codewords to the blocks. These are the error correction codewords.
  while (codewords.length > 0) {
    for (const dataBlock of dataBlocks) {
      dataBlock.codewords.push(codewords.shift());
    }
  }

  return dataBlocks;
}

/**
 * @param {BitMatrix} matrix
 */
function decodeMatrix(matrix) {
  const version = readVersion(matrix);
  if (!version) {
    return null;
  }

  const formatInfo = readFormatInformation(matrix);
  if (!formatInfo) {
    return null;
  }

  const codewords = readCodewords(matrix, version, formatInfo);
  const dataBlocks = getDataBlocks(codewords, version, formatInfo.errorCorrectionLevel);
  if (!dataBlocks) {
    return null;
  }

  // Count total number of data bytes
  const totalBytes = dataBlocks.reduce((a, b) => a + b.numDataCodewords, 0);
  const resultBytes = new Uint8ClampedArray(totalBytes);

  let resultIndex = 0;
  for (const dataBlock of dataBlocks) {
    const correctedBytes = rsDecode(dataBlock.codewords, dataBlock.codewords.length - dataBlock.numDataCodewords);
    if (!correctedBytes) {
      return null;
    }
    for (let i = 0; i < dataBlock.numDataCodewords; i++) {
      resultBytes[resultIndex++] = correctedBytes[i];
    }
  }

  try {
    return decodeData(resultBytes, version.versionNumber);
  } catch (e) {
    return null;
  }
}

/**
 * @param {BitMatrix} matrix
 * @return {DecodedQR}
 */
export function decode(matrix) {
  if (matrix == null) {
    return null;
  }
  const result = decodeMatrix(matrix);
  if (result) {
    return result;
  }
  // Decoding didn't work, try mirroring the QR across the topLeft -> bottomRight line.
  for (let x = 0; x < matrix.width; x++) {
    for (let y = x + 1; y < matrix.height; y++) {
      if (matrix.get(x, y) !== matrix.get(y, x)) {
        matrix.set(x, y, !matrix.get(x, y));
        matrix.set(y, x, !matrix.get(y, x));
      }
    }
  }
  return decodeMatrix(matrix);
}
