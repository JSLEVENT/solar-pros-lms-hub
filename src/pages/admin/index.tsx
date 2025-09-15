import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { AdminOverview } from './modules/Overview';
import { AdminUsers } from './modules/Users';
import { AdminUserAnalytics } from './modules/UserAnalytics';
import { AdminTeamsAdvanced } from './modules/TeamsAdvanced';
import { AdminCourses } from './modules/Courses';
import { AdminRepository } from './modules/Repository';
import { AdminPlans } from './modules/Plans';
import { AdminAnalytics } from './modules/Analytics';
import { AdminOrg } from './modules/Organization';

export default function AdminIndex() {
  return (
    <AdminShell>
      <Routes>
        <Route path="overview" element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
  <Route path="users/:userId" element={<AdminUserAnalytics />} />
  <Route path="teams" element={<AdminTeamsAdvanced />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="repository" element={<AdminRepository />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="org" element={<AdminOrg />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </AdminShell>
  );
}
