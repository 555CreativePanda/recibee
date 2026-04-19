import app from './api/index';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const PORT = 3000;

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
