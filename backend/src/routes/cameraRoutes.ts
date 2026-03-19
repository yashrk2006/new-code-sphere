import { Router } from 'express';
import { getCameras, scanNetworkCameras } from '../controllers/cameraController';

const router = Router();

router.get('/', getCameras);
router.post('/scan', scanNetworkCameras);

export default router;
