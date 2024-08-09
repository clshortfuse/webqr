// Binds User Camera to HTMLVideoElements

/**
 *
 * @param {HTMLVideoElement} element
 */
export function attachVideo(element) {
  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    element.srcObject = stream;
    element.play();
  }).catch((e) => console.error(e));
}

/**
 *
 * @param {HTMLVideoElement} element
 */
export function detachVideo(element) {
  const stream = element.srcObject;
  if (!stream) return;
  if ('getVideoTracks' in stream) {
    for (const track of stream.getVideoTracks()) {
      track.stop();
    }
  }
  element.srcObject = null;
}
