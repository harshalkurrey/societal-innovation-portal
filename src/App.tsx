import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { CitizenDashboard } from '@/pages/citizen/CitizenDashboard';
import { SubmitProblem } from '@/pages/citizen/SubmitProblem';
import { MyProblems } from '@/pages/citizen/MyProblems';
import { ProblemDetail } from '@/pages/citizen/ProblemDetail';
import { UniversityDashboard } from '@/pages/university/UniversityDashboard';
import { BrowseProblems } from '@/pages/university/BrowseProblems';
import { MyProjects } from '@/pages/university/MyProjects';
import { UniversityProblemDetail } from '@/pages/university/UniversityProblemDetail';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminProblems } from '@/pages/admin/AdminProblems';
import type { Role } from '@/lib/types';

function RoleRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  if (!profile) return <Navigate to="/login" replace />;
  return <Navigate to={`/${profile.role}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<RoleRedirect />} />

      {/* Citizen */}
      <Route path="/citizen" element={<ProtectedRoute allowedRoles={['citizen'] as Role[]}><Layout><CitizenDashboard /></Layout></ProtectedRoute>} />
      <Route path="/citizen/submit" element={<ProtectedRoute allowedRoles={['citizen'] as Role[]}><Layout><SubmitProblem /></Layout></ProtectedRoute>} />
      <Route path="/citizen/problems" element={<ProtectedRoute allowedRoles={['citizen'] as Role[]}><Layout><MyProblems /></Layout></ProtectedRoute>} />
      <Route path="/citizen/problems/:id" element={<ProtectedRoute allowedRoles={['citizen'] as Role[]}><Layout><ProblemDetail /></Layout></ProtectedRoute>} />

      {/* University */}
      <Route path="/university" element={<ProtectedRoute allowedRoles={['university'] as Role[]}><Layout><UniversityDashboard /></Layout></ProtectedRoute>} />
      <Route path="/university/browse" element={<ProtectedRoute allowedRoles={['university'] as Role[]}><Layout><BrowseProblems /></Layout></ProtectedRoute>} />
      <Route path="/university/projects" element={<ProtectedRoute allowedRoles={['university'] as Role[]}><Layout><MyProjects /></Layout></ProtectedRoute>} />
      <Route path="/university/problems/:id" element={<ProtectedRoute allowedRoles={['university'] as Role[]}><Layout><UniversityProblemDetail /></Layout></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin'] as Role[]}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/problems" element={<ProtectedRoute allowedRoles={['admin'] as Role[]}><Layout><AdminProblems /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
