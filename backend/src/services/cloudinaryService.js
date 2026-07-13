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
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} folder - Cloudinary folder (e.g. "profiles")
 * @param {string} publicId - Unique identifier (filename without ext)
 * @param {string} resourceType - "image" | "raw" | "video" | "auto"
 * @returns {{ url: string, storageKey: string }}
 */
const uploadToCloudinary = (buffer, folder, publicId, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const cloud = getCloudinary();

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
          storageKey: result.public_id, // used for deletion
        });
      }
    );

    stream.end(buffer);
  });
};

/**
 * Delete an asset from Cloudinary by public_id.
 * @param {string} publicId
 * @param {string} resourceType
 */
const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
  const cloud = getCloudinary();
  return cloud.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
