import { join as joinPath, dirname as parseDirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import test from 'ava';

import { extract } from '../../../../lib/raw/extractor/index.js';
import { loadBinarized } from '../../../helpers.js';

/** @typedef {import('../../../../lib/raw/BitMatrix.js').default} BitMatrix */

const __dirname = parseDirname(fileURLToPath(import.meta.url));

/**
 * @param {BitMatrix} a
 * @param {BitMatrix} b
 * @return {boolean}
 */
function matrixCompare(a, b) {
  if (!(a.height === b.height && a.width === b.width)) {
    return false;
  }
  for (let x = 0; x < a.width; x++) {
    for (let y = 0; y < a.height; y++) {
      if (a.get(x, y) !== b.get(x, y)) {
        return false;
      }
    }
  }
  return true;
}

test('is a no-op when applied to an already extracted code', async (t) => {
  const data = await loadBinarized(joinPath(__dirname, './test-data/output.png'));
  const extracted = extract(data, {
    topLeft: { x: 3.5, y: 3.5 },
    bottomLeft: { x: 3.5, y: 21.5 },
    topRight: { x: 21.5, y: 3.5 },
    alignmentPattern: { x: 18.5, y: 18.5 },
    dimension: 25,
  });
  t.true(matrixCompare(extracted.matrix, data));
});

test('extracts a distorted QR code', async (t) => {
  const input = await loadBinarized(joinPath(__dirname, './test-data/input.png'));
  const expected = await loadBinarized(joinPath(__dirname, './test-data/output.png'));
  const extracted = extract(input, {
    topLeft: { x: 56, y: 94 },
    bottomLeft: { x: 88, y: 268 },
    topRight: { x: 275, y: 175 },
    alignmentPattern: { x: 197, y: 315 },
    dimension: 25,
  });
  t.true(matrixCompare(extracted.matrix, expected));
});
