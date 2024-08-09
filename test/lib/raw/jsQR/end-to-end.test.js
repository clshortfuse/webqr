import { readFile, readdir } from 'node:fs/promises';
import { join as joinPath, dirname as parseDirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import test from 'ava';

import BitMatrix from '../../../../lib/raw/BitMatrix.js';
import jsQR from '../../../../lib/raw/index.js';
import { loadPng } from '../../../helpers.js';

import expected from './end-to-end/report.json' with {type: 'json'};

const __dirname = parseDirname(fileURLToPath(import.meta.url));

for (const folder of await readdir(joinPath(__dirname, './end-to-end'))) {
  if (folder.includes('.')) continue;
  test.serial(folder, async (t) => {
    const inputImage = await loadPng(joinPath(__dirname, './end-to-end', folder, 'input.png'));
    const expectedOutput = JSON.parse(
      await readFile(joinPath(__dirname, './end-to-end', folder, 'output.json'), 'utf8'),
      (key, value) => (key === 'matrix'
        // parse stringified matrix back into a BitMatrix
        ? new BitMatrix(value.width, value.height, new Uint8ClampedArray(Object.values(value.data)))
        : value),
    );
    const result = jsQR(inputImage.data, inputImage.width, inputImage.height);
    if (result == null && expected.tests[folder] === false) {
      t.log('Expected failure');
      t.pass();
    } else {
      t.deepEqual(result, expectedOutput);
    }
  });
}
