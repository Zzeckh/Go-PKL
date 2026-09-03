import prisma from '../config/db.js';

const getScope = (user) => {
  if (user.role === 'teacher') return { role: 'student', teacherId: user.id };
  if (user.role === 'mentor') return { role: 'student', company: { mentorId: user.id } };
  return { role: 'student' };
};

const getCompanyScope = (user) => {
  if (user.role === 'mentor') return { mentorId: user.id };
  if (user.role === 'teacher') return { students: { some: { role: 'student', teacherId: user.id } } };
  return {};
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const { role } = req.user;
    const studentWhere = getScope(req.user);
    const companyWhere = getCompanyScope(req.user);
    const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';
    if (location) companyWhere.address = { contains: location };

    const [students, companies] = await Promise.all([
      prisma.user.findMany({
        where: studentWhere,
        select: {
          id: true,
          name: true,
          company: { select: { id: true, name: true, address: true } },
          absensis: { select: { status: true } },
          logbooks: { select: { status: true } },
        },
      }),
      prisma.company.findMany({
        where: companyWhere,
        select: { id: true, name: true, address: true, isActive: true, quota: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const allowedCompanyIds = new Set(companies.map(company => company.id));
    const scopedStudents = students.filter(student => !student.company || allowedCompanyIds.has(student.company.id));
    const companyCounts = new Map(companies.map(company => [company.id, { name: company.name, count: 0 }]));
    const locationCounts = new Map();

    scopedStudents.forEach(student => {
      if (!student.company || !companyCounts.has(student.company.id)) return;
      companyCounts.get(student.company.id).count += 1;
      const address = student.company.address?.trim() || 'Lokasi tidak diisi';
      locationCounts.set(address, (locationCounts.get(address) || 0) + 1);
    });

    const studentsPerCompany = [...companyCounts.values()]
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

    const companyStatus = companies.reduce((result, company) => {
      if (!company.isActive) result.inactive += 1;
      else if (company.quota > 0 && (companyCounts.get(company.id)?.count || 0) >= company.quota) result.full += 1;
      else result.active += 1;
      return result;
    }, { active: 0, inactive: 0, full: 0 });

    const result = {
      studentsPerCompany,
      companyStatus,
      studentLocations: [...locationCounts.entries()]
        .map(([locationName, count]) => ({ name: locationName, count }))
        .sort((a, b) => b.count - a.count),
    };

    if (role === 'teacher') {
      result.studentStatus = scopedStudents.reduce((status, student) => {
        if (!student.company) status.notPlaced += 1;
        else if (student.absensis.some(item => item.status === 'sakit')) status.sick += 1;
        else if (student.absensis.some(item => item.status === 'izin')) status.permission += 1;
        else status.active += 1;
        return status;
      }, { active: 0, permission: 0, sick: 0, notPlaced: 0 });
    }

    if (role === 'mentor') {
      result.logbookStatus = scopedStudents.reduce((status, student) => {
        student.logbooks.forEach(logbook => {
          if (logbook.status === 'approved') status.approved += 1;
          else if (logbook.status === 'rejected') status.revision += 1;
          else status.pending += 1;
        });
        return status;
      }, { pending: 0, approved: 0, revision: 0 });
      result.attendancePerStudent = scopedStudents
        .map(student => ({ name: student.name, count: student.absensis.filter(item => item.status === 'hadir').length }))
        .sort((a, b) => b.count - a.count);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};
