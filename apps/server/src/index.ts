import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { z } from 'zod';
import { SemanticLayer } from '@semanticlayer/core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Fastify({ logger: true });

// Register plugins
server.register(cors, { origin: '*' });
server.register(rateLimit, { max: 50, timeWindow: '1 minute' });

// Serve Static Web App
const webDistPath = path.join(__dirname, '../../web/dist');
server.register(fastifyStatic, {
  root: webDistPath,
  prefix: '/',
  wildcard: false, // Don't match /api
});

const sl = new SemanticLayer({
  browser: { 
    maxInstances: 2, 
    headless: true
  },
  logLevel: 0
});

const ExtractSchema = z.object({
  url: z.string().url(),
  mode: z.enum(['content', 'structured', 'full', 'raw']).default('full'),
  format: z.enum(['markdown', 'slml', 'json', 'text']).default('slml'),
  includeImages: z.boolean().default(true),
  includeLinks: z.boolean().default(true),
});

// API Endpoint
server.post('/api/extract', async (request, reply) => {
  try {
    const data = ExtractSchema.parse(request.body);
    
    const result = await sl.extract({
      url: data.url,
      mode: data.mode as any,
      format: data.format as any,
      includeImages: data.includeImages,
      includeLinks: data.includeLinks,
    });

    return reply.send(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return reply.code(400).send({ success: false, errors: err.errors.map(e => `${e.path.join('.')}: ${e.message}`) });
    }
    return reply.code(500).send({ success: false, errors: [err.message || 'Internal Server Error'] });
  }
});

// Fallback to index.html for SPA routing
server.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith('/api')) {
    return reply.code(404).send({ error: 'API route not found' });
  }
  return reply.sendFile('index.html');
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3100;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`SemanticLayer Server is running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

process.on('SIGINT', async () => {
  await sl.close();
  process.exit(0);
});
