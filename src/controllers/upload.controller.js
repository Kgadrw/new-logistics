// Upload controller for handling image uploads
import { uploadToCloudinary, uploadBase64 } from '../utils/upload.js';

// Upload single image file
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = req.body.folder || 'uzalogistics';
    const imageUrl = await uploadToCloudinary(req.file.buffer, folder);

    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
};

// Upload base64 image
export const uploadBase64Image = async (req, res) => {
  try {
    const { base64, folder } = req.body;

    if (!base64) {
      return res.status(400).json({ error: 'No base64 image provided' });
    }

    const imageUrl = await uploadBase64(base64, folder || 'uzalogistics');

    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Upload base64 image error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
};
