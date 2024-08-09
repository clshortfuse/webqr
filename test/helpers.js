import { readFile } from 'node:fs/promises';

import png from 'upng-js';

import BitMatrix from '../lib/raw/BitMatrix.js';

/**
 *
 * @param {BitMatrix} matrix
 * @return
 */
export function bitMatrixToPng(matrix) {
  const output = new Uint8ClampedArray(matrix.width * matrix.height * 4);
  for (let y = 0; y < matrix.height; y++) {
    for (let x = 0; x < matrix.width; x++) {
      const v = matrix.get(x, y);
      const i = (y * matrix.width + x) * 4;
      output[i + 0] = v ? 0x00 : 0xFF;
      output[i + 1] = v ? 0x00 : 0xFF;
      output[i + 2] = v ? 0x00 : 0xFF;
      output[i + 3] = 0xFF;
    }
  }
  return Buffer.from(png.encode([output.buffer], matrix.width, matrix.height, 0));
}

/**
 * @param {string} path
 */
export async function loadPng(path) {
  const data = png.decode(await readFile(path));
  return {
    data: new Uint8ClampedArray(png.toRGBA8(data)[0]),
    height: data.height,
    width: data.width,
  };
}

/**
 * @param {string} path
 */
export async function loadBinarized(path) {
  const image = await loadPng(path);
  const out = new BitMatrix(image.width, image.height);
  for (let x = 0; x < image.width; x++) {
    for (let y = 0; y < image.height; y++) {
      out.set(x, y, image.data[(y * image.width + x) * 4] === 0x00);
    }
  }
  return out;
}
