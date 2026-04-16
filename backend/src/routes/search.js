/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { search } from '../services/search.js';

export default async function searchRoutes(fastify) {
  fastify.get('/api/search', async (req) => {
    const q = req.query.q ?? '';
    return search(q);
  });
}
