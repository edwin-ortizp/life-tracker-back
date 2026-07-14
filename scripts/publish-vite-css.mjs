import { copyFile, mkdir, readFile } from 'node:fs/promises';

const manifestUrl = new URL('../public/build/manifest.json', import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
const cssFile = manifest['resources/css/app.css']?.file;

if (!cssFile) {
    throw new Error('Vite did not generate the resources/css/app.css entry.');
}

const publicCssDirectory = new URL('../public/css/', import.meta.url);

await mkdir(publicCssDirectory, { recursive: true });
await copyFile(
    new URL(`../public/build/${cssFile}`, import.meta.url),
    new URL('app.css', publicCssDirectory),
);

console.log('Published public/css/app.css');
