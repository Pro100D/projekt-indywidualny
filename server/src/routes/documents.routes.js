import { Router } from 'express';
import { notImplemented } from './notImplemented.js';

const router = Router({ mergeParams: true });

router.post('/', notImplemented);
router.get('/:docId', notImplemented);
router.delete('/:docId', notImplemented);

export default router;
