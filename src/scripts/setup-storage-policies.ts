import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!dbUrl) {
  console.error("Missing DATABASE_URL or DIRECT_URL in .env");
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log("Connecting to PostgreSQL...");
  await client.connect();
  console.log("Connected successfully. Setting up storage policies...");
  
  try {
    const queries = [
      `DROP POLICY IF EXISTS "Public Upload" ON storage.objects;`,
      `CREATE POLICY "Public Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'valuation-documents');`,
      
      `DROP POLICY IF EXISTS "Public Read" ON storage.objects;`,
      `CREATE POLICY "Public Read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'valuation-documents');`,
      
      `DROP POLICY IF EXISTS "Public Delete" ON storage.objects;`,
      `CREATE POLICY "Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'valuation-documents');`,

      `DROP POLICY IF EXISTS "Employee Upload" ON storage.objects;`,
      `CREATE POLICY "Employee Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'employee-profiles');`,
      
      `DROP POLICY IF EXISTS "Employee Read" ON storage.objects;`,
      `CREATE POLICY "Employee Read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'employee-profiles');`,
      
      `DROP POLICY IF EXISTS "Employee Delete" ON storage.objects;`,
      `CREATE POLICY "Employee Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'employee-profiles');`
    ];

    for (const query of queries) {
      console.log(`Executing SQL: ${query}`);
      await client.query(query);
    }
    
    console.log("Successfully set up storage policies!");
  } catch (err) {
    console.error("Failed to set up storage policies:", err);
  } finally {
    await client.end();
  }
}

main();
