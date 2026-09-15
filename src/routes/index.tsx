import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import MainLayout from '../layouts/MainLayout';
import RequireAuth from '../auth/RequireAuth';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Projects = lazy(() => import('../pages/Projects'));
const ProjectDetail = lazy(() => import('../pages/ProjectDetail'));
const Documents = lazy(() => import('../pages/Documents'));
const Workflow = lazy(() => import('../pages/Workflow'));
const Fiscal = lazy(() => import('../pages/Fiscal'));
const Conformidade = lazy(() => import('../pages/Conformidade'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));

function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spin size="large" />
    </div>
  );
}

function withSuspense(Component: React.LazyExoticComponent<React.ComponentType>) {
  return (
    <Suspense fallback={<Loader />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(Login),
  },
  {
    path: '/register',
    element: withSuspense(Register),
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: withSuspense(Dashboard) },
          { path: 'projects', element: withSuspense(Projects) },
          { path: 'projects/:id', element: withSuspense(ProjectDetail) },
          { path: 'fluxo', element: withSuspense(Workflow) },
          { path: 'documents', element: withSuspense(Documents) },
          { path: 'fiscal', element: withSuspense(Fiscal) },
          { path: 'conformidade', element: withSuspense(Conformidade) },
        ],
      },
    ],
  },
]);
