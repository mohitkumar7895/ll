/**
 * Wait until the video element has drawable frames (needed on many mobile browsers).
 */
export async function waitForVideoReady(video, timeoutMs = 12000) {
  if (!video) {
    throw new Error("No video element");
  }
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      return;
    }
    await new Promise((r) => setTimeout(r, 40));
  }
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    return;
  }
  throw new Error("Video not ready");
}
