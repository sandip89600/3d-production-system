const path = require('path');

let cloudinaryConfigured = false;
let cloudinary = null;

/**
 * Lazily initialize Cloudinary to avoid crashing when credentials are absent.
 */
const getCloudinary = () => {
  if (!cloudinaryConfigured) {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    cloudinaryConfigured = true;
  }
  return cloudinary;
};

/**
 * Upload a file buffer to Cloudinary
 */
const upload = async (buffer, folder, fileName, mimeType) => {
  return new Promise((resolve, reject) => {
    const cloud = getCloudinary();
    const ext = path.extname(fileName).toLowerCase();
    const publicId = `${folder}/${path.basename(fileName, ext)}`;
    const resourceType = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'raw';

    const stream = cloud.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          storageKey: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary by its publicId
 */
const deleteAsset = async (storageKey, mimeType = '') => {
  const cloud = getCloudinary();
  const resourceType = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'raw';
  return cloud.uploader.destroy(storageKey, { resource_type: resourceType });
};

/**
 * Cloudinary public URLs are direct
 */
const getSignedUrl = async (storageKey, expiresIn) => {
  return storageKey;
};

module.exports = {
  upload,
  delete: deleteAsset,
  getSignedUrl,
};
