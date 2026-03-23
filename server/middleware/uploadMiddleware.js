const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(__dirname, "..", "uploads", "profiles");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_, file, cb) => {
    const extension = path.extname(file.originalname);
    const filename = `${file.fieldname}-${Date.now()}${extension}`;
    cb(null, filename);
  },
});

const fileFilter = (_, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, and WEBP images are allowed"));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

/** Accepts either field name `profileImage` or legacy `profilePhoto`. */
const uploadProfileFlexible = (req, res, next) => {
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return next(err);
    }
    req.file = req.files?.profileImage?.[0] || req.files?.profilePhoto?.[0];
    next();
  });
};

module.exports = upload;
module.exports.uploadProfileFlexible = uploadProfileFlexible;
