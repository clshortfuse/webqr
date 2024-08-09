import { join as joinPath, dirname as parseDirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import test from 'ava';

import { locate } from '../../../../lib/raw/locator/index.js';
import { loadBinarized } from '../../../helpers.js';

const __dirname = parseDirname(fileURLToPath(import.meta.url));

test('handles images with missing finder patterns', async (t) => {
  const binarized = await loadBinarized(joinPath(__dirname, './test-data/missing-finder-patterns.png'));
  t.is(locate(binarized), null);
});

test('locates a "perfect" image', async (t) => {
  const binarized = await loadBinarized(joinPath(__dirname, './test-data/perfect.png'));
  t.deepEqual(
    locate(binarized)[0],
    {
      alignmentPattern: { x: 170.5, y: 170.5 },
      bottomLeft: { x: 3.5, y: 173.5 },
      dimension: 177,
      topLeft: { x: 3.5, y: 3.5 },
      topRight: { x: 173.5, y: 3.5 },
    },
  );
});

test('locates a QR in a real world image', async (t) => {
  const binarized = await loadBinarized(joinPath(__dirname, './test-data/real-world.png'));
  t.deepEqual(
    locate(binarized)[0],
    {
      alignmentPattern: { x: 264.25, y: 177 },
      bottomLeft: { x: 195.5, y: 191.5 },
      dimension: 33,
      topLeft: { x: 191.75, y: 113.5 },
      topRight: { x: 270.75, y: 107.5 },
    },
  );
});

test('locates a small QR code in real world photo', async (t) => {
  const binarized = await loadBinarized(joinPath(__dirname, './test-data/small-photo.png'));
  t.deepEqual(
    locate(binarized)[0],
    {
      alignmentPattern: { x: 103, y: 147.5 },
      bottomLeft: { x: 73.5, y: 152 },
      dimension: 29,
      topLeft: { x: 74, y: 117.5 },
      topRight: { x: 108, y: 118 },
    },
  );
});

test('locates a extremely distored QR code', async (t) => {
  const binarized = await loadBinarized(joinPath(__dirname, './test-data/distorted-extreme.png'));
  t.deepEqual(
    locate(binarized)[0],
    {
      alignmentPattern: { x: 164.5, y: 39 },
      bottomLeft: { x: 221.5, y: 18.5 },
      dimension: 25,
      topLeft: { x: 180.5, y: 101 },
      topRight: { x: 122.75, y: 105 },
    },
  );
});

test('locates a damaged QR code and guesses the finder pattern location', async (t) => {
  const binarized = await loadBinarized(joinPath(__dirname, './test-data/damaged.png'));
  t.deepEqual(
    locate(binarized)[0],
    {
      alignmentPattern: { x: 219.75, y: 221 },
      bottomLeft: { x: 81.5, y: 215.5 },
      dimension: 29,
      topLeft: { x: 82, y: 75.5 },
      topRight: { x: 221.75, y: 76 },
    },
  );
});

test("doesn't locate a QR code in a malformed image", async (t) => {
  // This image was created to be basically noise, but locator orignally found a QR code with size=Infinity within it
  const binarized = await loadBinarized(joinPath(__dirname, './test-data/malformed-infinity.png'));
  t.is(locate(binarized), null);
});

test('returns a centered alignment as a fallback', async (t) => {
  const binarized = await loadBinarized(joinPath(__dirname, './test-data/odd-skew.png'));
  t.deepEqual(
    locate(binarized)[1],
    {
      alignmentPattern: { x: 163.5, y: 170 },
      bottomLeft: { x: 56.5, y: 185.5 },
      dimension: 29,
      topLeft: { x: 57, y: 60 },
      topRight: { x: 185.5, y: 57.5 },
    },
  );
});
