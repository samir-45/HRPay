import { db } from '../lib/db/src/index';
import { 
  departmentsTable, 
  employeesTable, 
  payrollRunsTable, 
  payStubsTable, 
  leaveRequestsTable,
  timeEntriesTable,
  shiftsTable,
  attendanceDevicesTable
} from '../lib/db/src/index';
import { addDays, format, isWeekend } from 'date-fns';

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
    { companyId, firstName: 'Osama', lastName: 'Khan', email: 'osama@test.com', position: 'Lead Engineer', departmentId: depts[0].id, startDate: '2023-01-10', salary: '130000', employmentType: 'full_time' },
    { companyId, firstName: 'Alice', lastName: 'Johnson', email: 'alice2@test.com', position: 'Senior Engineer', departmentId: depts[0].id, startDate: '2023-01-15', salary: '120000', employmentType: 'full_time' },
    { companyId, firstName: 'Bob', lastName: 'Smith', email: 'bob2@test.com', position: 'Product Manager', departmentId: depts[0].id, startDate: '2023-03-10', salary: '110000', employmentType: 'full_time' },
    { companyId, firstName: 'Charlie', lastName: 'Davis', email: 'charlie2@test.com', position: 'Sales Exec', departmentId: depts[1].id, startDate: '2023-06-01', salary: '80000', employmentType: 'full_time' },
    { companyId, firstName: 'Diana', lastName: 'Prince', email: 'diana2@test.com', position: 'HR Manager', departmentId: depts[2].id, startDate: '2022-11-20', salary: '95000', employmentType: 'full_time' },
    { companyId, firstName: 'Edward', lastName: 'Norton', email: 'edward2@test.com', position: 'Developer', departmentId: depts[0].id, startDate: '2024-01-05', salary: '90000', employmentType: 'full_time' },
  ]).returning();

  console.log('Seeding shifts...');
  const shifts = await db.insert(shiftsTable).values([
    { companyId, name: 'Morning Shift', startTime: '09:00:00', endTime: '17:00:00', graceMinutes: 10, breakMinutes: 30, workingDays: ['mon','tue','wed','thu','fri'], overtimeThreshold: '8', color: '#84cc16' },
    { companyId, name: 'Evening Shift', startTime: '14:00:00', endTime: '22:00:00', graceMinutes: 5, breakMinutes: 30, workingDays: ['mon','tue','wed','thu','fri','sat'], overtimeThreshold: '8', color: '#3b82f6' },
    { companyId, name: 'Night Shift', startTime: '22:00:00', endTime: '06:00:00', graceMinutes: 15, breakMinutes: 60, workingDays: ['mon','tue','wed','thu','fri','sat','sun'], overtimeThreshold: '8', color: '#8b5cf6' },
  ]).returning();

  console.log('Seeding attendance devices...');
  await db.insert(attendanceDevicesTable).values([
    { companyId, name: 'Main Entrance', brand: 'ZKTeco', deviceType: 'fingerprint', connectionMethod: 'TCP/IP', status: 'online', punchesToday: 12, location: 'Main Lobby' },
    { companyId, name: 'Floor 2 Entry', brand: 'Hikvision', deviceType: 'facial', connectionMethod: 'Webhook', status: 'offline', punchesToday: 0, location: '2nd Floor' },
  ]);

  console.log('Seeding time entries for all employees...');
  const timeEntries = [];
  const methods = ['fingerprint', 'face', 'nfc', 'manual'];
  const today = new Date(2026, 4, 4); // May 4, 2026

  for (const emp of employees) {
    // Generate entries for past 30 days
    for (let i = 30; i >= 0; i--) {
      const entryDate = addDays(today, -i);
      const dateStr = format(entryDate, 'yyyy-MM-dd');
      
      // Skip weekends (70% chance to skip if weekend)
      if (isWeekend(entryDate) && Math.random() > 0.3) continue;
      
      // 10% chance of being absent
      if (Math.random() < 0.1) {
        timeEntries.push({
          employeeId: emp.id,
          date: dateStr,
          clockIn: null,
          clockOut: null,
          hoursWorked: '0',
          overtimeHours: '0',
          notes: 'Absent',
          status: 'pending',
          method: 'manual',
          lateMinutes: 0,
          isRegularized: false,
        });
        continue;
      }

      // 70% on time, 20% late, 10% very late
      let startHour = 9, startMinute = 0;
      let lateMinutes = 0;
      const rand = Math.random();
      if (rand < 0.7) {
        // On time: 8:55-9:05
        startMinute = Math.floor(Math.random() * 11) - 5;
      } else if (rand < 0.9) {
        // Late: 9:05-9:25 (5-25 min late)
        startMinute = 5 + Math.floor(Math.random() * 21);
        lateMinutes = startMinute;
      } else {
        // Very late: 9:25-10:00
        startMinute = 25 + Math.floor(Math.random() * 36);
        lateMinutes = startMinute;
      }
      startHour = 9 + Math.floor(startMinute / 60);
      startMinute = startMinute % 60;

      const endHour = 17 + Math.floor(Math.random() * 3); // 17-19
      const endMinute = Math.floor(Math.random() * 60);
      
      const clockIn = new Date(entryDate);
      clockIn.setHours(startHour, startMinute, 0, 0);
      
      const clockOut = new Date(entryDate);
      clockOut.setHours(endHour, endMinute, 0, 0);
      
      const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / 3600000;
      const overtimeHours = hoursWorked > 8 ? hoursWorked - 8 : 0;
      
      const method = methods[Math.floor(Math.random() * methods.length)];
      
      timeEntries.push({
        employeeId: emp.id,
        date: dateStr,
        clockIn: clockIn.toISOString(),
        clockOut: clockOut.toISOString(),
        hoursWorked: hoursWorked.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2),
        notes: lateMinutes > 0 ? `Late by ${lateMinutes} min` : '',
        status: 'approved',
        method,
        lateMinutes,
        isRegularized: false,
        shiftId: shifts[0].id, // Assign morning shift by default
      });
    }
  }

  // Batch insert time entries
  await db.insert(timeEntriesTable).values(timeEntries);
  console.log(`Seeded ${timeEntries.length} time entries`);

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
    employeeCount: employees.length,
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
