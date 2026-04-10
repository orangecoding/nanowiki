import { search } from '../services/search.js';

export default async function searchRoutes(fastify) {
  fastify.get('/api/search', async (req) => {
    const q = req.query.q ?? '';
    return search(q);
  });
}
