const multer = require('multer');

/**
 * Profile photo upload middleware — uses memoryStorage.
 * Files are buffered in RAM and streamed to cloud storage.
 */

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP are allowed.'), false);
  }
};

const profileUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_PROFILE_SIZE) || 5 * 1024 * 1024, // 5 MB
  },
});

module.exports = profileUpload;
