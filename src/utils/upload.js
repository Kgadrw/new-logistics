import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dgmexpa8v',
  api_key: process.env.CLOUDINARY_API_KEY || '577674637224497',
  api_secret: process.env.CLOUDINARY_API_SECRET || '_8Ks_XU3nurQTFUbVA3RxpbcXFE',
});

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// Configure multer for images only
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Configure multer for documents (PDF, images, etc.)
export const uploadDocument = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, images, and common document formats
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, images, and document files are allowed'), false);
    }
  },
});

// Helper function to upload file buffer to Cloudinary (for images)
export const uploadToCloudinary = async (fileBuffer, folder = 'uzalogistics', filename = null) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
        public_id: filename,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload image to Cloudinary'));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    
    uploadStream.end(fileBuffer);
  });
};

// Helper function to upload document to Cloudinary (PDF, images, etc.)
export const uploadDocumentToCloudinary = async (fileBuffer, folder = 'uzalogistics', filename = null, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType, // 'raw' for PDFs, 'auto' for images
        public_id: filename,
        // For PDFs, ensure they're stored as raw files
        ...(resourceType === 'raw' ? { format: 'pdf' } : {}),
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary document upload error:', error);
          reject(new Error('Failed to upload document to Cloudinary'));
        } else {
          // For raw resources (PDFs), Cloudinary returns secure_url directly
          resolve(result.secure_url);
        }
      }
    );
    
    uploadStream.end(fileBuffer);
  });
};

// Helper function to upload base64 image
export const uploadBase64 = async (base64String, folder = 'uzalogistics') => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

// Helper function to delete image from Cloudinary
export const deleteImage = async (imageUrl) => {
  try {
    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = `uzalogistics/${filename.split('.')[0]}`;
    
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw error, just log it
  }
};
