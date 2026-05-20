import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import MainLayout from '../layouts/MainLayout';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Projects = lazy(() => import('../pages/Projects'));
const ProjectDetail = lazy(() => import('../pages/ProjectDetail'));
const Documents = lazy(() => import('../pages/Documents'));
const Workflow = lazy(() => import('../pages/Workflow'));

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
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: withSuspense(Dashboard) },
      { path: 'projects', element: withSuspense(Projects) },
      { path: 'projects/:id', element: withSuspense(ProjectDetail) },
      { path: 'fluxo', element: withSuspense(Workflow) },
      { path: 'documents', element: withSuspense(Documents) },
    ],
  },
]);
