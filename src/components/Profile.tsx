import React from 'react';
import { UserRole } from '../types';
import { ProfileSuperAdmin } from './ProfileSuperAdmin';
import { ProfileMentor } from './ProfileMentor';
import { ProfileTeacher } from './ProfileTeacher';
import { ProfileHubin } from './ProfileHubin';
import { ProfileIntern } from './ProfileIntern';

interface ProfileProps {
  userRole?: UserRole;
}

export const Profile: React.FC<ProfileProps> = ({ userRole = 'intern' }) => {
  switch (userRole) {
    case 'super_admin':
      return <ProfileSuperAdmin />;
    case 'mentor':
      return <ProfileMentor />;
    case 'teacher':
      return <ProfileTeacher />;
    case 'hubin':
      return <ProfileHubin />;
    case 'intern':
    default:
      return <ProfileIntern />;
  }
};
