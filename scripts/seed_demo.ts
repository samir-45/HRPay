import { db } from '../lib/db/src/index';
import { 
  departmentsTable, 
  employeesTable, 
  payrollRunsTable, 
  payStubsTable, 
  leaveRequestsTable
} from '../lib/db/src/index';

async function seed() {
  const companyId = 2; // Targeted for user Osama

  console.log('Seeding departments...');
  const depts = await db.insert(departmentsTable).values([
    { companyId, name: 'Engineering', description: 'Software and systems' },
    { companyId, name: 'Sales', description: 'Revenue and growth' },
    { companyId, name: 'HR', description: 'People and culture' },
  ]).returning();

  console.log('Seeding employees...');
  const employees = await db.insert(employeesTable).values([
    { companyId, firstName: 'Alice', lastName: 'Johnson', email: 'alice2@test.com', position: 'Senior Engineer', departmentId: depts[0].id, startDate: '2023-01-15', salary: '120000', employmentType: 'full_time' },
    { companyId, firstName: 'Bob', lastName: 'Smith', email: 'bob2@test.com', position: 'Product Manager', departmentId: depts[0].id, startDate: '2023-03-10', salary: '110000', employmentType: 'full_time' },
    { companyId, firstName: 'Charlie', lastName: 'Davis', email: 'charlie2@test.com', position: 'Sales Exec', departmentId: depts[1].id, startDate: '2023-06-01', salary: '80000', employmentType: 'full_time' },
    { companyId, firstName: 'Diana', lastName: 'Prince', email: 'diana2@test.com', position: 'HR Manager', departmentId: depts[2].id, startDate: '2022-11-20', salary: '95000', employmentType: 'full_time' },
    { companyId, firstName: 'Edward', lastName: 'Norton', email: 'edward2@test.com', position: 'Developer', departmentId: depts[0].id, startDate: '2024-01-05', salary: '90000', employmentType: 'full_time' },
  ]).returning();

  console.log('Seeding payroll runs...');
  const run1 = await db.insert(payrollRunsTable).values({
    companyId,
    name: 'April 2026 Monthly',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    payDate: '2026-05-01',
    status: 'completed',
    totalGrossPay: '45000',
    totalNetPay: '33000',
    totalTaxes: '10000',
    totalDeductions: '2000',
    employeeCount: 5,
    processedAt: new Date(),
  }).returning();

  const stubs = employees.map(emp => ({
    payrollRunId: run1[0].id,
    employeeId: emp.id,
    grossPay: (parseFloat(emp.salary!) / 12).toFixed(2),
    netPay: (parseFloat(emp.salary!) / 12 * 0.75).toFixed(2),
  }));
  await db.insert(payStubsTable).values(stubs);

  console.log('Seeding leave requests...');
  await db.insert(leaveRequestsTable).values([
    { employeeId: employees[0].id, type: 'vacation', startDate: '2026-05-10', endDate: '2026-05-15', days: '5', status: 'pending', reason: 'Vacation' },
    { employeeId: employees[1].id, type: 'sick', startDate: '2026-05-01', endDate: '2026-05-02', days: '2', status: 'approved', reason: 'Flu' },
  ]);

  console.log('Done!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
