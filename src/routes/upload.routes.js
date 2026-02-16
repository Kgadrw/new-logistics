import express from 'express';
import { uploadImage, uploadBase64Image, uploadDocument } from '../controllers/upload.controller.js';
import { upload, uploadDocument as uploadDocumentMiddleware } from '../utils/upload.js';

const router = express.Router();

// Upload single image file
router.post('/image', upload.single('image'), uploadImage);

// Upload base64 image
router.post('/image/base64', uploadBase64Image);

// Upload document file (PDF, images, etc.)
router.post('/document', uploadDocumentMiddleware.single('document'), uploadDocument);

export default router;
