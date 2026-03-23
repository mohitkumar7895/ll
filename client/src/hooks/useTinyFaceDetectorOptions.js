import { useMemo } from "react";
import * as faceapi from "face-api.js";
import { needsCameraUserGesture } from "../utils/cameraEnv";

/** Phones: slightly larger input + lower score cutoff for reliable detection. */
export function useTinyFaceDetectorOptions() {
  return useMemo(() => {
    const mobile = needsCameraUserGesture();
    return new faceapi.TinyFaceDetectorOptions({
      inputSize: mobile ? 416 : 320,
      scoreThreshold: mobile ? 0.4 : 0.45,
    });
  }, []);
}
