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

    async handleGitOperations(config) {
        const date = new Date().toISOString().replace(/[:.]/g, '-');
        const commitMessage = `Build actualizado ${date}`;

        console.log('\n🔄 Iniciando operaciones de Git...');

        process.chdir(config.destinationPath);

        const gitCommands = [
            'git add .',
            `git commit -m "${commitMessage}"`,
            'git push'
        ];

        for (const command of gitCommands) {
            console.log(`\nEjecutando: ${command}`);
            const success = await this.executeCommand(command, config.destinationPath);
            if (!success) {
                throw new Error(`Falló el comando: ${command}`);
            }
        }

        console.log('\n✅ Operaciones de Git completadas exitosamente');
    },

    async copyDistFiles(config) {
        try {
            console.log('🚀 Iniciando proceso de build y deploy...');

            if (!await fs.exists(config.sourcePath)) {
                throw new Error(`La carpeta de origen no existe: ${config.sourcePath}`);
            }

            if (!await fs.exists(config.destinationPath)) {
                throw new Error(`La carpeta de destino no existe: ${config.destinationPath}`);
            }

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

            await this.handleGitOperations(config);

            console.log('\n✨ ¡Proceso completado exitosamente!');

        } catch (error) {
            console.error('\n❌ Error durante el proceso:', error);
            process.exit(1);
        }
    }
};