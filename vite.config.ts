import { defineConfig } from 'vite'
import * as path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


import fs from 'fs'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function apiDevServer() {
  return {
    name: 'api-dev-server',
    configureServer(server: any) {
      if (fs.existsSync(path.resolve(__dirname, '.env'))) {
        const envContent = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf-8');
        envContent.split('\n').forEach(line => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = (match[2] || '').trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            process.env[key] = value;
          }
        });
      }

      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/')) return next();

        const urlPath = req.url.split('?')[0];
        const routeName = urlPath.replace('/api/', '');
        const apiFilePath = path.resolve(__dirname, 'api', `${routeName}.js`);

        if (!fs.existsSync(apiFilePath)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `API route ${req.url} not found` }));
          return;
        }

        let bodyBuffer = '';
        req.on('data', (chunk: any) => { bodyBuffer += chunk; });
        req.on('end', async () => {
          try {
            if (bodyBuffer) {
              try { req.body = JSON.parse(bodyBuffer); } catch { req.body = bodyBuffer; }
            } else {
              req.body = {};
            }

            res.status = (code: number) => { res.statusCode = code; return res; };
            res.json = (data: any) => {
              if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/json');
              }
              res.end(JSON.stringify(data));
              return res;
            };

            delete require.cache[require.resolve(apiFilePath)];
            const handler = require(apiFilePath);
            await handler(req, res);
          } catch (err: any) {
            console.error(`[API Dev Error on ${req.url}]:`, err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
            }
          }
        });
      });
    }
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    apiDevServer(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
