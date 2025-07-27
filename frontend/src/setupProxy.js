const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for all backend API routes
  app.use(
    ['/claims', '/providers', '/risks', '/policies', '/patients'],
    createProxyMiddleware({
      target: 'http://localhost:8000', // Your FastAPI server runs on port 8000
      changeOrigin: true,
      secure: false,
      logLevel: 'info',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, api-key'
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        console.error('Request URL:', req.url);
        console.error('Target:', 'http://localhost:8000' + req.url);
        
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          error: 'Proxy error', 
          message: err.message,
          target: 'http://localhost:8000' + req.url
        }));
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.url} -> http://localhost:8000${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[PROXY RESPONSE] ${proxyRes.statusCode} for ${req.url}`);
        // Add CORS headers to response
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, api-key';
      }
    })
  );
};
