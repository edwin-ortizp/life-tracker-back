// shared-build.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';

const execPromise = promisify(exec);

export const shared = {
    async executeCommand(command, cwd) {
        try {
            const { stdout, stderr } = await execPromise(command, { cwd });
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
            return true;
        } catch (error) {
            console.error(`Error ejecutando comando: ${command}`);
            console.error(error);
            return false;
        }
    },

    async cleanDestinationDirectory(destinationPath) {
        try {
            console.log('\n🧹 Limpiando directorio de destino...');
            
            const items = await fs.readdir(destinationPath);
            
            for (const item of items) {
                const itemPath = path.join(destinationPath, item);
                const stat = await fs.stat(itemPath);
                
                // Mantener archivos y carpetas que empiecen con punto (como .git, .gitignore, etc.)
                if (item.startsWith('.')) {
                    console.log(`  ⏭️  Manteniendo: ${item}`);
                    continue;
                }
                
                // Eliminar archivos y carpetas que no empiecen con punto
                if (stat.isDirectory()) {
                    await fs.remove(itemPath);
                    console.log(`  🗂️  Carpeta eliminada: ${item}`);
                } else {
                    await fs.remove(itemPath);
                    console.log(`  📄 Archivo eliminado: ${item}`);
                }
            }
            
            console.log('✅ Directorio limpiado exitosamente');
        } catch (error) {
            console.error('❌ Error al limpiar directorio:', error);
            throw error;
        }
    },    async syncWithRemote(config) {
        console.log('\n🔄 Sincronizando con repositorio remoto...');
        
        process.chdir(config.destinationPath);
        
        const syncCommands = [
            'git reset --hard origin/main',
            'git pull'
        ];
        
        for (const command of syncCommands) {
            console.log(`\nEjecutando: ${command}`);
            const success = await this.executeCommand(command, config.destinationPath);
            if (!success) {
                throw new Error(`Falló el comando: ${command}`);
            }
        }
        
        console.log('✅ Sincronización completada');
    },

    async commitAndPush(config) {
        const date = new Date().toISOString().replace(/[:.]/g, '-');
        const commitMessage = `Build actualizado ${date}`;

        console.log('\n� Haciendo commit y push de los cambios...');

        process.chdir(config.destinationPath);
        
        const gitCommands = [
            'git add .',
            `git commit -m "${commitMessage}"`,
            'git push'
        ];        for (const command of gitCommands) {
            console.log(`\nEjecutando: ${command}`);
            const success = await this.executeCommand(command, config.destinationPath);
            if (!success) {
                throw new Error(`Falló el comando: ${command}`);
            }
        }

        console.log('\n✅ Commit y push completados exitosamente');
    },

    async copyDistFiles(config) {
        try {
            console.log('🚀 Iniciando proceso de build y deploy...');

            if (!await fs.exists(config.sourcePath)) {
                throw new Error(`La carpeta de origen no existe: ${config.sourcePath}`);
            }            if (!await fs.exists(config.destinationPath)) {
                throw new Error(`La carpeta de destino no existe: ${config.destinationPath}`);
            }

            // Primero sincronizar con el repositorio remoto
            await this.syncWithRemote(config);

            // Limpiar directorio de destino antes de copiar
            await this.cleanDestinationDirectory(config.destinationPath);

            console.log('\n📂 Copiando archivos...');
            await fs.copy(config.sourcePath, config.destinationPath, {
                filter: (src) => {
                    const filename = path.basename(src);
                    return !config.ignore.includes(filename);
                },
                overwrite: true
            });

            console.log('✅ Archivos copiados exitosamente');
            
            const files = await fs.readdir(config.destinationPath);
            console.log('\nArchivos en destino:');
            files.forEach(file => console.log(`- ${file}`));

            // Hacer commit y push de los cambios
            await this.commitAndPush(config);

            console.log('\n✨ ¡Proceso completado exitosamente!');

        } catch (error) {
            console.error('\n❌ Error durante el proceso:', error);
            process.exit(1);
        }
    }
};