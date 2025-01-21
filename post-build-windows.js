// post-build-windows.js
import { fileURLToPath } from 'url';
import path from 'path';
import { shared } from './shared.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    sourcePath: path.join(__dirname, 'dist'),
    destinationPath: 'C:\\laragon\\www\\life-tracker',
    ignore: ['.DS_Store', 'thumbs.db']
};

// Ejecutar el script
shared.copyDistFiles(config);