import app, { createServer } from '../server';

export default async (req: any, res: any) => {
  await createServer();
  return app(req, res);
};
