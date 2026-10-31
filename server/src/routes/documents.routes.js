// Funkcja 6: Dokumenty w chmurze (AWS S3)
// Montowane pod /api/purchases/:id/documents
import { Router } from 'express';
import { notImplemented } from './notImplemented.js';

const router = Router({ mergeParams: true });

router.post('/', notImplemented);
router.get('/:docId', notImplemented);
router.delete('/:docId', notImplemented);

export default router;
