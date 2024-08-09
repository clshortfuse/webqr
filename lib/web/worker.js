import jsQR from '../raw/index.js';

/** @typedef {WindowOrWorkerGlobalScope & Window} WorkerObject  */

/**
 * @typedef WorkerContext
 * @prop {number} currentId
 */

/** @type {OffscreenCanvas} */
let _offscreenCanvas;

/** @param {MessageEvent<WorkerMessage> & {currentTarget: WorkerObject}} event */
export function handleMessageEvent(event) {
  const selfObject = event.currentTarget;
  const data = event.data;

  switch (data.type) {
    case 'image':
      selfObject.postMessage({
        id: data.id,
        type: 'qr',
        qr: jsQR(data.image.data, data.image.width, data.image.height),
      });
      break;
    case 'bitmap': {
      if (!_offscreenCanvas) {
        _offscreenCanvas = new OffscreenCanvas(data.bitmap.width, data.bitmap.height);
      }

      const context = _offscreenCanvas.getContext('2d', { willReadFrequently: true });
      if ((_offscreenCanvas.width !== data.bitmap.width) || (_offscreenCanvas.height !== data.bitmap.height)) {
        // Dimensions have changed
        _offscreenCanvas.width = data.bitmap.width;
        _offscreenCanvas.height = data.bitmap.height;
        context.clearRect(0, 0, _offscreenCanvas.width, _offscreenCanvas.height);
      }

      context.drawImage(data.bitmap, 0, 0, data.bitmap.width, data.bitmap.height);
      selfObject.postMessage({
        id: data.id,
        type: 'qr',
        qr: jsQR(
          context.getImageData(0, 0, data.bitmap.width, data.bitmap.height).data,
          data.bitmap.width,
          data.bitmap.height,
        ),
      });
      data.bitmap.close();
    }
      break;
    case 'close':
      selfObject.close();
      break;
    default:
  }
}

/** @param {WorkerObject} selfObject */
export function setupWorker(selfObject) {
  selfObject.addEventListener('message', handleMessageEvent);
}
