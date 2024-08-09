/* eslint-disable no-bitwise */

import { BitStream } from './BitStream.js';

export const Mode = {
  Numeric: /** @type {'numeric'} */  ('numeric'),
  Alphanumeric: /** @type {'alphanumeric'} */ ('alphanumeric'),
  Byte: /** @type {'byte'} */ ('byte'),
  Kanji: /** @type {'kanji'} */ ('kanji'),
  ECI: /** @type {'eci'} */ ('eci'),
  StructuredAppend: /** @type {'structuredappend'} */ ('structuredappend'),
};

const ModeByte = {
  Terminator: /** @type {0x0} */ (0x0),
  Numeric: /** @type {0x1} */ (0x1),
  Alphanumeric: /** @type {0x2} */ (0x2),
  Byte: /** @type {0x4} */ (0x4),
  Kanji: /** @type {0x8} */ (0x8),
  ECI: /** @type {0x7} */ (0x7),
  StructuredAppend: /** @type {0x3} */ (0x3),
  // FNC1FirstPosition = 0x5,
  // FNC1SecondPosition = 0x9,
};

/**
 * @template T
 * @typedef {T[keyof T]} EnumOf<T>
 */

/**
 * @typedef Chunk
 * @prop {EnumOf<Mode>} type
 * @prop {string} text
 */

/**
 * @typedef ByteChunk
 * @prop {typeof Mode.Byte | typeof Mode.Kanji} type
 * @prop {number[]} bytes
 */

/**
 * @typedef ECIChunk
 * @prop {typeof Mode.ECI | typeof Mode.Kanji} type
 * @prop {number} assignmentNumber
 */

/**
 * @typedef StructuredAppend
 * @prop {typeof Mode.StructuredAppend} type
 * @prop {number} currentSequence
 * @prop {number} totalSequence
 * @prop {number} parity
 */

/** @typedef {Array<Chunk | ByteChunk | ECIChunk | StructuredAppend>} Chunks */

/**
 * @typedef DecodedQR
 * @prop {string} text
 * @prop {number[]} bytes
 * @prop {Chunks} chunks
 * @prop {number} version
 */

/**
 * @param {BitStream} stream
 * @param {number} size
 */
function decodeNumeric(stream, size) {
  /** @type {number[]} */
  const bytes = [];
  let text = '';

  const characterCountSize = [10, 12, 14][size];
  let length = stream.readBits(characterCountSize);
  // Read digits in groups of 3
  while (length >= 3) {
    const num = stream.readBits(10);
    if (num >= 1000) {
      throw new Error('Invalid numeric value above 999');
    }

    const a = Math.floor(num / 100);
    const b = Math.floor(num / 10) % 10;
    const c = num % 10;

    bytes.push(48 + a, 48 + b, 48 + c);
    text += a.toString() + b.toString() + c.toString();
    length -= 3;
  }

  // If the number of digits aren't a multiple of 3, the remaining digits are special cased.
  if (length === 2) {
    const num = stream.readBits(7);
    if (num >= 100) {
      throw new Error('Invalid numeric value above 99');
    }

    const a = Math.floor(num / 10);
    const b = num % 10;

    bytes.push(48 + a, 48 + b);
    text += a.toString() + b.toString();
  } else if (length === 1) {
    const num = stream.readBits(4);
    if (num >= 10) {
      throw new Error('Invalid numeric value above 9');
    }

    bytes.push(48 + num);
    text += num.toString();
  }

  return { bytes, text };
}

const AlphanumericCharacterCodes = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8',
  '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
  'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q',
  'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  ' ', '$', '%', '*', '+', '-', '.', '/', ':',
];

/**
 * @param {BitStream} stream
 * @param {number} size
 */
function decodeAlphanumeric(stream, size) {
  /** @type {number[]} */
  const bytes = [];
  let text = '';

  const characterCountSize = [9, 11, 13][size];
  let length = stream.readBits(characterCountSize);
  while (length >= 2) {
    const v = stream.readBits(11);

    const a = Math.floor(v / 45);
    const b = v % 45;

    // eslint-disable-next-line unicorn/prefer-code-point
    bytes.push(AlphanumericCharacterCodes[a].charCodeAt(0), AlphanumericCharacterCodes[b].charCodeAt(0));
    text += AlphanumericCharacterCodes[a] + AlphanumericCharacterCodes[b];
    length -= 2;
  }

  if (length === 1) {
    const a = stream.readBits(6);
    // eslint-disable-next-line unicorn/prefer-code-point
    bytes.push(AlphanumericCharacterCodes[a].charCodeAt(0));
    text += AlphanumericCharacterCodes[a];
  }

  return { bytes, text };
}

/**
 * @param {BitStream} stream
 * @param {number} size
 */
function decodeByte(stream, size) {
  /** @type {number[]} */
  const bytes = [];
  let text = '';

  const characterCountSize = [8, 16, 16][size];
  const length = stream.readBits(characterCountSize);
  for (let i = 0; i < length; i++) {
    const b = stream.readBits(8);
    bytes.push(b);
  }
  try {
    text += decodeURIComponent(bytes.map((b) => `%${(`0${b.toString(16)}`).slice(-2)}`).join(''));
  } catch {
    // failed to decode
  }

  return { bytes, text };
}

/**
 *
 * @param {BitStream} stream
 * @param {number} size
 */
function decodeKanji(stream, size) {
  /** @type {number[]} */
  const bytes = [];

  const characterCountSize = [8, 10, 12][size];
  const length = stream.readBits(characterCountSize);
  for (let i = 0; i < length; i++) {
    const k = stream.readBits(13);

    let c = (Math.floor(k / 0xC0) << 8) | (k % 0xC0);
    c += c < 0x1F_00 ? 0x81_40 : 0xC1_40;

    bytes.push(c >> 8, c & 0xFF);
  }

  const text = new TextDecoder('shift-jis').decode(Uint8Array.from(bytes));
  return { bytes, text };
}

/**
 * @param {Uint8ClampedArray} data
 * @param {number} version
 * @return {DecodedQR|null}
 */
export function decode(data, version) {
  const stream = new BitStream(data);

  // There are 3 'sizes' based on the version. 1-9 is small (0), 10-26 is medium (1) and 27-40 is large (2).
  const size = version <= 9 ? 0 : (version <= 26 ? 1 : 2);

  /** @type {DecodedQR} */
  const result = {
    text: '',
    bytes: [],
    chunks: [],
    version,
  };

  while (stream.available() >= 4) {
    switch (stream.readBits(4)) {
      case ModeByte.Terminator: return result;
      case ModeByte.ECI:
      // eslint-disable-next-line unicorn/prefer-switch
        if (stream.readBits(1) === 0) {
          result.chunks.push({
            type: Mode.ECI,
            assignmentNumber: stream.readBits(7),
          });
          // eslint-disable-next-line no-dupe-else-if
        } else if (stream.readBits(1) === 0) {
          result.chunks.push({
            type: Mode.ECI,
            assignmentNumber: stream.readBits(14),
          });
          // eslint-disable-next-line no-dupe-else-if
        } else if (stream.readBits(1) === 0) {
          result.chunks.push({
            type: Mode.ECI,
            assignmentNumber: stream.readBits(21),
          });
        } else {
        // ECI data seems corrupted
          result.chunks.push({
            type: Mode.ECI,
            assignmentNumber: -1,
          });
        }
        break;
      case ModeByte.Numeric: {
        const numericResult = decodeNumeric(stream, size);
        result.text += numericResult.text;
        result.bytes.push(...numericResult.bytes);
        result.chunks.push({
          type: Mode.Numeric,
          text: numericResult.text,
        });
        break;
      }
      case ModeByte.Alphanumeric: {
        const alphanumericResult = decodeAlphanumeric(stream, size);
        result.text += alphanumericResult.text;
        result.bytes.push(...alphanumericResult.bytes);
        result.chunks.push({
          type: Mode.Alphanumeric,
          text: alphanumericResult.text,
        });
        break;
      }
      case ModeByte.Byte: {
        const byteResult = decodeByte(stream, size);
        result.text += byteResult.text;
        result.bytes.push(...byteResult.bytes);
        result.chunks.push({
          type: Mode.Byte,
          bytes: byteResult.bytes,
          text: byteResult.text,
        });
        break;
      }
      case ModeByte.Kanji: {
        const kanjiResult = decodeKanji(stream, size);
        result.text += kanjiResult.text;
        result.bytes.push(...kanjiResult.bytes);
        result.chunks.push({
          type: Mode.Kanji,
          bytes: kanjiResult.bytes,
          text: kanjiResult.text,
        });
        break;
      }
      case ModeByte.StructuredAppend:
        result.chunks.push({
          type: Mode.StructuredAppend,
          currentSequence: stream.readBits(4),
          totalSequence: stream.readBits(4),
          parity: stream.readBits(8),
        });
        break;
      default:
    }
  }

  // If there is no data left, or the remaining bits are all 0, then that counts as a termination marker
  if (stream.available() === 0 || stream.readBits(stream.available()) === 0) {
    return result;
  }

  return null;
}
