const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * AWS S3 Storage Service
 * Handles upload, delete, and signed URL generation for S3.
 */

let s3Client = null;

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

const BUCKET = process.env.AWS_BUCKET_NAME;
const ACL = process.env.AWS_S3_ACL || 'public-read';

/**
 * Upload a buffer to S3
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} key - S3 object key (e.g. "profiles/uuid.webp")
 * @param {string} mimeType - Content-Type
 * @returns {{ url: string, storageKey: string }}
 */
const uploadToS3 = async (buffer, key, mimeType) => {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL,
  });

  await client.send(command);

  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
  return { url, storageKey: key };
};

/**
 * Delete an object from S3 by its key
 * @param {string} storageKey
 */
const deleteFromS3 = async (storageKey) => {
  const client = getS3Client();
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey });
  await client.send(command);
};

/**
 * Generate a pre-signed GET URL for a private S3 object
 * @param {string} storageKey
 * @param {number} expiresIn - Seconds (default 3600 = 1 hour)
 * @returns {string} signedUrl
 */
const getS3SignedUrl = async (storageKey, expiresIn = 3600) => {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: storageKey });
  return getSignedUrl(client, command, { expiresIn });
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getS3SignedUrl,
};
