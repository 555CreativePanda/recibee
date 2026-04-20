import app from './api/index';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { rateLimit } from 'express-rate-limit';

const PORT = 3000;

// Rate limiting for production static files to prevent FS-based DoS
const prodLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 200, // Slightly higher limit for static assets
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests for static assets.' }
});

async function startDevServer() {
  console.log('Checking environment...');
  console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
  
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dev server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'production') {
  startDevServer();
} else {
  // Production local run (e.g. for testing build)
  app.use(prodLimiter);
  const distPath = path.join(process.cwd(), 'dist');
  const express = (await import('express')).default;
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Production server running on http://localhost:${PORT}`);
  });
}
