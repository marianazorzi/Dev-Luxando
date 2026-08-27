import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function conectar(caminho: string = join(__dirname, '..', 'gestao_financeira.db')): DatabaseSync {
  const banco = new DatabaseSync(caminho);
  banco.exec('PRAGMA foreign_keys = ON');
  const schema = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf-8');
  banco.exec(schema);
  return banco;
}
