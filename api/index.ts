import app, { createServer } from '../server';

let isInitialized = false;

export default async (req: any, res: any) => {
  if (!isInitialized) {
    await createServer();
    isInitialized = true;
  }
  return app(req, res);
};
