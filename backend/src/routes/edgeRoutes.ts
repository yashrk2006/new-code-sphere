import { Router } from 'express';
import { getEdgeNodes, sendEdgeCommand, updateHeartbeat, receiveBoxes } from '../controllers/edgeController';

const router = Router();

router.get('/', getEdgeNodes);
router.post('/heartbeat', updateHeartbeat);
router.post('/:id/command', sendEdgeCommand);
router.post('/:id/boxes', receiveBoxes);

export default router;
