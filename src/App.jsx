import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Trending from './components/Trending'
import GenreSection from './components/GenreSection'
import Features from './components/Features'
import Testimonials from './components/Testimonials'
import CtaBand from './components/CtaBand'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page-main">
        <Hero />
        <Trending />
        <GenreSection />
        <Features />
        <Testimonials />
        <CtaBand />
      </main>
      <Footer />
    </>
  )
}
