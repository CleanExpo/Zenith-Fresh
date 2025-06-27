import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import ConversionFunnelDashboard from '../../components/funnel/ConversionFunnelDashboard';

export const metadata: Metadata = {
  title: 'Conversion Funnels | Zenith Analytics',
  description: 'Track and optimize your user conversion journeys with advanced funnel analytics',
};

export default async function ConversionFunnelsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin?callbackUrl=/conversion-funnels');
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        <ConversionFunnelDashboard />
      </div>
    </div>
  );
}