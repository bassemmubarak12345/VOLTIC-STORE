import fs from 'fs';
import path from 'path';

/**
 * Script to automatically find banners anywhere in the repository:
 * 1. Root directory (e.g. banner-1.jpg, banner-2.png, banner1.jpg)
 * 2. public/ directory (e.g. public/banner-1.jpg)
 * 3. public/banners/ directory (e.g. public/banners/banner-1.jpg)
 * 
 * It synchronizes them into public/ and public/banners/ and updates
 * src/data/banners.ts with automatic cache-busting (?v=timestamp)
 * so that updates in GitHub show up instantly on Cloudflare!
 */

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const publicBannersDir = path.join(publicDir, 'banners');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(publicBannersDir)) {
  fs.mkdirSync(publicBannersDir, { recursive: true });
}

const detectedBanners = new Map();

function scanDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    // Match banner-1, banner_1, banner1, Banner-1, etc.
    const match = file.match(/^banner[-_]?(\d+)\.(jpg|jpeg|png|webp|svg)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      const ext = path.extname(file).toLowerCase();
      const fullPath = path.join(dirPath, file);
      
      try {
        const stats = fs.statSync(fullPath);
        if (stats.isFile() && stats.size > 0) {
          // If we haven't found this number yet, or if this file was modified more recently
          if (!detectedBanners.has(num)) {
            detectedBanners.set(num, { num, ext, sourcePath: fullPath });
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

// 1. Scan root dir first (in case user uploaded files directly to repo root)
scanDir(rootDir);

// 2. Scan public/
scanDir(publicDir);

// 3. Scan public/banners/
scanDir(publicBannersDir);

const sortedNums = Array.from(detectedBanners.keys()).sort((a, b) => a - b);
const buildTimestamp = Date.now();

console.log(`[sync-banners] Found ${sortedNums.length} banner(s): ${sortedNums.map(n => `banner-${n}`).join(', ')}`);

const bannersForDataTs = [];
const categories = ['summer', 'winter', 'occasions', 'sport'];

for (const num of sortedNums) {
  const item = detectedBanners.get(num);
  const standardJpgName = `banner-${num}.jpg`;
  const standardExtName = `banner-${num}${item.ext}`;

  // Copy to public/banners/
  const destInBannersStandard = path.join(publicBannersDir, standardJpgName);
  const destInBannersOriginal = path.join(publicBannersDir, standardExtName);
  const destInPublicStandard = path.join(publicDir, standardJpgName);
  const destInPublicOriginal = path.join(publicDir, standardExtName);

  try {
    if (item.sourcePath !== destInBannersStandard) {
      fs.copyFileSync(item.sourcePath, destInBannersStandard);
    }
    if (item.sourcePath !== destInBannersOriginal) {
      fs.copyFileSync(item.sourcePath, destInBannersOriginal);
    }
    if (item.sourcePath !== destInPublicStandard) {
      fs.copyFileSync(item.sourcePath, destInPublicStandard);
    }
    if (item.sourcePath !== destInPublicOriginal) {
      fs.copyFileSync(item.sourcePath, destInPublicOriginal);
    }
  } catch (err) {
    console.warn(`[sync-banners] Warning copying banner-${num}:`, err);
  }

  const category = categories[(num - 1) % categories.length];

  bannersForDataTs.push({
    id: `banner-${num}`,
    image: `/banners/${standardJpgName}?v=${buildTimestamp}`,
    fallbackImage: `/banner-${num}.jpg?v=${buildTimestamp}`,
    altAr: `VOLTIC بنر ${num}`,
    altEn: `VOLTIC Banner ${num}`,
    category,
  });
}

// If no banners detected at all, keep a minimum of 3 placeholders
if (bannersForDataTs.length === 0) {
  for (let num = 1; num <= 3; num++) {
    bannersForDataTs.push({
      id: `banner-${num}`,
      image: `/banners/banner-${num}.jpg?v=${buildTimestamp}`,
      fallbackImage: `/banner-${num}.jpg?v=${buildTimestamp}`,
      altAr: `VOLTIC بنر ${num}`,
      altEn: `VOLTIC Banner ${num}`,
      category: categories[(num - 1) % categories.length],
    });
  }
}

const dataBannersPath = path.join(rootDir, 'src', 'data', 'banners.ts');
const newContent = `export interface BannerItem {
  id: string;
  image: string;
  fallbackImage?: string;
  altAr: string;
  altEn: string;
  code?: string;
  category?: 'summer' | 'winter' | 'occasions' | 'sport';
}

export const DEFAULT_BANNERS: BannerItem[] = ${JSON.stringify(bannersForDataTs, null, 2)};
`;

fs.writeFileSync(dataBannersPath, newContent, 'utf-8');
console.log(`[sync-banners] Updated src/data/banners.ts successfully with cache-busting (?v=${buildTimestamp})`);
