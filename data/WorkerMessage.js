/**
 * @typedef WorkerMessageBase
 * @prop {number} id
 * @prop {string} type
 */

/**
 * @typedef {WorkerMessageBase & {
 *  type: 'image',
 *  image: {
 *    width: number,
 *    height: number,
 *    data: Uint8ClampedArray
 *  }}} WorkerImageMessage
 */

/**
 * @typedef {WorkerMessageBase & {
*  type: 'bitmap',
*  bitmap: ImageBitmap}} WorkerBitmapMessage
*/

/**
 * @typedef {WorkerMessageBase & {
 *  type: 'qr',
 *  qr: {
 *    data: string
 *    locations: any
 *  }}} WorkerQRMessage
 */

/** @typedef {WorkerMessageBase & { type: 'close' }} WorkerCloseMessage */

/** @typedef {WorkerImageMessage | WorkerQRMessage | WorkerBitmapMessage | WorkerCloseMessage }  WorkerMessage */

/** @typedef {MessageEvent<WorkerMessage>}  WorkerMessageEvent */
