import { Router } from 'express';
import { Server } from 'socket.io';
import { createCitizenControllers } from '../controllers/citizenController';

export default (io: Server): Router => {
    const router = Router();
    const ctrl = createCitizenControllers(io);

    router.post('/report', ctrl.submitReport);
    router.get('/incidents', ctrl.getIncidents);
    router.post('/incidents/:id/dispatch', ctrl.dispatchIncident);
    router.post('/incidents/:id/resolve', ctrl.resolveIncident);

    return router;
};
