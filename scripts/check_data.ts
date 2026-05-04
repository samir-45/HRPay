import { db, employeesTable, companiesTable, announcementsTable } from '../lib/db/src/index';

async function main() {
  const companies = await db.select().from(companiesTable);
  const employees = await db.select().from(employeesTable);
  const announcements = await db.select().from(announcementsTable);

  console.log('--- Database Audit ---');
  console.log('Total Companies:', companies.length);
  console.log('Total Employees:', employees.length);
  console.log('Total Announcements:', announcements.length);
  
  if (companies.length > 0) {
    console.log('\nBreakdown by Company ID:');
    const counts: Record<number, number> = {};
    employees.forEach(e => {
      counts[e.companyId] = (counts[e.companyId] || 0) + 1;
    });
    Object.entries(counts).forEach(([id, count]) => {
      console.log(`Company ID ${id}: ${count} employees`);
    });
  }

  process.exit(0);
}

main().catch(console.error);
