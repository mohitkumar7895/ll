const path = require("path");
const fs = require("fs");
const os = require("os");

/**
 * Folder that maps to URL `/uploads/...` (contains `profiles/` for avatars).
 * - Local dev: `server/uploads`
 * - Vercel / serverless: `/tmp/...` (only writable path; ephemeral between cold starts)
 * - Override: set `UPLOAD_BASE_DIR` in env
 */
function getUploadBaseDir() {
  if (process.env.UPLOAD_BASE_DIR) {
    return path.resolve(process.env.UPLOAD_BASE_DIR);
  }
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "library-hub-uploads");
  }
  return path.join(__dirname, "..", "uploads");
}

function getProfilesUploadDir() {
  return path.join(getUploadBaseDir(), "profiles");
}

/** Resolve DB path like `/uploads/profiles/file.jpg` to absolute disk path. */
function resolveUploadFilePath(photoPath) {
  if (!photoPath || typeof photoPath !== "string" || !photoPath.startsWith("/uploads/")) {
    return null;
  }
  const rel = photoPath.replace(/^\/uploads\/?/, "");
  return path.join(getUploadBaseDir(), rel);
}

function ensureProfileUploadDir() {
  const dir = getProfilesUploadDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = {
  getUploadBaseDir,
  getProfilesUploadDir,
  resolveUploadFilePath,
  ensureProfileUploadDir,
};
