import Hero from './Hero'
import Trending from './Trending'
import GenreSection from './GenreSection'
import Features from './Features'
import Testimonials from './Testimonials'
import CtaBand from './CtaBand'

/**
 * Landing — the home page content (hero through CTA band). The router
 * shell (App) supplies the navbar, footer, and scroll reset.
 */
export default function Landing() {
  return (
    <>
      <Hero />
      <Trending />
      <GenreSection />
      <Features />
      <Testimonials />
      <CtaBand />
    </>
  )
}
