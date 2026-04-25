import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware';
import { authGuard, requireApprovedVendor } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authGuard, requireApprovedVendor, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No image provided' });
    return;
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ success: true, data: { imageUrl } });
});

export default router;
