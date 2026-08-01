import { Route, Routes } from 'react-router'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Landing from './components/Landing'
import BookDetail from './components/BookDetail'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="page-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/book/:key" element={<BookDetail />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
