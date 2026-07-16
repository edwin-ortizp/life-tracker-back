import { copyFile, mkdir, readFile, readdir } from 'node:fs/promises';

const manifestUrl = new URL('../public/build/manifest.json', import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
const cssFile = manifest['resources/css/app.css']?.file;
const jsFile = manifest['resources/js/app.js']?.file;

if (!cssFile || !jsFile) {
    throw new Error('Vite did not generate the expected CSS and JavaScript entries.');
}

const publicCssDirectory = new URL('../public/css/', import.meta.url);
const publicJsDirectory = new URL('../public/js/', import.meta.url);

await mkdir(publicCssDirectory, { recursive: true });
await mkdir(publicJsDirectory, { recursive: true });
await copyFile(
    new URL(`../public/build/${cssFile}`, import.meta.url),
    new URL('app.css', publicCssDirectory),
);
await copyFile(
    new URL(`../public/build/${jsFile}`, import.meta.url),
    new URL('app.js', publicJsDirectory),
);
const assetsDirectory = new URL('../public/build/assets/', import.meta.url);
for (const file of await readdir(assetsDirectory)) {
    if (file.endsWith('.js')) {
        await copyFile(new URL(file, assetsDirectory), new URL(file, publicJsDirectory));
    }
}

console.log('Published public/css/app.css and public/js/app.js');
