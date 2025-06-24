import { Metadata } from 'next';
import StatusPage from '@/components/status/StatusPage';

export const metadata: Metadata = {
  title: 'Zenith Platform Status',
  description: 'Real-time status and performance metrics for Zenith Platform services.',
};

export default function Status() {
  return <StatusPage />;
}