import * as faceapi from "face-api.js";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";

let loaded = false;

/** TinyFaceDetector is much lighter than SSD MobileNet — fewer UI freezes on typical laptops. */
export async function loadFaceModels() {
  if (loaded) {
    return;
  }
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  loaded = true;
}

export { faceapi };
