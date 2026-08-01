import FadeIn from './FadeIn'

const QUOTES = [
  {
    quote: "I found three books I loved in the first week. My TBR pile is out of control.",
    name: 'Ananya',
    tag: 'first-year lit student',
    initial: 'A',
    avatar: 'avatar--green',
  },
  {
    quote: "The club feature is dangerous. I've joined four and I read way more now.",
    name: 'Rohan',
    tag: 'software engineer',
    initial: 'R',
    avatar: 'avatar--gold',
  },
  {
    quote: 'Finally an app that gets that reading is a personality trait.',
    name: 'Meera',
    tag: 'book blogger',
    initial: 'M',
    avatar: 'avatar--terracotta',
  },
]

export default function Testimonials() {
  return (
    <FadeIn className="section" id="testimonials">
      <h2 className="section-title section-title--center">Readers are talking</h2>
      <div className="quote-grid">
        {QUOTES.map((item) => (
          <div className="quote-card" key={item.name}>
            <div className="quote-stars" aria-label="5 out of 5 stars">
              ★★★★★
            </div>
            <p className="quote-text">"{item.quote}"</p>
            <div className="quote-author">
              <span className={`avatar avatar--lg ${item.avatar}`}>{item.initial}</span>
              <div>
                <p className="quote-name">{item.name}</p>
                <p className="quote-tag">{item.tag}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </FadeIn>
  )
}
