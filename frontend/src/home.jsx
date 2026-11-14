import { useState, useEffect } from 'react';
import logoImg from './assets/softrate-logo.jpg';
import defaultBlogs from './data/defaultBlogs';
import { API_BASE_URL } from './config';

const CATEGORIES = [
  'All',
  'Software Development',
  'Artificial Intelligence & Machine Learning',
  'Web and Mobile App Development',
  'Technology & Innovation',
  'Cybersecurity',
  'Cloud Computing',
  'Industry Insights'
];

// Poster Slider component with auto-timer rotation and manual controls
function CardPosterSlider({ blog }) {
  // Use each card's dedicated unique images (guaranteed 100% unique per card)
  const images = (blog.images && blog.images.length > 0)
    ? blog.images
    : [blog.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'];

  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || images.length <= 1) return;

    // Rotate every 4.2s, slightly staggered per card for organic visual pacing
    const staggerMs = 4200 + ((blog.title ? blog.title.length * 110 : 0) % 1600);
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % images.length);
    }, staggerMs);

    return () => clearInterval(timer);
  }, [isPaused, images.length, blog.title]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  const handleDotClick = (e, index) => {
    e.stopPropagation();
    setActiveIdx(index);
  };

  return (
    <div
      className="card-thumb-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <img
        src={images[activeIdx]}
        alt={blog.title}
        className="card-thumb slider-active-img"
        key={activeIdx}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800';
        }}
      />

      {blog.isFeatured && <span className="featured-flag">Featured</span>}

      <span className="poster-read-badge">
        {Math.max(1, Math.ceil((blog.content ? blog.content.split(' ').length : 0) / 150))} min read
      </span>

      {images.length > 1 && (
        <>
          <button className="slider-arrow slider-prev" onClick={handlePrev} title="Previous image">
            ‹
          </button>
          <button className="slider-arrow slider-next" onClick={handleNext} title="Next image">
            ›
          </button>

          <div className="slider-dots-container">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`slider-dot ${idx === activeIdx ? 'active' : ''}`}
                onClick={(e) => handleDotClick(e, idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Home({ searchTxt, setSearchTxt, onOpenBlog }) {
  const [blogs, setBlogs] = useState(defaultBlogs);
  const [cat, setCat] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(42);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/posts`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          if (data.length >= 42) {
            setBlogs(data);
          } else {
            // Trigger auto-sync on backend to populate all 42 in MongoDB
            fetch(`${API_BASE_URL}/api/posts/sync-42`, { method: 'POST' }).catch(() => {});
            // Merge so the user ALWAYS sees all 42 articles
            const merged = [...data];
            defaultBlogs.forEach((db) => {
              if (!merged.some((m) => m.slug === db.slug || m.title === db.title)) {
                merged.push(db);
              }
            });
            setBlogs(merged);
          }
        }
      })
      .catch((err) => {
        console.log('Serving preloaded 42 topic articles:', err);
      });
  }, []);

  // Filter by search text and category dropdown
  const filteredBlogs = blogs.filter((item) => {
    const textMatch = item.title.toLowerCase().includes((searchTxt || '').toLowerCase());
    const catMatch = cat === 'All' || item.category === cat;
    return textMatch && catMatch;
  });

  if (isLoading) {
    return <p className="status-msg">Loading articles...</p>;
  }

  return (
    <div className="home-container">
      {/* Centered Blog Header */}
      <div className="home-hero-center">
        <div className="hero-logo-box">
          <img src={logoImg} alt="Softrate Company Logo" className="hero-company-logo" />
        </div>
        <h1 className="hero-center-title">Softrate Blog</h1>

        {/* Single Centered Search & Category Filter Bar */}
        <div className="filter-search-box">
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={searchTxt}
            onChange={(e) => setSearchTxt(e.target.value)}
            className="center-search-input"
          />

          <div className="cat-selector-inline">
            <label>Topic:</label>
            <select value={cat} onChange={(e) => { setCat(e.target.value); setVisibleCount(42); }}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredBlogs.length === 0 ? (
        <p className="empty-msg">No articles found matching your criteria.</p>
      ) : (
        <>
          {/* Article Count Indicator */}
          <div className="articles-count-bar">
            <span>
              Showing <strong>{filteredBlogs.length}</strong> {filteredBlogs.length === 1 ? 'article' : 'articles'}
              {cat !== 'All' ? ` in ${cat}` : ' across all 7 categories'}
            </span>
          </div>

          {/* Even-sized Cards Grid */}
          <div className="articles-grid">
            {filteredBlogs.slice(0, visibleCount).map((blog) => (
              <div key={blog._id} className="even-card" onClick={() => onOpenBlog(blog)}>
                <CardPosterSlider blog={blog} />

                <div className="even-card-body">
                  <div>
                    <span className="pill-badge">{blog.category}</span>
                    <h3 className="even-card-title">{blog.title}</h3>
                    <p className="even-card-desc">{blog.content}</p>
                  </div>

                  <div className="even-card-footer">
                    <span>By {blog.author || 'Arunesh R'}</span>
                    <span>•</span>
                    <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="read-time-tag">
                      {Math.max(1, Math.ceil((blog.content ? blog.content.split(' ').length : 0) / 150))} min read
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {filteredBlogs.length > visibleCount && (
            <div style={{ textAlign: 'center', marginTop: '36px' }}>
              <button
                className="load-more-btn"
                onClick={() => setVisibleCount((prev) => prev + 6)}
              >
                Load More Articles ({filteredBlogs.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
