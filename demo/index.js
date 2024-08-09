import * as videoCameraBinder from '../lib/web/videoCameraBinder.js';
import * as videoQRDecoder from '../lib/web/videoQRDecoder.js';

const button = document.querySelector('button');
const video = document.querySelector('video');
const status = document.querySelector('pre');
const log = document.querySelector('li');
const worker = new Worker('./worker.js', { type: 'module' });

videoQRDecoder.bindWorker(worker);

button.addEventListener('click', () => {
  videoCameraBinder.attachVideo(video);
  videoQRDecoder.attachVideo(video);
});

video.addEventListener(videoQRDecoder.QR_EVENT, (event) => {
  const result = event.detail;
  status.textContent = `${new Date().toLocaleTimeString()}: ${result?.data ?? '(none)'}`;
  if (result) {
    const ul = document.createElement('ul');
    ul.textContent = `${new Date().toLocaleTimeString()}: ${result?.data}`;
    log.append(ul);
  }
  videoQRDecoder.scanFrame(video);
});
