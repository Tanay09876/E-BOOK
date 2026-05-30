const multer = require("multer");
const path = require("path");

const storageEngine = multer.memoryStorage();

function checkFileType(file, callback) {
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  const extensionMatched = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetypeMatched = allowedFileTypes.test(file.mimetype);

  if (extensionMatched && mimetypeMatched) {
    callback(null, true);
  } else {
    callback(
      new Error("Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!")
    );
  }
}

const uploadBookCoverImage = multer({
  storage: storageEngine,
  limits: {
    files: 1,
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter(req, file, callback) {
    checkFileType(file, callback);
  },
}).single("coverImage");

const uploadAvatarImage = multer({
  storage: storageEngine,
  limits: {
    files: 1,
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter(req, file, callback) {
    checkFileType(file, callback);
  },
}).single("avatar");

const uploadEditorImage = multer({
  storage: storageEngine,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024, // 5MB limit for editor images
  },
  fileFilter(req, file, callback) {
    checkFileType(file, callback);
  },
}).single("image");

module.exports = { uploadBookCoverImage, uploadAvatarImage, uploadEditorImage };
