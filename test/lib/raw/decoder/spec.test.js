import { readFile } from 'node:fs/promises';
import { join as joinPath, dirname as parseDirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import test from 'ava';

import BitMatrix from '../../../../lib/raw/BitMatrix.js';
import { decode } from '../../../../lib/raw/decoder/decoder.js';
import { loadBinarized } from '../../../helpers.js';

const __dirname = parseDirname(fileURLToPath(import.meta.url));

test('decodes a numeric code', async (t) => {
  const data = await loadBinarized(joinPath(__dirname, './test-data/numeric.png'));
  t.deepEqual(
    decode(data),
    {
      text: '123456789',
      bytes: [49, 50, 51, 52, 53, 54, 55, 56, 57],
      chunks: [{ type: 'numeric', text: '123456789' }],
      version: 1,
    },
  );
});

test('decodes an alphanumeric code', async (t) => {
  const data = await loadBinarized(joinPath(__dirname, './test-data/alphanumeric.png'));
  t.deepEqual(
    decode(data),
    {
      text: 'ABCD1234',
      bytes: [65, 66, 67, 68, 49, 50, 51, 52],
      chunks: [{ type: 'alphanumeric', text: 'ABCD1234' }],
      version: 1,
    },
  );
});

test('decodes a byte code', async (t) => {
  const data = await loadBinarized(joinPath(__dirname, './test-data/byte.png'));
  t.deepEqual(
    decode(data),
    {
      text: 'Test',
      bytes: [84, 101, 115, 116],
      chunks: [{ type: 'byte', bytes: [84, 101, 115, 116], text: 'Test' }],
      version: 1,
    },
  );
});

test('decodes a kanji code', async (t) => {
  const data = await loadBinarized(joinPath(__dirname, './test-data/kanji.png'));
  t.deepEqual(
    decode(data),
    {
      text: 'テスト',
      bytes: [131, 101, 131, 88, 131, 103],
      chunks: [{ type: 'kanji', bytes: [131, 101, 131, 88, 131, 103], text: 'テスト' }],
      version: 1,
    },
  );
});

test('decodes a mixed code', async (t) => {
  const data = await loadBinarized(joinPath(__dirname, './test-data/mixed.png'));
  t.deepEqual(
    decode(data),
    {
      text: '123456789ABCD1234Testテスト',
      bytes: [49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 49, 50, 51,
        52, 84, 101, 115, 116, 131, 101, 131, 88, 131, 103],
      chunks: [
        { type: 'numeric', text: '123456789' },
        { type: 'alphanumeric', text: 'ABCD1234' },
        { type: 'byte', bytes: [84, 101, 115, 116], text: 'Test' },
        { type: 'kanji', bytes: [131, 101, 131, 88, 131, 103], text: 'テスト' },
      ],
      version: 2,
    },
  );
});

test("returns null if there aren't enough codewords in the matrix", async (t) => {
  // This matrix decodes to an empty byte array, but shouldn't decode at all
  const data = Uint8ClampedArray.from(await readFile(joinPath(__dirname, './test-data/truncated-null.bin')));
  const dimension = Math.sqrt(data.length);
  const matrix = new BitMatrix(dimension, dimension, data);
  t.is(decode(matrix), null);
});

test("returns null if there aren't enough codewords in the matrix 2", async (t) => {
  // This matrix decodes to random unicode characters but shouldn't decode at all.
  const data = Uint8ClampedArray.from(await readFile(joinPath(__dirname, './test-data/truncated-corrupted.bin')));
  const dimension = Math.sqrt(data.length);
  const matrix = new BitMatrix(dimension, dimension, data);
  t.is(decode(matrix), null);
});

test('Supports ECI chunks', async (t) => {
  const data = await loadBinarized(joinPath(__dirname, './test-data/eci.png'));
  t.deepEqual(
    decode(data),
    {
      text: '7948,328,1019,149,12,12,15,4,14,11,32,4',
      bytes: [55, 57, 52, 56, 44, 51, 50, 56, 44, 49, 48, 49, 57, 44, 49, 52,
        57, 44, 49, 50, 44, 49, 50, 44, 49, 53, 44, 52, 44, 49, 52, 44, 49,
        49, 44, 51, 50, 44, 52],
      chunks: [
        {
          type: 'eci', assignmentNumber: 26,
        }, {
          type: 'byte',
          bytes: [55, 57, 52, 56, 44, 51, 50, 56, 44, 49, 48, 49, 57, 44, 49, 52, 57, 44, 49, 50, 44, 49, 50, 44, 49,
            53, 44, 52, 44, 49, 52, 44, 49, 49, 44, 51, 50, 44, 52],
          text: '7948,328,1019,149,12,12,15,4,14,11,32,4',
        },
      ],
      version: 3,
    },
  );
});

test('Extracts a QR code that is missing the termination byte', async (t) => {
  const data = await loadBinarized(joinPath(__dirname, './test-data/no-termination-byte.png'));
  t.deepEqual(
    decode(data),
    {
      text: '1788c74b1c9262866c2071b65df7bfcb7911c2b064c931b580515c2d9d2cd7f8',
      bytes: [49, 55, 56, 56, 99, 55, 52, 98, 49, 99, 57, 50, 54, 50, 56, 54,
        54, 99, 50, 48, 55, 49, 98, 54, 53, 100, 102, 55, 98, 102, 99, 98, 55,
        57, 49, 49, 99, 50, 98, 48, 54, 52, 99, 57, 51, 49, 98, 53, 56, 48, 53,
        49, 53, 99, 50, 100, 57, 100, 50, 99, 100, 55, 102, 56],
      chunks: [
        { type: 'numeric', text: '1788' },
        { type: 'byte', bytes: [99, 55, 52, 98, 49, 99], text: 'c74b1c' },
        { type: 'numeric', text: '9262866' },
        {
          type: 'byte',
          bytes: [99, 50, 48, 55, 49, 98, 54, 53, 100, 102, 55, 98, 102, 99, 98,
            55, 57, 49, 49, 99, 50, 98, 48, 54, 52, 99, 57, 51, 49, 98],
          text: 'c2071b65df7bfcb7911c2b064c931b',
        },
        { type: 'numeric', text: '580515' },
        { type: 'byte', bytes: [99, 50, 100, 57, 100, 50, 99, 100, 55, 102, 56], text: 'c2d9d2cd7f8' },
      ],
      version: 4,
    },
  );
});
test('Supports StructuredAppend chunks', async (t) => {
  const data = await loadBinarized(joinPath(__dirname, './test-data/structuredAppend.png'));
  t.deepEqual(
    decode(data),
    {
      text: 'Hello ',
      bytes: [72, 101, 108, 108, 111, 32],
      chunks: [
        {
          currentSequence: 0,
          parity: 32,
          totalSequence: 1,
          type: 'structuredappend',
        }, {
          type: 'byte',
          bytes: [72, 101, 108, 108, 111, 32],
          text: 'Hello ',
        },
      ],
      version: 1,
    },
  );
});
