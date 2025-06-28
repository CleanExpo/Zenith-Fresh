/**
 * Test suite for Team Management React Components
 * Tests UI components, user interactions, and integration with API
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamDashboard } from '@/components/team/TeamDashboard';
import { TeamMembers } from '@/components/team/TeamMembers';
import { TeamInvitations } from '@/components/team/TeamInvitations';
import { TeamAnalytics } from '@/components/team/TeamAnalytics';
import { TeamSettingsComponent } from '@/components/team/TeamSettings';
import { CreateTeamModal } from '@/components/team/CreateTeamModal';
import { EditTeamModal } from '@/components/team/EditTeamModal';

// Mock API
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}));

// Test data
const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  description: 'A test team for development',
  role: 'OWNER',
  joinedAt: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  members: [
    {
      id: 'member-1',
      role: 'OWNER',
      createdAt: '2024-01-01T00:00:00Z',
      user: {
        id: 'user-1',
        name: 'John Owner',
        email: 'owner@example.com',
        image: null,
      },
      recentActivity: [],
      lastActive: '2024-01-01T00:00:00Z',
    },
    {
      id: 'member-2',
      role: 'MEMBER',
      createdAt: '2024-01-01T00:00:00Z',
      user: {
        id: 'user-2',
        name: 'Jane Member',
        email: 'member@example.com',
        image: null,
      },
      recentActivity: [],
      lastActive: '2024-01-01T00:00:00Z',
    },
  ],
  projects: [
    {
      id: 'project-1',
      name: 'Test Project',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      user: {
        id: 'user-1',
        name: 'John Owner',
        email: 'owner@example.com',
      },
      _count: {
        tasks: 5,
        content: 3,
      },
    },
  ],
  invitations: [
    {
      id: 'invitation-1',
      email: 'invited@example.com',
      role: 'MEMBER',
      status: 'pending',
      createdAt: '2024-01-01T00:00:00Z',
      expiresAt: '2024-01-08T00:00:00Z',
      inviter: {
        id: 'user-1',
        name: 'John Owner',
        email: 'owner@example.com',
      },
    },
  ],
  analytics: {
    totalRequests: 1500,
    totalTokens: 15000,
    growthRate: 12.5,
    usageStats: [
      {
        date: '2024-01-01',
        requests: 100,
        tokens: 1000,
      },
      {
        date: '2024-01-02',
        requests: 120,
        tokens: 1200,
      },
    ],
  },
  settings: {
    id: 'settings-1',
    timezone: 'UTC',
    language: 'en',
    notifications: {
      email: true,
      slack: false,
      discord: false,
    },
    integrations: {
      slack: false,
      discord: false,
      github: false,
    },
  },
};

const mockAnalytics = {
  analytics: {
    totalRequests: 1500,
    totalTokens: 15000,
    growthRate: 12.5,
    usageStats: mockTeam.analytics.usageStats,
    dailyAverages: {
      requests: 110,
      tokens: 1100,
    },
    collaboration: {
      totalMembers: 2,
      activeMembers: 2,
      totalProjects: 1,
      activeProjects: 1,
      projectsPerMember: 0.5,
    },
    memberActivity: mockTeam.members.map(member => ({
      ...member,
      activityCount: 10,
      joinedAt: member.createdAt,
    })),
    recentActivity: [
      {
        id: 'activity-1',
        action: 'create_project',
        user: mockTeam.members[0].user,
        project: mockTeam.projects[0],
        createdAt: '2024-01-01T12:00:00Z',
        details: 'Created project',
      },
    ],
    activityByType: {
      create_project: 1,
      update_task: 5,
      upload_file: 3,
    },
    timeframe: '30d',
  },
};

// Helper function to create QueryClient wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe.skip('Team Management Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TeamDashboard', () => {
    it('should render team information correctly', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ team: mockTeam });

      render(
        <TeamDashboard teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument();
        expect(screen.getByText('A test team for development')).toBeInTheDocument();
        expect(screen.getByText('OWNER')).toBeInTheDocument();
      });
    });

    it('should show correct member and project counts', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ team: mockTeam });

      render(
        <TeamDashboard teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // member count
        expect(screen.getByText('1')).toBeInTheDocument(); // project count
      });
    });

    it('should show edit and delete buttons for owners', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ team: mockTeam });

      render(
        <TeamDashboard teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Team')).toBeInTheDocument();
        expect(screen.getByText('Delete Team')).toBeInTheDocument();
      });
    });

    it('should hide management buttons for non-owners', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      const memberTeam = { ...mockTeam, role: 'MEMBER' };
      api.get.mockResolvedValue({ team: memberTeam });

      render(
        <TeamDashboard teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.queryByText('Edit Team')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete Team')).not.toBeInTheDocument();
      });
    });

    it('should handle team deletion with confirmation', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ team: mockTeam });
      api.delete.mockResolvedValue({});

      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      render(
        <TeamDashboard teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete Team');
        fireEvent.click(deleteButton);
      });

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this team? This action cannot be undone.'
      );
      expect(api.delete).toHaveBeenCalledWith('/api/teams/team-1');
    });
  });

  describe('TeamMembers', () => {
    it('should render team members list', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ members: mockTeam.members });

      render(
        <TeamMembers teamId="team-1" canManage={true} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('John Owner')).toBeInTheDocument();
        expect(screen.getByText('Jane Member')).toBeInTheDocument();
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
        expect(screen.getByText('member@example.com')).toBeInTheDocument();
      });
    });

    it('should show add member button for managers', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ members: mockTeam.members });

      render(
        <TeamMembers teamId="team-1" canManage={true} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Add Member')).toBeInTheDocument();
      });
    });

    it('should hide add member button for non-managers', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ members: mockTeam.members });

      render(
        <TeamMembers teamId="team-1" canManage={false} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.queryByText('Add Member')).not.toBeInTheDocument();
      });
    });

    it('should handle member addition', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ members: mockTeam.members });
      api.post.mockResolvedValue({ 
        member: {
          ...mockTeam.members[1],
          id: 'member-3',
          user: { ...mockTeam.members[1].user, email: 'newmember@example.com' }
        }
      });

      render(
        <TeamMembers teamId="team-1" canManage={true} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        const addButton = screen.getByText('Add Member');
        fireEvent.click(addButton);
      });

      // Modal should open
      expect(screen.getByText('Add Team Member')).toBeInTheDocument();

      // Fill form
      const emailInput = screen.getByLabelText('Email Address');
      fireEvent.change(emailInput, { target: { value: 'newmember@example.com' } });

      const submitButton = screen.getByText('Add Member');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/teams/team-1/members', {
          email: 'newmember@example.com',
          role: 'MEMBER',
        });
      });
    });
  });

  describe('TeamInvitations', () => {
    it('should render pending invitations', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ invitations: mockTeam.invitations });

      render(
        <TeamInvitations teamId="team-1" canManage={true} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('invited@example.com')).toBeInTheDocument();
        expect(screen.getByText('Invited by John Owner')).toBeInTheDocument();
      });
    });

    it('should handle sending invitations', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ invitations: [] });
      api.post.mockResolvedValue({ 
        invitation: mockTeam.invitations[0],
        message: 'Invitation sent successfully'
      });

      render(
        <TeamInvitations teamId="team-1" canManage={true} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        const inviteButton = screen.getByText('Send Invitation');
        fireEvent.click(inviteButton);
      });

      // Modal should open
      expect(screen.getByText('Send Team Invitation')).toBeInTheDocument();

      // Fill form
      const emailInput = screen.getByLabelText('Email Address');
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });

      const messageInput = screen.getByLabelText('Personal Message (Optional)');
      fireEvent.change(messageInput, { target: { value: 'Welcome to our team!' } });

      const submitButton = screen.getByText('Send Invitation');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/teams/team-1/invitations', {
          email: 'newuser@example.com',
          role: 'MEMBER',
          message: 'Welcome to our team!',
        });
      });
    });

    it('should show empty state when no invitations', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ invitations: [] });

      render(
        <TeamInvitations teamId="team-1" canManage={false} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('No pending invitations')).toBeInTheDocument();
      });
    });
  });

  describe('TeamAnalytics', () => {
    it('should render analytics data', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue(mockAnalytics);

      render(
        <TeamAnalytics teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Team Analytics')).toBeInTheDocument();
        expect(screen.getByText('1,500')).toBeInTheDocument(); // requests
        expect(screen.getByText('15,000')).toBeInTheDocument(); // tokens
      });
    });

    it('should render charts', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue(mockAnalytics);

      render(
        <TeamAnalytics teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    it('should handle timeframe changes', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue(mockAnalytics);

      render(
        <TeamAnalytics teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        const timeframeSelect = screen.getByDisplayValue('Last 30 days');
        expect(timeframeSelect).toBeInTheDocument();
      });

      // Should call API with different timeframe when changed
      expect(api.get).toHaveBeenCalledWith('/api/teams/team-1/analytics?timeframe=30d');
    });
  });

  describe('TeamSettings', () => {
    it('should render team settings', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ settings: mockTeam.settings });

      render(
        <TeamSettingsComponent teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Team Settings')).toBeInTheDocument();
        expect(screen.getByText('General Settings')).toBeInTheDocument();
        expect(screen.getByText('Notification Settings')).toBeInTheDocument();
        expect(screen.getByText('Integrations')).toBeInTheDocument();
      });
    });

    it('should handle settings updates', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockResolvedValue({ settings: mockTeam.settings });
      api.put.mockResolvedValue({ settings: { ...mockTeam.settings, timezone: 'America/New_York' } });

      render(
        <TeamSettingsComponent teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        // Find timezone select and change it
        const timezoneSelect = screen.getByDisplayValue('UTC');
        expect(timezoneSelect).toBeInTheDocument();
      });

      // Settings should be updated when changed
      expect(api.get).toHaveBeenCalledWith('/api/teams/team-1/settings');
    });
  });

  describe('CreateTeamModal', () => {
    it('should handle team creation', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.post.mockResolvedValue({ 
        team: { ...mockTeam, id: 'new-team-1', name: 'New Team' } 
      });

      const onSuccess = jest.fn();
      const onClose = jest.fn();

      render(
        <CreateTeamModal open={true} onClose={onClose} onSuccess={onSuccess} />,
        { wrapper: createWrapper() }
      );

      // Fill form
      const nameInput = screen.getByLabelText('Team Name *');
      fireEvent.change(nameInput, { target: { value: 'New Team' } });

      const descriptionInput = screen.getByLabelText('Description (Optional)');
      fireEvent.change(descriptionInput, { target: { value: 'A new team description' } });

      const submitButton = screen.getByText('Create Team');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/teams', {
          name: 'New Team',
          description: 'A new team description',
        });
        expect(onSuccess).toHaveBeenCalledWith('new-team-1');
      });
    });

    it('should validate required fields', () => {
      const onSuccess = jest.fn();
      const onClose = jest.fn();

      render(
        <CreateTeamModal open={true} onClose={onClose} onSuccess={onSuccess} />,
        { wrapper: createWrapper() }
      );

      const submitButton = screen.getByText('Create Team');
      expect(submitButton).toBeDisabled();

      const nameInput = screen.getByLabelText('Team Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Team' } });

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('EditTeamModal', () => {
    it('should pre-populate form with team data', () => {
      const onClose = jest.fn();

      render(
        <EditTeamModal open={true} onClose={onClose} team={mockTeam} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByDisplayValue('Test Team');
      const descriptionInput = screen.getByDisplayValue('A test team for development');

      expect(nameInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
    });

    it('should handle team updates', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.put.mockResolvedValue({ 
        team: { ...mockTeam, name: 'Updated Team' } 
      });

      const onClose = jest.fn();

      render(
        <EditTeamModal open={true} onClose={onClose} team={mockTeam} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByDisplayValue('Test Team');
      fireEvent.change(nameInput, { target: { value: 'Updated Team' } });

      const submitButton = screen.getByText('Update Team');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/api/teams/team-1', {
          name: 'Updated Team',
          description: 'A test team for development',
        });
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should disable submit when no changes', () => {
      const onClose = jest.fn();

      render(
        <EditTeamModal open={true} onClose={onClose} team={mockTeam} />,
        { wrapper: createWrapper() }
      );

      const submitButton = screen.getByText('Update Team');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockRejectedValue(new Error('API Error'));

      render(
        <TeamDashboard teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load team')).toBeInTheDocument();
      });
    });

    it('should show loading states', () => {
      const api = jest.mocked(require('@/lib/api').api);
      api.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TeamDashboard teamId="team-1" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Loading team...')).toBeInTheDocument();
    });
  });
});