import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { z } from 'zod';
import { SemanticLayer } from '@semanticlayer/core';

const server = Fastify({ logger: true });

// Register plugins
server.register(cors, { origin: '*' });
server.register(rateLimit, { max: 100, timeWindow: '1 minute' });

const sl = new SemanticLayer({
  browser: { maxInstances: 3, headless: true },
  logLevel: 0
});

const ExtractSchema = z.object({
  url: z.string().url(),
  mode: z.enum(['content', 'structured', 'full', 'raw']).default('full'),
  format: z.enum(['markdown', 'slml', 'json', 'text']).default('slml'),
  includeImages: z.boolean().default(true),
  includeLinks: z.boolean().default(true),
});

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

const start = async () => {
  try {
    await server.listen({ port: 3100, host: '0.0.0.0' });
    console.log('SemanticLayer API Gateway is running on http://localhost:3100');
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
