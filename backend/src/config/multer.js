const multer = require('multer');

/**
 * Global multer config — uses memoryStorage so files are buffered in RAM
 * and streamed directly to cloud storage without touching disk.
 */

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp',
  '.dwg', '.dxf', '.skp', '.dae',
  '.3ds', '.max', '.psd', '.cdr', '.zip'
];

const fileFilter = (req, file, cb) => {
  const path = require('path');
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File extension "${ext}" is not supported. Supported: ${ALLOWED_EXTENSIONS.map(e => e.slice(1)).join(', ')}`), false);
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
