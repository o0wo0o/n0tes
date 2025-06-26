import fs from 'fs';
import path from 'path';

const contentDir = path.resolve('content');
const publicDir = path.resolve('public/content');

function copyImages(dir = contentDir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      copyImages(fullPath); // рекурсивно
    } else if (/\.(png|jpe?g|gif|webp|svg)$/i.test(file)) {
      const dest = path.join(publicDir, path.relative(contentDir, fullPath));

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(fullPath, dest);
      console.log(`Copied: ${fullPath} -> ${dest}`);
    }
  }
}

copyImages();
