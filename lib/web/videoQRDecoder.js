// Adds QR Decoding to HTMLVideoElement

export const QR_EVENT = 'webqr:qr';

/** @type {Worker} */
let _worker;

let lastId = 0;

/** @type {(WeakRef<HTMLVideoElement>)[]} */
const videoElements = [];

/**
 * @typedef VideoElementState
 * @prop {boolean} scanning
 * @prop {number} pendingId
 * @prop {DOMHighResTimeStamp} timestamp
 * @prop {HTMLCanvasElement} [canvas]
 */

/** @type {(WeakMap<HTMLVideoElement, VideoElementState>)} */
const videoElementStates = new WeakMap();

/**
 * @param {WorkerQRMessage} workerMessage
 * @return {void}
 */
function dispatchQRMessage(workerMessage) {
  /** @type {number[]} */
  const reclaimedIndexes = [];
  for (const [index, ref] of videoElements.entries()) {
    const element = ref.deref();
    if (!element) {
      reclaimedIndexes.unshift(index);
      continue;
    }
    const state = videoElementStates.get(element);
    if (state?.pendingId !== workerMessage.id) continue;
    state.scanning = false;
    element.dispatchEvent(new CustomEvent(QR_EVENT, {
      cancelable: false,
      bubbles: false,
      detail: workerMessage.qr,
    }));
  }
  for (const index of reclaimedIndexes) {
    videoElements.splice(index, 1);
  }
}

/** @param {WorkerMessageEvent} event */
export function onWorkerMessage(event) {
  if (event.data.type === 'qr') {
    dispatchQRMessage(event.data);
  }
}

/**
 * @param {number} id
 * @param {ImageData} imageData
 */
export function postImageData(id, imageData) {
  /** @type {WorkerImageMessage} */
  const message = {
    id,
    type: 'image',
    image: {
      width: imageData.width,
      height: imageData.height,
      data: imageData.data,
    },
  };
  _worker.postMessage(message, [imageData.data.buffer]);
}

/**
 * @param {number} id
 * @param {ImageBitmap} bitmap
 */
export function postImageBitmap(id, bitmap) {
  /** @type {WorkerBitmapMessage} */
  const message = { id, type: 'bitmap', bitmap };
  _worker.postMessage(message, [bitmap]);
}

/** @param {HTMLVideoElement} element */
export function scanFrame(element) {
  // Not ready
  if (element.readyState < element.HAVE_CURRENT_DATA) return;
  if (element.paused) return;

  const state = videoElementStates.get(element);
  if (state.scanning) return;

  // Mark busy
  state.scanning = true;

  /**
   * @param {Object} arg0
   * @param {number} arg0.width
   * @param {number} arg0.height
   */
  const callback = ({ width, height }) => {
    lastId++;
    state.pendingId = lastId;
    // Has new frame
    if (typeof ImageBitmap !== 'undefined'
      && typeof OffscreenCanvas !== 'undefined') {
      createImageBitmap(element)
        .then((bitmap) => postImageBitmap(state.pendingId, bitmap))
        .catch((error) => console.error(error));
      return;
    }
    if (!state.canvas) {
      state.canvas = document.createElement('canvas');
      state.canvas.getContext('2d', { willReadFrequently: true });
    }
    const context = state.canvas.getContext('2d', { willReadFrequently: true });
    if ((state.canvas.width !== width) || (state.canvas.height !== height)) {
      // Dimensions have changed
      state.canvas.width = width;
      state.canvas.height = height;
      context.clearRect(0, 0, width, height);
    }
    context.drawImage(element, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    postImageData(state.pendingId, imageData);
  };

  if ('requestVideoFrameCallback' in element) {
    element.requestVideoFrameCallback((now, metadata) => {
      // TODO: Throttle
      callback(metadata);
    });
  } else {
    globalThis.requestAnimationFrame(() => {
      // @ts-ignore 'never'
      callback({ width: element.videoWidth, height: element.videoHeight });
    });
  }
}

/** @param {Event} event */
export function onVideoStateChange(event) {
  const video = /** @type {HTMLVideoElement} */ (event.currentTarget);
  scanFrame(video);
}

/**
 * @param {HTMLVideoElement} element
 */
export function attachVideo(element) {
  if (videoElementStates.has(element)) return;
  videoElementStates.set(element, { scanning: false, pendingId: 0, timestamp: 0, canvas: null });
  videoElements.push(new WeakRef(element));
  element.addEventListener('loadedmetadata', onVideoStateChange);
  element.addEventListener('play', onVideoStateChange);
  scanFrame(element);
}

/**
 * @param {HTMLVideoElement} element
 */
export function detachVideo(element) {
  if (!videoElementStates.has(element)) return;
  videoElementStates.set(element, { scanning: false, pendingId: 0, timestamp: 0, canvas: null });
  videoElements.push(new WeakRef(element));
  element.removeEventListener('loadedmetadata', onVideoStateChange);
  element.removeEventListener('play', onVideoStateChange);
}

/** @param {Worker} worker */
export function bindWorker(worker) {
  if (_worker) {
    _worker.removeEventListener('message', onWorkerMessage);
  }
  _worker = worker;
  _worker.addEventListener('message', onWorkerMessage);
}

/** @param {Worker} worker */
export function detachWorker(worker) {
  worker.removeEventListener('message', onWorkerMessage);
  if (_worker === worker) {
    _worker = null;
  }
}

/** @param {Worker} worker */
export function destroyWorker(worker) {
  worker.postMessage({ type: 'close' });
}
