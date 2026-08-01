import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ---- Sign up with username ----
  const signUp = (username, email, password) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

  // ---- Sign in with username (lookup email from profiles, then sign in) ----
  const signIn = async (username, password) => {
    const { data: profile, error: lookupError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single()

    if (lookupError || !profile) {
      return { error: { message: 'No account found with that username' } }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login')) {
        return { error: { message: 'Wrong password' } }
      }
      return { error }
    }

    return { data: true }
  }

  // ---- Forgot password (by username) ----
  const forgotPassword = async (username) => {
    const { data: profile, error: lookupError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single()

    if (lookupError || !profile) {
      return { error: { message: 'No account found with that username' } }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) return { error }
    return { data: true }
  }

  // ---- Reset password (after clicking email link) ----
  const resetPassword = (newPassword) =>
    supabase.auth.updateUser({ password: newPassword })

  // ---- Sign out ----
  const signOut = () => supabase.auth.signOut()

  const value = { user, loading, signUp, signIn, signOut, forgotPassword, resetPassword }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
