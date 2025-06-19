/* eslint-env node */
// post-build-windows.js
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs-extra';
import { shared } from './shared.js';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para construir la aplicación con variables de entorno
async function buildWithEnv() {
    // Cargar variables del .env local
    const envConfig = dotenv.config();
    
    if (envConfig.error) {
        console.warn('⚠️  No se encontró archivo .env, usando variables del sistema');
    } else {
        console.log('✅ Variables de entorno cargadas desde .env');
    }
    
    console.log('🔄 Construyendo aplicación con variables de entorno...');
    
    // Construir las variables de entorno para el comando de build
    const envVars = {
        VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY,
        VITE_GEMINI_TASK_PROMPT: process.env.VITE_GEMINI_TASK_PROMPT,
        VITE_GEMINI_JOURNAL_PROMPT: process.env.VITE_GEMINI_JOURNAL_PROMPT,
        VITE_GEMINI_MEAL_PROMPT: process.env.VITE_GEMINI_MEAL_PROMPT
    };

    // Verificar que las variables estén definidas
    const missingVars = Object.entries(envVars).filter(([, value]) => !value);
    if (missingVars.length > 0) {
        console.warn('⚠️  Variables de entorno faltantes:', missingVars.map(([k]) => k).join(', '));
    }

    try {
        // Ejecutar build directamente (las variables ya están en process.env)
        execSync('npm run build', { 
            stdio: 'inherit', 
            shell: 'powershell.exe',
            cwd: __dirname,
            env: { ...process.env, ...envVars }
        });
        console.log('✅ Build completado con variables de entorno');
    } catch (error) {
        console.error('❌ Error durante el build:', error.message);
        throw error;
    }
}

// Función para crear variables de entorno para GitHub Pages
async function createEnvForGitHubPages() {
    // Cargar variables del .env local
    dotenv.config();
    
    const envVars = {
        VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY,
        VITE_GEMINI_TASK_PROMPT: process.env.VITE_GEMINI_TASK_PROMPT,
        VITE_GEMINI_JOURNAL_PROMPT: process.env.VITE_GEMINI_JOURNAL_PROMPT,
        VITE_GEMINI_MEAL_PROMPT: process.env.VITE_GEMINI_MEAL_PROMPT
    };

    // Crear archivo .env en el directorio de destino
    const envContent = Object.entries(envVars)
        .filter(([, value]) => value !== undefined)
        .map(([k, value]) => `${k}=${value}`)
        .join('\n');

    const envPath = path.join(config.destinationPath, '.env');
    await fs.writeFile(envPath, envContent);
    console.log('✅ Archivo .env creado en destino');
}

const config = {
    sourcePath: path.join(__dirname, 'dist'),
    destinationPath: 'C:\\laragon\\www\\life-tracker',
    ignore: ['.DS_Store', 'thumbs.db'],
    copyEnv: true
};

// Ejecutar el script
(async () => {
    try {
        // Primero construir con variables de entorno
        await buildWithEnv();
        
        // Luego copiar archivos (incluye limpieza automática del directorio)
        await shared.copyDistFiles(config);
        
        if (config.copyEnv) {
            await createEnvForGitHubPages();
        }
        
        console.log('🎉 Deploy completado exitosamente!');
    } catch (error) {
        console.error('❌ Error en el proceso de deploy:', error);
        process.exit(1);
    }
})();