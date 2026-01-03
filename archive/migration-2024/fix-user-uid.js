/**
 * Script para reemplazar user.uid por user.id en toda la codebase
 * Migración Firebase → Supabase
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const extensions = ['.ts', '.tsx', '.js', '.jsx'];
const excludeDirs = ['node_modules', 'dist', '.git', 'build'];

function shouldProcessFile(filePath) {
  return extensions.some(ext => filePath.endsWith(ext));
}

function processDirectory(dirPath) {
  const entries = readdirSync(dirPath);

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(entry)) {
        processDirectory(fullPath);
      }
    } else if (stat.isFile() && shouldProcessFile(fullPath)) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    const original = content;

    // Reemplazar todas las variantes de user.uid → user.id
    content = content.replace(/user\.uid\b/g, 'user.id');
    content = content.replace(/user\?\.uid\b/g, 'user?.id');

    // Solo escribir si hubo cambios
    if (content !== original) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

console.log('🔄 Starting user.uid → user.id migration...\n');

const srcPath = join(process.cwd(), 'src');
processDirectory(srcPath);

console.log('\n✅ Migration complete!');
