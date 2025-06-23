import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function App() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return router.pathname === '/login' ? <Login /> : <Register />;
  }

  return (
    <Layout>
      {router.pathname === '/' && <Dashboard />}
      {router.pathname === '/projects' && <Projects />}
      {router.pathname === '/settings' && <Settings />}
    </Layout>
  );
} 