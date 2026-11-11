import { Router } from 'express';
import { notImplemented } from './notImplemented.js';

const router = Router();

router.get('/', notImplemented);
router.put('/read-all', notImplemented);
router.put('/:id', notImplemented);

export default router;
