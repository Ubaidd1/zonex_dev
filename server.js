const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');

const ROOT_DIR = __dirname;
const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function resolvePath(urlPath) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(urlPath);
  } catch {
    decodedPath = urlPath;
  }

  // Remove query parameters and hash
  decodedPath = decodedPath.split('?')[0].split('#')[0];

  // Prevent directory traversal
  const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  const fullPath = path.join(ROOT_DIR, safePath);

  // Exact file match
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }

  // Exact directory match with index.html
  const dirIndex = path.join(fullPath, 'index.html');
  if (fs.existsSync(dirIndex) && fs.statSync(dirIndex).isFile()) {
    return dirIndex;
  }

  // Extensionless .html match
  const htmlPath = fullPath + '.html';
  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    return htmlPath;
  }

  // Clean route aliases: /company -> /company/index.html or /about/index.html
  if (safePath === '/company' || safePath === 'company') {
    const companyIndex = path.join(ROOT_DIR, 'company', 'index.html');
    if (fs.existsSync(companyIndex)) return companyIndex;
    const aboutIndex = path.join(ROOT_DIR, 'about', 'index.html');
    if (fs.existsSync(aboutIndex)) return aboutIndex;
  }

  return null;
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname || '/';

  // Redirect /home to /
  if (pathname === '/home' || pathname === '/home/') {
    res.writeHead(301, { 'Location': '/' });
    res.end();
    return;
  }

  // Log incoming requests
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

  const targetFile = resolvePath(pathname);

  if (!targetFile) {
    console.log(`[${timestamp}] 404 ${req.method} ${pathname}`);
    const notFoundPath = path.join(ROOT_DIR, '404.html');
    if (fs.existsSync(notFoundPath)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(notFoundPath));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 Not Found</h1>');
    return;
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(targetFile, (err, data) => {
    if (err) {
      console.error(`[${timestamp}] 500 Error reading ${targetFile}:`, err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Server Error');
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    // Cache control
    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, must-revalidate';
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    // Compression support
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const isCompressible = /^(text\/|application\/javascript|application\/json|image\/svg\+xml)/.test(contentType);

    if (isCompressible && acceptEncoding.includes('gzip')) {
      headers['Content-Encoding'] = 'gzip';
      zlib.gzip(data, (compressErr, compressedData) => {
        if (compressErr) {
          res.writeHead(200, headers);
          res.end(data);
          return;
        }
        res.writeHead(200, headers);
        res.end(compressedData);
      });
    } else if (isCompressible && acceptEncoding.includes('deflate')) {
      headers['Content-Encoding'] = 'deflate';
      zlib.deflate(data, (compressErr, compressedData) => {
        if (compressErr) {
          res.writeHead(200, headers);
          res.end(data);
          return;
        }
        res.writeHead(200, headers);
        res.end(compressedData);
      });
    } else {
      res.writeHead(200, headers);
      res.end(data);
    }

    console.log(`[${timestamp}] 200 ${req.method} ${pathname} -> ${path.relative(ROOT_DIR, targetFile) || 'index.html'}`);
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`⚡ ZonexDev Development Server`);
    console.log(`======================================================`);
    console.log(`🌐 Local URL:    http://localhost:${port}/`);
    console.log(`\n📁 Clean URL Routes:`);
    console.log(`   • Home:       http://localhost:${port}/`);
    console.log(`   • Company:    http://localhost:${port}/company`);
    console.log(`   • About:      http://localhost:${port}/about`);
    console.log(`   • Services:   http://localhost:${port}/services`);
    console.log(`   • Projects:   http://localhost:${port}/projects`);
    console.log(`   • Startups:   http://localhost:${port}/startups`);
    console.log(`   • Contact:    http://localhost:${port}/contact`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} in use, attempting port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

const argPort = process.argv[2] ? parseInt(process.argv[2], 10) : null;
startServer(argPort || DEFAULT_PORT);
