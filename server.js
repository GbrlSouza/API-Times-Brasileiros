/**
 * API REST — Times Brasileiros de Futebol (A–Z)
 * -------------------------------------------------------------
 * Objetivo: servir um catálogo JSON de clubes brasileiros (ativos e inativos),
 * com nome completo, UF, status, ano de fundação/encerramento (quando houver),
 * links/IDs úteis e enriquecimento automático de ESCUDO (imagem) e HISTÓRIA via
 * Wikipedia API em tempo de execução.
 *
 * ⚠️ Nota: "todos os times do Brasil" é um universo muito grande (milhares,
 * incluindo profissionais e amadores ao longo da história). Este servidor vem
 * com uma base inicial robusta (diversos clubes por letra A–Z) e estrutura para
 * escalar. Basta continuar adicionando itens no array `CLUBS` abaixo.
 *
 * Como rodar:
 * 1) Salve este arquivo como `server.js`.
 * 2) Crie `package.json` com:
 * {
 *   "name": "api-times-br",
 *   "version": "1.0.0",
 *   "type": "module",
 *   "main": "server.js",
 *   "scripts": {"start": "node server.js"},
 *   "dependencies": {"express": "^4.19.2", "cors": "^2.8.5", "helmet": "^7.1.0", "node-fetch": "^3.3.2"}
 * }
 * 3) `npm install` e depois `npm start`.
 *
 * Endpoints principais:
 * - GET / => status
 * - GET /clubs => lista paginada + filtros (?q=, &state=UF, &status=active|inactive, &letter=A, &limit=, &offset=)
 * - GET /clubs/:slug => detalhes + enriquecimento (escudo + história) via Wikipedia
 * - GET /openapi.json => documentação mínima OpenAPI
 *
 * Campos do clube:
 * {
 *   id, slug, short_name, full_name, city, state,
 *   founded, dissolved, status, aka:[], wikipedia_page,
 *   anthem: { title, lyrics_url, audio_url },
 *   sources: [urls]
 * }
 *
 * Enriquecimento automático ao consultar DETALHES:
 * {
 *   media: { crest_image_url, wikipedia_summary, wikipedia_url }
 * }
 *
 * Licenças/Fontes:
 * - Textos/imagens vindos da Wikipedia são cobertos por CC BY-SA 4.0 e exigem
 *   atribuição. Esta API inclui a URL da fonte nos retornos.
 */

import cors from 'cors';
import express from 'express';
import fetch from 'node-fetch';
import helmet from 'helmet';

// Utilitário simples de slug
const slugify = (s) => s
  .toString()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');

// Cache em memória para chamadas à Wikipedia
const memoryCache = new Map();
const setCache = (key, value, ttlMs = 1000 * 60 * 60 * 24) => {
  memoryCache.set(key, { value, expireAt: Date.now() + ttlMs });
};
const getCache = (key) => {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expireAt) { memoryCache.delete(key); return null; }
  return hit.value;
};

// Dataset inicial (A–Z). Adicione mais clubes livremente.
// Para escudos/história, informe o título exato da página na Wikipedia em pt.
const clubsData = require('./clubs.json'),
    CLUBS = clubsData,
    CLUBS_NORM = CLUBS.map((c, idx) => ({
        id: idx + 1,
        slug: c.slug || slugify(c.full_name || c.short_name),
        aka: [],
        sources: [],
        ...c,
    })
);

// Wikipedia helpers (REST v1)
const WIKI_BASE = 'https://pt.wikipedia.org/api/rest_v1/page/summary/';
async function fetchWikipediaSummary(title) {
  const key = `wiki:${title}`;
  const cached = getCache(key);
  if (cached) return cached;
  const url = WIKI_BASE + encodeURIComponent(title);
  const res = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!res.ok) throw new Error(`Wikipedia fetch failed: ${res.status}`);
  const data = await res.json();
  const payload = {
    title: data.title,
    wikipedia_url: data.content_urls?.desktop?.page || null,
    extract: data.extract || null,
    thumbnail: data.thumbnail?.source || null,
  };
  setCache(key, payload);
  return payload;
}

function buildClubResponse(base) {
  return {
    id: base.id,
    slug: base.slug,
    short_name: base.short_name,
    full_name: base.full_name,
    city: base.city,
    state: base.state,
    founded: base.founded || null,
    dissolved: base.dissolved || null,
    status: base.status || 'active',
    aka: base.aka || [],
    wikipedia_page: base.wikipedia_page || null,
    anthem: base.anthem || null,
    sources: base.sources || [],
  };
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'API Times BR',
    version: '1.0.0',
    docs: '/openapi.json',
    endpoints: ['/clubs', '/clubs/:slug'],
  });
});

// Listagem com filtros & paginação
app.get('/clubs', (req, res) => {
  const { q, state, status, letter, limit = '50', offset = '0' } = req.query;
  let rows = [...CLUBS_NORM];

  if (q) {
    const term = q.toString().toLowerCase();
    rows = rows.filter(c =>
      (c.full_name && c.full_name.toLowerCase().includes(term)) ||
      (c.short_name && c.short_name.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term)));
  }
  if (state) {
    rows = rows.filter(c => c.state && c.state.toLowerCase() === state.toString().toLowerCase());
  }
  if (status) {
    rows = rows.filter(c => c.status && c.status.toLowerCase() === status.toString().toLowerCase());
  }
  if (letter) {
    const L = letter.toString().toLowerCase();
    rows = rows.filter(c => (c.short_name || c.full_name).toLowerCase().startsWith(L));
  }

  const off = parseInt(offset, 10) || 0;
  const lim = Math.min(200, parseInt(limit, 10) || 50);
  const slice = rows.slice(off, off + lim).map(buildClubResponse);
  res.json({ total: rows.length, count: slice.length, offset: off, limit: lim, data: slice });
});

// Detalhe + enriquecimento (escudo/história) via Wikipedia
app.get('/clubs/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const club = CLUBS_NORM.find(c => c.slug === slug || slugify(c.short_name) === slug);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    const base = buildClubResponse(club);
    let media = null;
    if (club.wikipedia_page) {
      try {
        const sum = await fetchWikipediaSummary(club.wikipedia_page);
        media = {
          crest_image_url: sum.thumbnail || null,
          wikipedia_summary: sum.extract || null,
          wikipedia_url: sum.wikipedia_url || null,
          attribution: 'Conteúdo resumido de Wikipedia (CC BY-SA 4.0).',
        };
      } catch (e) {
        media = { crest_image_url: null, wikipedia_summary: null, wikipedia_url: null };
      }
    }

    res.json({ ...base, media });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OpenAPI básico
app.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: { title: 'API Times Brasileiros', version: '1.0.0' },
    servers: [{ url: '/' }],
    paths: {
      '/clubs': {
        get: {
          summary: 'Lista de clubes',
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' } },
            { name: 'state', in: 'query', schema: { type: 'string', example: 'SP' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['active','inactive'] } },
            { name: 'letter', in: 'query', schema: { type: 'string', example: 'S' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/clubs/{slug}': {
        get: {
          summary: 'Detalhes de um clube + mídia Wikipedia',
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'OK' }, '404': { description: 'Not Found' } }
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Times BR rodando em http://localhost:${PORT}`);
});