import FadeIn from './FadeIn'

export default function CtaBand() {
  return (
    <FadeIn className="section" id="community">
      <div className="cta-band">
        <div className="cta-glow cta-glow--top-left" />
        <div className="cta-glow cta-glow--bottom-right" />
        <h2 className="cta-title">Your next favorite book is waiting.</h2>
        <p className="cta-sub">Join the community — it's free, and it takes thirty seconds.</p>
        <div className="cta-actions">
          <a className="btn-cta-primary" href="#trending">
            Join the Community
          </a>
          <a className="btn-cta-secondary" href="#trending">
            Browse Books
          </a>
        </div>
      </div>
    </FadeIn>
  )
}
