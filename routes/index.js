import { Router } from 'express';

const router = Router();

// endpoint de salud para probar que todo anda
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'worknow-backend', timestamp: new Date().toISOString() });
});

export default router;