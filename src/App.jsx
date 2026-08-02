import { Route, Routes } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Landing from './components/Landing'
import BookDetail from './components/BookDetail'
import ScrollToTop from './components/ScrollToTop'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import FindFriends from './pages/FindFriends'

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Navbar />
      <main className="page-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/book/:key" element={<BookDetail />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/find-friends" element={<FindFriends />} />
        </Routes>
      </main>
      <Footer />
    </AuthProvider>
  )
}
