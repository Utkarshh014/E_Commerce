import { Router } from 'express';
import { AuthController, validateRegister, validateLogin } from '../controllers/AuthController';
import { authGuard } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.get('/profile', authGuard, AuthController.getProfile);

export default router;
