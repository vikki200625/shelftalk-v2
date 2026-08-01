import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider, useAuth } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import SignIn from '../pages/SignIn'
import SignUp from '../pages/SignUp'

// Helper: render inside AuthProvider + Router
function wrapper(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  )
}

// ---- AuthContext ----

describe('AuthProvider', () => {
  it('provides user, loading, signIn, signUp, signOut to children', async () => {
    function TestComponent() {
      const { user, loading, signIn, signUp, signOut } = useAuth()
      return (
        <div>
          <span data-testid="loading">{String(loading)}</span>
          <span data-testid="user">{user ? user.email : 'null'}</span>
          <span data-testid="has-signin">{String(typeof signIn === 'function')}</span>
          <span data-testid="has-signup">{String(typeof signUp === 'function')}</span>
          <span data-testid="has-signout">{String(typeof signOut === 'function')}</span>
        </div>
      )
    }

    wrapper(
      <Routes>
        <Route path="/" element={<TestComponent />} />
      </Routes>
    )

    // Wait for auth loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('has-signin')).toHaveTextContent('true')
    expect(screen.getByTestId('has-signup')).toHaveTextContent('true')
    expect(screen.getByTestId('has-signout')).toHaveTextContent('true')
  })

  it('throws useAuth outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function BadComponent() {
      useAuth()
      return null
    }

    expect(() =>
      render(
        <MemoryRouter>
          <BadComponent />
        </MemoryRouter>
      )
    ).toThrow('useAuth must be used within an AuthProvider')

    spy.mockRestore()
  })
})

// ---- ProtectedRoute ----

describe('ProtectedRoute', () => {
  it('redirects to /signin when no user', async () => {
    wrapper(
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>secret</div>
            </ProtectedRoute>
          }
        />
        <Route path="/signin" element={<div>sign-in-page</div>} />
      </Routes>,
      { route: '/protected' }
    )

    // Wait for auth loading to finish, then expect redirect
    await waitFor(() => {
      expect(screen.getByText('sign-in-page')).toBeInTheDocument()
    })
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })

  it('shows loading state before auth resolves', () => {
    wrapper(
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>secret</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/protected' }
    )

    // Loading is true initially — should show loading text, not children
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })
})

// ---- SignIn page ----

describe('SignIn page', () => {
  it('renders email and password inputs plus submit button', async () => {
    wrapper(
      <Routes>
        <Route path="/signin" element={<SignIn />} />
      </Routes>,
      { route: '/signin' }
    )

    // Wait for auth loading to finish
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders link to sign-up page', async () => {
    wrapper(
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<div>sign-up-page</div>} />
      </Routes>,
      { route: '/signin' }
    )

    await waitFor(() => {
      expect(screen.getByText(/sign up/i)).toHaveAttribute('href', '/signup')
    })
  })
})

// ---- SignUp page ----

describe('SignUp page', () => {
  it('renders email, password, confirm password, and submit', async () => {
    wrapper(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('renders link to sign-in page', async () => {
    wrapper(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<div>sign-in-page</div>} />
      </Routes>,
      { route: '/signup' }
    )

    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toHaveAttribute('href', '/signin')
    })
  })

  it('shows error when passwords don\'t match', async () => {
    const user = userEvent.setup()

    wrapper(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
  })
})
