/* eslint-env browser, serviceworker */
/* eslint-disable no-restricted-globals */

import AsyncObject from './AsyncObject.js';

/** @type {AsyncObject<Worker>} */
const workerConstructor = new AsyncObject();

/** @return {Promise<Worker>} */
async function getConstructor() {
  if (workerConstructor.hasValue()) {
    return workerConstructor.value;
  }
  if (workerConstructor.isBusy()) {
    return await workerConstructor.get();
  }
  workerConstructor.prepare();
  if (typeof Worker !== 'undefined') {
    workerConstructor.set(Worker);
  } else {
    const module = await import(new URL('node:worker_threads').href);
    workerConstructor.set(module.Worker);
  }

  return workerConstructor.value;
}

/** @return {Worker} */
function getConstructorSync() {
  if (workerConstructor.hasValue()) {
    return workerConstructor.value;
  }
  throw new Error('Not ready!');
}

/**
 * @param {Function} fn
 * @return {Worker}
 */
function buildWorker(fn) {
  const Worker = getConstructorSync();
  const script = /* js */ `
  ${typeof self === 'undefined' ? "const self = require('worker_threads').parentPort;" : ''}
  function run(...args) {
    ${fn.name
    ? /* js */ `
        ${fn.toString()}
        return ${fn.name}.call(null, ...args);`
    : /* js */ `
        return (${fn.toString()})(...args);`}
  }
  self.onmessage = async (msg) => {
    const result = await run(msg.data);
    self.postMessage(result);
  }
  `;
  const MIME_TYPE = 'application/javascript';
  if (typeof Blob !== 'undefined') {
    return new Worker(URL.createObjectURL(new Blob([script], { type: MIME_TYPE })));
  }
  return new Worker(script, { eval: true });
}

/**
 * @param {Function} fn
 * @param {...any} args
 * @return {Promise<ReturnType<Function>}
 */
export async function runAsync(fn, ...args) {
  await getConstructor();
  const result = await new Promise((resolve, reject) => {
    try {
      const worker = buildWorker(fn);
      if ('onmessage' in worker) {
        worker.onmessage = (msg) => {
          resolve(msg.data);
          worker.terminate();
        };
      } else {
        worker.on('message', (msg) => {
          resolve(msg);
          worker.terminate();
        });
      }
      worker.postMessage(args);
    } catch (err) {
      reject(err);
    }
  });
  return result;
}
