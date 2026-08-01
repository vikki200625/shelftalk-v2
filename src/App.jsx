import { Route, Routes } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Landing from './components/Landing'
import BookDetail from './components/BookDetail'
import ScrollToTop from './components/ScrollToTop'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'

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
        </Routes>
      </main>
      <Footer />
    </AuthProvider>
  )
}
