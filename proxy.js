/**
 * 本地开发代理服务器
 * 用法: node proxy.js
 * 访问: http://localhost:3000/navigator.html
 * 
 * 将 /Setting/* 和 /Common/* 请求代理到后端服务器
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BACKEND = 'http://localhost:9998'; // 后端地址，按需修改

// MIME 类型映射
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = req.url;

  // 需要代理的路径前缀
  if (url.startsWith('/Setting/') || url.startsWith('/Common/') || url.startsWith('/OA/') || url.startsWith('/images/')) {
    const options = {
      hostname: 'localhost',
      port: 9998,
      path: url,
      method: req.method,
      headers: req.headers,
    };
    // 移除 host 头避免冲突
    delete options.headers.host;
    options.headers.host = 'localhost:9998';

    const proxy = http.request(options, (proxyRes) => {
      // 添加 CORS 头
      proxyRes.headers['access-control-allow-origin'] = '*';
      proxyRes.headers['access-control-allow-methods'] = 'POST, GET, OPTIONS';
      proxyRes.headers['access-control-allow-headers'] = 'Content-Type';
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxy.on('error', (err) => {
      console.error('代理错误:', err.message);
      res.writeHead(502);
      res.end('Backend unreachable');
    });

    req.pipe(proxy);
    return;
  }

  // OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // 静态文件服务
  let filePath = path.join(__dirname, url === '/' ? '/navigator.html' : url);
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + url);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  开发服务器已启动: http://localhost:${PORT}`);
  console.log(`  后端代理目标: ${BACKEND}`);
  console.log(`  代理路径: /Setting/*, /Common/*, /OA/*, /images/*\n`);
});
