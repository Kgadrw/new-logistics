import express from 'express';
import { uploadImage, uploadBase64Image } from '../controllers/upload.controller.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

// Upload single image file
router.post('/image', upload.single('image'), uploadImage);

// Upload base64 image
router.post('/image/base64', uploadBase64Image);

export default router;
