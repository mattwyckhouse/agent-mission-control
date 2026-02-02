import postgres from 'postgres';

const sql = postgres('postgres://postgres.wjwtgdmaklohgjsuqsyk:yIJ62SozcBnK1FzH@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require');

async function verifySchema() {
  try {
    // Check tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    console.log('Tables created:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check agents
    const agents = await sql`SELECT name, display_name, emoji, domain FROM agents ORDER BY name`;
    console.log(`\nAgents seeded: ${agents.length}`);
    agents.forEach(a => console.log(`  ${a.emoji} ${a.display_name} (${a.name}) - ${a.domain}`));
    
  } catch (error) {
    console.error('Verification failed:', error.message);
  } finally {
    await sql.end();
  }
}

verifySchema();
