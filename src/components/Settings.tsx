import React from 'react';
import { UserRole } from '../types';
import { SettingsIntern } from './SettingsIntern';
import { SettingsMentor } from './SettingsMentor';
import { SettingsTeacher } from './SettingsTeacher';
import { SettingsHubin } from './SettingsHubin';
import { SettingsSuperAdmin } from './SettingsSuperAdmin';

interface SettingsProps {
  userRole?: UserRole;
}

export const Settings: React.FC<SettingsProps> = ({ userRole = 'intern' }) => {
  switch (userRole) {
    case 'super_admin':
      return <SettingsSuperAdmin />;
    case 'mentor':
      return <SettingsMentor />;
    case 'teacher':
      return <SettingsTeacher />;
    case 'hubin':
      return <SettingsHubin />;
    case 'intern':
    default:
      return <SettingsIntern />;
  }
};
