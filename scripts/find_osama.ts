import { db, usersTable } from '../lib/db/src/index';
import { eq } from 'drizzle-orm';

async function main() {
  const user = await db.select().from(usersTable).where(eq(usersTable.name, 'Osama'));
  console.log(JSON.stringify(user[0]));
  process.exit(0);
}

main().catch(console.error);
