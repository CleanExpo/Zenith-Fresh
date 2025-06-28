import { Metadata } from 'next';
import EnterpriseIntegrationDashboard from '@/components/enterprise/EnterpriseIntegrationDashboard';

export const metadata: Metadata = {
  title: 'Enterprise Integrations | Zenith Platform',
  description: 'Manage SSO, APIs, webhooks, integrations, and enterprise connectivity from a single dashboard.',
};

export default function IntegrationsPage() {
  return <EnterpriseIntegrationDashboard />;
}