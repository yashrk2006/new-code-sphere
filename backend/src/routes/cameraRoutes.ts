import { Router } from 'express';
import { getCameras, addCamera, removeCamera } from '../controllers/cameraController';

const router = Router();

router.get('/', getCameras);
router.post('/', addCamera);
router.delete('/:id', removeCamera);

export default router;
