import http from 'http';
import fs from 'fs';
import url from 'url';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'sample-news.json');

// Helper function to read the JSON database
const readDatabase = (callback) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return callback(err);
    try {
      const db = JSON.parse(data);
      callback(null, db);
    } catch (parseErr) {
      callback(parseErr);
    }
  });
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Add CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Set JSON response header for all responses
  res.setHeader('Content-Type', 'application/json');

  if (pathname === '/v2/top-headlines/sources' && method === 'GET') {
    // GET /v2/top-headlines/sources - retrieve all news sources
    readDatabase((err, db) => {
      if (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: 'Failed to read database' }));
      }
      res.end(JSON.stringify({status: 'ok', sources: db.sources}));
    });
  } else if (pathname.startsWith('/v2/top-headlines') && method === 'GET') {
    // GET /v2/top-headlines?sources={id} - retrieve headlines for a specific source
    const id = parsedUrl.query.sources; // Extract the id from the query parameters
    // Check for missing id
    if (!id) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Source ID is required' }));
    }
    readDatabase((err, db) => {
      if (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: 'Failed to read database' }));
      }

      const topHeadlines = db['top-articles'].filter(th => th.source.id === id);
      if (!topHeadlines || !topHeadlines.length) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: `No top headlines found for source ${id}` }));
      }

      res.end(JSON.stringify({status: 'ok', totalResults: topHeadlines.length, articles: topHeadlines}));

    });
  } else if (pathname.startsWith('/v2/everything') && method === 'GET') {
    // GET /v2/everything?q={query} - retrieve headlines for a specific source
    let query = parsedUrl.query.q; // Extract the query from the URL
    // Check for missing query
    if (!query) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Query parameter is required' }));
    }

    query = query.toLowerCase().trim();

    readDatabase((err, db) => {
      console.log('Error:', err);
      if (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: 'Failed to read database' }));
      }
      
      console.log(db.articles[0]);
      const articles = db.articles.filter(a => a.title?.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query) || a.author?.toLowerCase().includes(query));
      if (!articles || !articles.length) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: `No articles found for query "${query}"` }));
      }

      res.end(JSON.stringify({status: 'ok', totalResults: articles.length, articles}));
    });
  } else {
    // Endpoint not found
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});