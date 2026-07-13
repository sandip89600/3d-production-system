const multer = require('multer');

/**
 * Global multer config — uses memoryStorage so files are buffered in RAM
 * and streamed directly to cloud storage without touching disk.
 */

const ALLOWED_EXTENSIONS = [
  '.zip', '.rar', '.blend', '.max', '.fbx', '.obj', '.stl',
  '.jpg', '.jpeg', '.png', '.webp',
  '.pdf', '.mp4', '.avi',
  '.doc', '.docx', '.xls', '.xlsx', '.txt',
];

const fileFilter = (req, file, cb) => {
  const path = require('path');
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File extension "${ext}" is not allowed.`), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // 500 MB
  },
});

module.exports = upload;
