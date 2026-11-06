import { api } from './api';

export interface StudentOption {
  id: number;
  name: string;
  className?: string | null;
  companyName?: string | null;
}

export interface LearningStudent {
  id: number;
  name: string;
  nis: string | null;
  concentration: string | null;
  address: string | null;
  className: string | null;
  major: string | null;
  companyName: string | null;
  companyAddress: string | null;
  teacherName: string | null;
  program: string | null;
  practicePlace: string | null;
}

export interface SignedBy {
  id: number;
  name: string;
}

export interface LearningAccess {
  canView: boolean;
  canManageAchievements: boolean;
  canSignMentor: boolean;
  canSignTeacher: boolean;
  canEditGoals: boolean;
}

export interface Achievement {
  id: number;
  orderIndex: number;
  title: string;
  evidence: string | null;
  weeks: number[];
  mentorSignedAt: string | null;
  mentorSignedBy: SignedBy | null;
  teacherSignedAt: string | null;
  teacherSignedBy: SignedBy | null;
}

export interface LearningGoal {
  id: number;
  orderIndex: number;
  title: string;
  score: number | null;
  description: string | null;
}

export interface AchievementsPayload {
  student: LearningStudent;
  achievements: Achievement[];
  access: LearningAccess;
}

export interface GoalsPayload {
  student: LearningStudent;
  goals: LearningGoal[];
  access: LearningAccess;
}

export const WEEKS = Array.from({ length: 16 }, (_, index) => index + 1);

export const display = (value?: string | null) => (value && value.trim() ? value : '-');

export const errorMessage = (error: any, fallback: string) =>
  error?.data?.error || error?.message || fallback;

export const formatSignatureDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const fetchStudentOptions = async (): Promise<StudentOption[]> => {
  const response = await api.get<any>('/api/users?role=student');
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
    ? response.data
    : [];

  return items.map((item: any) => ({
    id: item.id,
    name: item.name,
    className: item.class?.name ?? null,
    companyName: item.company?.name ?? null,
  }));
};

export const achievementRoleHint = (role: string) => {
  if (role === 'mentor') {
    return 'Anda dapat menambah/mengubah capaian, memilih minggu 1–16, dan membubuhkan paraf Mentor.';
  }
  if (role === 'teacher') {
    return 'Anda hanya dapat membubuhkan paraf Sekolah/Guru. Capaian, bukti, dan minggu bersifat lihat saja.';
  }
  return 'Anda dapat melihat capaian pembelajaran, minggu, dan paraf pembimbing.';
};

export const goalRoleHint = (role: string) => {
  if (role === 'mentor') {
    return 'Anda dapat mengisi nilai 10–100 dan deskripsi tujuan pembelajaran.';
  }
  return 'Anda dapat melihat biodata siswa, nilai, dan deskripsi tujuan pembelajaran.';
};
