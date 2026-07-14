const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Project = require('../../models/Project');

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
 * Calculates a unique S3 key/path based on the category (folder) and metadata.
 */
const getS3Key = async (folder, fileName, uploadedBy, projectId) => {
  const cleanFileName = fileName;
  
  if (folder === 'profiles') {
    return `users/${uploadedBy}/profile/${cleanFileName}`;
  }
  
  if (projectId) {
    try {
      const projectDoc = await Project.findById(projectId);
      const projectIdCode = projectDoc ? projectDoc.projectId : projectId;
      
      if (folder === 'projects') {
        return `projects/${projectIdCode}/source/${cleanFileName}`;
      }
      if (folder === 'deliverables') {
        return `deliverables/${projectIdCode}/final/${cleanFileName}`;
      }
      if (folder === 'previews') {
        return `previews/${projectIdCode}/images/${cleanFileName}`;
      }
    } catch (err) {
      console.error('[s3Service] Error getting project code for S3 key:', err.message);
    }
  }

  // Fallbacks
  if (folder === 'projects') return `projects/${projectId || 'general'}/source/${cleanFileName}`;
  if (folder === 'deliverables') return `deliverables/${projectId || 'general'}/final/${cleanFileName}`;
  if (folder === 'previews') return `previews/${projectId || 'general'}/images/${cleanFileName}`;
  if (folder === 'profiles') return `users/${uploadedBy || 'general'}/profile/${cleanFileName}`;
  
  return `${folder}/${cleanFileName}`;
};

/**
 * Upload a file buffer to S3
 */
const upload = async (buffer, folder, fileName, mimeType, { uploadedBy, projectId } = {}) => {
  const client = getS3Client();
  const key = await getS3Key(folder, fileName, uploadedBy, projectId);

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
 * Delete a file from S3 by its storage key
 */
const deleteAsset = async (storageKey) => {
  const client = getS3Client();
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey });
  await client.send(command);
};

/**
 * Generate a pre-signed GET URL for a private S3 object
 */
const getSignedUrlForAsset = async (storageKey, expiresIn = 3600) => {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: storageKey });
  return getSignedUrl(client, command, { expiresIn });
};

module.exports = {
  upload,
  delete: deleteAsset,
  getSignedUrl: getSignedUrlForAsset,
};
