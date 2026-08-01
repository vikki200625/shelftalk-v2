import FadeIn from './FadeIn'

const BOOKS = [
  {
    title: 'Dune',
    author: 'Frank Herbert',
    rating: '4.8',
    kicker: 'Sci-Fi Epic',
    cover: 'cover--forest',
    darkText: false,
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    rating: '4.5',
    kicker: 'Fiction',
    cover: 'cover--gold',
    darkText: true,
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    rating: '4.7',
    kicker: 'Self-Help',
    cover: 'cover--terracotta',
    darkText: false,
  },
  {
    title: '1984',
    author: 'George Orwell',
    rating: '4.6',
    kicker: 'Classic',
    cover: 'cover--sage',
    darkText: false,
  },
  {
    title: 'Pride & Prejudice',
    author: 'Jane Austen',
    rating: '4.7',
    kicker: 'Romance',
    cover: 'cover--olive',
    darkText: false,
  },
  {
    title: 'The Name of the Wind',
    author: 'Patrick Rothfuss',
    rating: '4.6',
    kicker: 'Fantasy',
    cover: 'cover--umber',
    darkText: false,
  },
]

export default function Trending() {
  return (
    <FadeIn className="section section--trending" id="trending">
      <div className="section-head">
        <h2 className="section-title">Trending with readers right now</h2>
        <a className="section-link" href="#trending">
          See all →
        </a>
      </div>
      <div className="trending-row">
        {BOOKS.map((book) => (
          <div className="trend-card" key={book.title}>
            <div className={`trend-cover ${book.cover}`}>
              <span className="trend-cover-kicker">{book.kicker}</span>
              <span className="trend-cover-title">{book.title}</span>
              <span className="trend-cover-author">{book.author}</span>
            </div>
            <p className="trend-title">{book.title}</p>
            <p className="trend-author">{book.author}</p>
            <p className="trend-rating">★ {book.rating}</p>
          </div>
        ))}
      </div>
    </FadeIn>
  )
}
