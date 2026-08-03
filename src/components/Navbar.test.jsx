import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before any imports that use it
vi.mock('../lib/supabase', () => {
  const chain = () => chain
  chain.select = () => chain
  chain.eq = () => chain
  chain.neq = () => chain
  chain.maybeSingle = () => Promise.resolve({ data: null, error: null })
  chain.single = () => Promise.resolve({ data: null, error: null })
  chain.insert = () => chain
  chain.update = () => chain
  chain.delete = () => chain
  chain.order = () => chain
  chain.limit = () => chain
  chain.is = () => chain
  chain.gte = () => chain
  chain.lte = () => chain
  chain.ilike = () => chain
  chain.upsert = () => chain
  chain.head = () => chain
  chain.subscribe = () => ({ unsubscribe: vi.fn() })
  chain.on = () => chain
  chain.channel = () => chain

  return {
    default: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signOut: vi.fn(),
      },
      from: () => chain,
      channel: () => chain,
    },
  }
})

import { AuthProvider } from '../context/AuthContext'
import Navbar from './Navbar'

function renderNav() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  it('renders the brand name', async () => {
    renderNav()
    await waitFor(() => {
      expect(screen.getByText('ShellTalk')).toBeInTheDocument()
    })
  })

  it('renders navigation links', async () => {
    renderNav()
    await waitFor(() => {
      expect(screen.getByText('ShellTalk')).toBeInTheDocument()
    })
    expect(screen.getByText('Browse')).toBeInTheDocument()
    expect(screen.getByText('Library')).toBeInTheDocument()
    expect(screen.getByText('Find Friends')).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Messages')).toBeInTheDocument()
  })

  it('renders Sign in and Get Started when not logged in', async () => {
    renderNav()
    await waitFor(() => {
      expect(screen.getByText('ShellTalk')).toBeInTheDocument()
    })
    expect(screen.getByText('Sign in')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('toggles mobile menu on burger click', async () => {
    renderNav()
    await waitFor(() => {
      expect(screen.getByText('ShellTalk')).toBeInTheDocument()
    })

    const burger = screen.getByLabelText('Toggle menu')
    fireEvent.click(burger)

    // Mobile menu should appear with links — both desktop and mobile links exist
    const browseLinks = screen.getAllByText('Browse')
    expect(browseLinks.length).toBeGreaterThan(1)
  })

  it('burger toggles aria-expanded', async () => {
    renderNav()
    await waitFor(() => {
      expect(screen.getByText('ShellTalk')).toBeInTheDocument()
    })

    const burger = screen.getByLabelText('Toggle menu')
    expect(burger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(burger)
    expect(burger).toHaveAttribute('aria-expanded', 'true')
  })
})
