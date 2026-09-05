import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function bannerSaverPlugin(): Plugin {
  return {
    name: 'banner-saver-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-banners', (req, res, next) => {
        if (req.method !== 'POST') return next();

        const chunks: Buffer[] = [];
        req.on('data', (chunk) => {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        });

        req.on('end', () => {
          try {
            const rawBody = Buffer.concat(chunks).toString('utf-8');
            const data = JSON.parse(rawBody);
            const banners = Array.isArray(data.banners) ? data.banners : [];

            const publicBannersDir = path.resolve(process.cwd(), 'public/banners');
            if (!fs.existsSync(publicBannersDir)) {
              fs.mkdirSync(publicBannersDir, { recursive: true });
            }

            const savedBanners: Array<{
              id: string;
              image: string;
              altAr: string;
              altEn: string;
              category?: string;
            }> = [];

            banners.forEach((banner: any, index: number) => {
              const imageStr: string = banner.image || '';
              let fileName = `banner-${index + 1}.jpg`;
              let fileRelPath = `/banners/${fileName}`;

              if (typeof imageStr === 'string' && imageStr.startsWith('data:')) {
                const matches = imageStr.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
                if (matches) {
                  const mimeType = matches[1];
                  const base64Data = matches[2];
                  const ext = mimeType.includes('png')
                    ? 'png'
                    : mimeType.includes('webp')
                    ? 'webp'
                    : mimeType.includes('svg')
                    ? 'svg'
                    : 'jpg';
                  fileName = `banner-${index + 1}.${ext}`;
                  fileRelPath = `/banners/${fileName}`;
                  const filePath = path.join(publicBannersDir, fileName);
                  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                }
              } else if (
                typeof imageStr === 'string' &&
                (imageStr.startsWith('http://') || imageStr.startsWith('https://'))
              ) {
                fileRelPath = imageStr;
              } else if (typeof imageStr === 'string' && imageStr.trim()) {
                fileRelPath = imageStr.trim();
              }

              savedBanners.push({
                id: `banner-${index + 1}`,
                image: fileRelPath,
                altAr: banner.altAr || `بنر إعلاني ${index + 1}`,
                altEn: banner.altEn || `Banner ${index + 1}`,
                category: banner.category || 'summer',
              });
            });

            const bannersTsPath = path.resolve(process.cwd(), 'src/data/banners.ts');
            const bannersTsContent = `export interface BannerItem {
  id: string;
  image: string;
  fallbackImage?: string;
  altAr: string;
  altEn: string;
  code?: string;
  category?: 'summer' | 'winter' | 'occasions' | 'sport';
}

export const DEFAULT_BANNERS: BannerItem[] = ${JSON.stringify(savedBanners, null, 2)};
`;
            fs.writeFileSync(bannersTsPath, bannersTsContent, 'utf-8');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, savedBanners }));
          } catch (err) {
            console.error('Failed to save banners:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      bannerSaverPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
