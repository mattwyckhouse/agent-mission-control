import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = postgres('postgres://postgres.wjwtgdmaklohgjsuqsyk:yIJ62SozcBnK1FzH@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require');

async function runMigration() {
  try {
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260202112107_initial_schema.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    await sql.unsafe(migrationSql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('(Some objects may already exist, which is fine for idempotent migrations)');
    }
  } finally {
    await sql.end();
  }
}

runMigration();
