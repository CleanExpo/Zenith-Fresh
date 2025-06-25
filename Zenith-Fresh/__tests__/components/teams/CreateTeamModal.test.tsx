/**
 * Unit tests for CreateTeamModal component
 * Tests form validation, API integration, and user interactions
 */

import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateTeamModal } from '@/components/teams/CreateTeamModal'

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

const mockTeam = {
  id: 'team-123',
  name: 'Test Team',
  description: 'A test team',
  slug: 'test-team',
  avatar: null,
  userRole: 'ADMIN' as const,
  joinedAt: '2023-01-01T00:00:00.000Z',
  _count: {
    members: 1,
    projects: 0,
  },
}

describe('CreateTeamModal Component', () => {
  const mockOnClose = jest.fn()
  const mockOnTeamCreated = jest.fn()

  beforeEach(() => {
    mockFetch.mockClear()
    mockOnClose.mockClear()
    mockOnTeamCreated.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the modal with form fields', () => {
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    expect(screen.getByText('Create New Team')).toBeInTheDocument()
    expect(screen.getByLabelText('Team Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Team Slug')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Team' })).toBeInTheDocument()
  })

  it('should auto-generate slug when team name changes', async () => {
    const user = userEvent.setup()
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const slugInput = screen.getByLabelText('Team Slug')

    await user.type(nameInput, 'My Awesome Team!')

    expect(slugInput).toHaveValue('my-awesome-team')
  })

  it('should handle special characters in team name for slug generation', async () => {
    const user = userEvent.setup()
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const slugInput = screen.getByLabelText('Team Slug')

    await user.type(nameInput, 'Test@Team#123 & More!!!')

    expect(slugInput).toHaveValue('testteam123-more')
  })

  it('should allow manual editing of slug', async () => {
    const user = userEvent.setup()
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const slugInput = screen.getByLabelText('Team Slug')

    await user.type(nameInput, 'Test Team')
    expect(slugInput).toHaveValue('test-team')

    await user.clear(slugInput)
    await user.type(slugInput, 'custom-slug')

    expect(slugInput).toHaveValue('custom-slug')
  })

  it('should disable submit button when required fields are empty', () => {
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Create Team' })
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when name and slug are provided', async () => {
    const user = userEvent.setup()
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const submitButton = screen.getByRole('button', { name: 'Create Team' })

    await user.type(nameInput, 'Test Team')

    expect(submitButton).not.toBeDisabled()
  })

  it('should show loading state during team creation', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    mockFetch.mockImplementation(() =>
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ team: mockTeam }),
        } as Response), 100)
      )
    )

    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const submitButton = screen.getByRole('button', { name: 'Create Team' })

    await user.type(nameInput, 'Test Team')
    await user.click(submitButton)

    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.queryByText('Creating...')).not.toBeInTheDocument()
    })
  })

  it('should call API with correct parameters', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ team: mockTeam }),
    } as Response)

    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const descriptionInput = screen.getByLabelText('Description')
    const submitButton = screen.getByRole('button', { name: 'Create Team' })

    await user.type(nameInput, 'Test Team')
    await user.type(descriptionInput, 'Test description')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Team',
          description: 'Test description',
          slug: 'test-team',
        }),
      })
    })
  })

  it('should call onTeamCreated and onClose on successful creation', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ team: mockTeam }),
    } as Response)

    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const submitButton = screen.getByRole('button', { name: 'Create Team' })

    await user.type(nameInput, 'Test Team')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnTeamCreated).toHaveBeenCalledWith(mockTeam)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Team name already exists' }),
    } as Response)

    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const submitButton = screen.getByRole('button', { name: 'Create Team' })

    await user.type(nameInput, 'Existing Team')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Team name already exists')).toBeInTheDocument()
    })

    expect(mockOnTeamCreated).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should handle network errors', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const submitButton = screen.getByRole('button', { name: 'Create Team' })

    await user.type(nameInput, 'Test Team')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to create team')).toBeInTheDocument()
    })

    expect(mockOnTeamCreated).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal on backdrop click', async () => {
    const user = userEvent.setup()
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    // Assuming the modal has a backdrop with data-testid
    const backdrop = screen.getByTestId('modal-backdrop')
    await user.click(backdrop)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should handle escape key to close modal', async () => {
    const user = userEvent.setup()
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    await user.keyboard('{Escape}')

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should validate team name length', async () => {
    const user = userEvent.setup()
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const submitButton = screen.getByRole('button', { name: 'Create Team' })

    // Test very short name
    await user.type(nameInput, 'A')
    expect(submitButton).toBeDisabled()

    // Test acceptable name
    await user.clear(nameInput)
    await user.type(nameInput, 'Good Team Name')
    expect(submitButton).not.toBeDisabled()
  })

  it('should validate slug format', async () => {
    const user = userEvent.setup()
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const slugInput = screen.getByLabelText('Team Slug')
    const submitButton = screen.getByRole('button', { name: 'Create Team' })

    await user.type(nameInput, 'Test Team')
    
    // Test invalid slug
    await user.clear(slugInput)
    await user.type(slugInput, 'invalid slug!')
    expect(submitButton).toBeDisabled()

    // Test valid slug
    await user.clear(slugInput)
    await user.type(slugInput, 'valid-slug')
    expect(submitButton).not.toBeDisabled()
  })

  it('should trim whitespace from inputs', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ team: mockTeam }),
    } as Response)

    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const descriptionInput = screen.getByLabelText('Description')
    const submitButton = screen.getByRole('button', { name: 'Create Team' })

    await user.type(nameInput, '  Test Team  ')
    await user.type(descriptionInput, '  Test description  ')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Team',
          description: 'Test description',
          slug: 'test-team',
        }),
      })
    })
  })

  it('should maintain form state during errors', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    } as Response)

    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    const descriptionInput = screen.getByLabelText('Description')
    const submitButton = screen.getByRole('button', { name: 'Create Team' })

    await user.type(nameInput, 'Test Team')
    await user.type(descriptionInput, 'Test description')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })

    // Form values should be preserved
    expect(nameInput).toHaveValue('Test Team')
    expect(descriptionInput).toHaveValue('Test description')
  })

  it('should focus on name input when modal opens', () => {
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const nameInput = screen.getByLabelText('Team Name')
    expect(nameInput).toHaveFocus()
  })

  it('should have proper ARIA attributes', () => {
    render(
      <CreateTeamModal
        onClose={mockOnClose}
        onTeamCreated={mockOnTeamCreated}
      />
    )

    const modal = screen.getByRole('dialog')
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title')
    expect(modal).toHaveAttribute('aria-describedby', 'modal-description')
  })
})