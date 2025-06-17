import { render, screen, waitFor } from '@testing-library/react';
import { TeamAnalytics } from '../TeamAnalytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockData = {
  totalRequests: 1000,
  totalTokens: 5000,
  growthRate: 10,
  usageStats: [
    {
      date: '2024-01-01',
      requests: 100,
      tokens: 500,
    },
    {
      date: '2024-01-02',
      requests: 150,
      tokens: 750,
    },
  ],
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('TeamAnalytics', () => {
  it('renders loading state', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TeamAnalytics teamId="123" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TeamAnalytics teamId="123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error loading analytics')).toBeInTheDocument();
    });
  });

  it('renders data correctly', async () => {
    // Mock the API response
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <TeamAnalytics teamId="123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
      expect(screen.getByText('+10% from last month')).toBeInTheDocument();
    });
  });
}); 