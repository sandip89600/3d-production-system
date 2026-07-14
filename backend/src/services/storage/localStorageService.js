const path = require('path');
const fs = require('fs');

/**
 * Ensures the target directory exists and returns its path
 */
const getLocalUploadDir = (folder) => {
  const base = process.env.UPLOAD_PATH || path.join(__dirname, '../../../uploads');
  const dir = path.join(base, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

/**
 * Save a buffer to the local filesystem
 */
const upload = async (buffer, folder, fileName, mimeType) => {
  const dir = getLocalUploadDir(folder);
  const filePath = path.join(dir, fileName);
  
  fs.writeFileSync(filePath, buffer);
  
  // Return URL relative to backend server root
  const url = `/uploads/${folder}/${fileName}`;
  return { url, storageKey: url };
};

/**
 * Delete a local file from disk using its storageKey (e.g. "/uploads/profiles/name.webp")
 */
const deleteAsset = async (storageKey) => {
  const relPath = storageKey.startsWith('/') ? storageKey.slice(1) : storageKey;
  const fullPath = path.join(__dirname, '../../..', relPath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.warn('[localStorageService] Could not delete local file:', err.message);
    }
  }
};

/**
 * Local files are directly accessible; returning their key/url is sufficient
 */
const getSignedUrl = async (storageKey, expiresIn) => {
  return storageKey;
};

module.exports = {
  upload,
  delete: deleteAsset,
  getSignedUrl,
};
