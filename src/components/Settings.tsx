import React from 'react';
import { UserRole } from '../types';
import { SettingsIntern } from './SettingsIntern';
import { SettingsMentor } from './SettingsMentor';
import { SettingsTeacher } from './SettingsTeacher';
import { SettingsHubin } from './SettingsHubin';

interface SettingsProps {
  userRole?: UserRole;
}

export const Settings: React.FC<SettingsProps> = ({ userRole = 'intern' }) => {
  switch (userRole) {
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
