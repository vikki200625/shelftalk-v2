import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { AuthProvider, useAuth } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import SignIn from '../pages/SignIn'
import SignUp from '../pages/SignUp'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'

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
  it('provides user, loading, signIn, signUp, signOut, forgotPassword, resetPassword', async () => {
    function TestComponent() {
      const { user, loading, signIn, signUp, signOut, forgotPassword, resetPassword } = useAuth()
      return (
        <div>
          <span data-testid="loading">{String(loading)}</span>
          <span data-testid="user">{user ? user.email : 'null'}</span>
          <span data-testid="has-signin">{String(typeof signIn === 'function')}</span>
          <span data-testid="has-signup">{String(typeof signUp === 'function')}</span>
          <span data-testid="has-signout">{String(typeof signOut === 'function')}</span>
          <span data-testid="has-forgot">{String(typeof forgotPassword === 'function')}</span>
          <span data-testid="has-reset">{String(typeof resetPassword === 'function')}</span>
        </div>
      )
    }

    wrapper(
      <Routes>
        <Route path="/" element={<TestComponent />} />
      </Routes>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('has-signin')).toHaveTextContent('true')
    expect(screen.getByTestId('has-signup')).toHaveTextContent('true')
    expect(screen.getByTestId('has-signout')).toHaveTextContent('true')
    expect(screen.getByTestId('has-forgot')).toHaveTextContent('true')
    expect(screen.getByTestId('has-reset')).toHaveTextContent('true')
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

    await waitFor(() => {
      expect(screen.getByText('sign-in-page')).toBeInTheDocument()
    })
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })

  it('carries the blocked path as return-URL state on the redirect', async () => {
    function SignInStub() {
      const location = useLocation()
      return <div>from:{String(location.state?.from)}</div>
    }

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
        <Route path="/signin" element={<SignInStub />} />
      </Routes>,
      { route: '/protected' }
    )

    await waitFor(() => {
      expect(screen.getByText('from:/protected')).toBeInTheDocument()
    })
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

    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })
})

// ---- SignIn page ----

describe('SignIn page', () => {
  it('renders username and password inputs plus submit', async () => {
    wrapper(
      <Routes>
        <Route path="/signin" element={<SignIn />} />
      </Routes>,
      { route: '/signin' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders forgot password link', async () => {
    wrapper(
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<div>forgot-page</div>} />
      </Routes>,
      { route: '/signin' }
    )

    await waitFor(() => {
      expect(screen.getByText(/forgot password/i)).toHaveAttribute('href', '/forgot-password')
    })
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
  it('renders username, email, password, confirm password, and submit', async () => {
    wrapper(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
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
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'different')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
  })

  it('shows error for short password', async () => {
    const user = userEvent.setup()

    wrapper(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^password/i), 'abc')
    await user.type(screen.getByLabelText(/confirm password/i), 'abc')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows error for password without number', async () => {
    const user = userEvent.setup()

    wrapper(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^password/i), 'abcdefgh!')
    await user.type(screen.getByLabelText(/confirm password/i), 'abcdefgh!')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(screen.getByText(/at least 1 number/i)).toBeInTheDocument()
  })

  it('shows error for password without special character', async () => {
    const user = userEvent.setup()

    wrapper(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^password/i), 'abcdefgh1')
    await user.type(screen.getByLabelText(/confirm password/i), 'abcdefgh1')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(screen.getByText(/at least 1 special character/i)).toBeInTheDocument()
  })

  it('shows error for short username', async () => {
    const user = userEvent.setup()

    wrapper(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/username/i), 'ab')
    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^password/i), 'abcdefgh1!')
    await user.type(screen.getByLabelText(/confirm password/i), 'abcdefgh1!')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument()
  })

  it('shows error for invalid username characters', async () => {
    const user = userEvent.setup()

    wrapper(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/username/i), 'test user!')
    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^password/i), 'abcdefgh1!')
    await user.type(screen.getByLabelText(/confirm password/i), 'abcdefgh1!')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(screen.getByText(/letters, numbers, and underscores/i)).toBeInTheDocument()
  })
})

// ---- ForgotPassword page ----

describe('ForgotPassword page', () => {
  it('renders username input and submit button', async () => {
    wrapper(
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>,
      { route: '/forgot-password' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('renders link back to sign in', async () => {
    wrapper(
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signin" element={<div>sign-in-page</div>} />
      </Routes>,
      { route: '/forgot-password' }
    )

    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toHaveAttribute('href', '/signin')
    })
  })
})

// ---- ResetPassword page ----

describe('ResetPassword page', () => {
  it('renders new password, confirm password, and submit', async () => {
    wrapper(
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>,
      { route: '/reset-password' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
  })

  it('shows error when passwords don\'t match', async () => {
    const user = userEvent.setup()

    wrapper(
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>,
      { route: '/reset-password' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/^new password/i), 'newpass1!')
    await user.type(screen.getByLabelText(/confirm new password/i), 'different')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
  })

  it('shows error for weak password', async () => {
    const user = userEvent.setup()

    wrapper(
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>,
      { route: '/reset-password' }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/^new password/i), 'weak')
    await user.type(screen.getByLabelText(/confirm new password/i), 'weak')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('renders back to sign in link', async () => {
    wrapper(
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signin" element={<div>sign-in-page</div>} />
      </Routes>,
      { route: '/reset-password' }
    )

    await waitFor(() => {
      expect(screen.getByText(/back to sign in/i)).toHaveAttribute('href', '/signin')
    })
  })
})

// ---- Password validation unit tests ----

import { validatePassword } from '../lib/validate'

describe('validatePassword', () => {
  it('rejects password shorter than 8 chars', () => {
    expect(validatePassword('abc1!')).toBe('Password must be at least 8 characters')
  })

  it('rejects password without numbers', () => {
    expect(validatePassword('abcdefgh!')).toBe('Password must contain at least 1 number')
  })

  it('rejects password without special characters', () => {
    expect(validatePassword('abcdefgh1')).toBe('Password must contain at least 1 special character')
  })

  it('accepts valid password', () => {
    expect(validatePassword('myP@ss1word')).toBeNull()
  })

  it('accepts password with various special chars', () => {
    expect(validatePassword('test123!')).toBeNull()
    expect(validatePassword('test123@')).toBeNull()
    expect(validatePassword('test123#')).toBeNull()
    expect(validatePassword('test123$')).toBeNull()
  })
})
