import { useState, useEffect } from 'react';
import Navbar from './components/navigation';
import Footer from './components/footer';
import Home from './home';
import About from './about';
import Contact from './contact';
import Admin from './admin';
import defaultBlogs from './data/defaultBlogs';
import { API_BASE_URL } from './config';

function App() {
  const [searchTxt, setSearchTxt] = useState('');
  const [activeView, setActiveView] = useState('home'); // 'home' | 'blog' | 'about' | 'contact' | 'detail' | 'admin'
  const [currentBlog, setCurrentBlog] = useState(null);
  const [allBlogs, setAllBlogs] = useState(defaultBlogs);
  const [copied, setCopied] = useState(false);

  // Load all blogs for navigation and related posts
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/posts`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length >= 42) {
          setAllBlogs(data);
        } else if (Array.isArray(data) && data.length > 0) {
          const merged = [...data];
          defaultBlogs.forEach((db) => {
            if (!merged.some((m) => m.slug === db.slug || m.title === db.title)) {
              merged.push(db);
            }
          });
          setAllBlogs(merged);
        }
      })
      .catch((err) => console.log('Preloaded 42 articles active:', err));
  }, [activeView]);

  const handleOpenBlog = (blog) => {
    setCurrentBlog(blog);
    setActiveView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view) => {
    setActiveView(view);
    if (view !== 'detail') {
      setCurrentBlog(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Previous and Next article navigation
  const currentIndex = allBlogs.findIndex((b) => b._id === currentBlog?._id);
  const prevBlog = currentIndex > 0 ? allBlogs[currentIndex - 1] : null;
  const nextBlog = currentIndex >= 0 && currentIndex < allBlogs.length - 1 ? allBlogs[currentIndex + 1] : null;

  // Related articles (same category)
  const relatedBlogs = allBlogs
    .filter((b) => b.category === currentBlog?.category && b._id !== currentBlog?._id)
    .slice(0, 2);

  // Estimated reading time
  const wordCount = currentBlog?.content ? currentBlog.content.split(' ').length : 0;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 150));

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="app-container">
      <Navbar
        onNavigate={handleNavigate}
        activeView={activeView}
      />

      <main style={{ minHeight: '80vh' }}>
        {/* 1. Home View */}
        {activeView === 'home' && (
          <Home
            searchTxt={searchTxt}
            setSearchTxt={setSearchTxt}
            onOpenBlog={handleOpenBlog}
          />
        )}

        {/* 2. Full Blog Listing View */}
        {activeView === 'blog' && (
          <Home
            searchTxt={searchTxt}
            setSearchTxt={setSearchTxt}
            onOpenBlog={handleOpenBlog}
          />
        )}

        {/* 3. About View */}
        {activeView === 'about' && <About />}

        {/* 4. Contact View */}
        {activeView === 'contact' && <Contact />}

        {/* 5. Blog Detail View */}
        {activeView === 'detail' && currentBlog && (
          <div className="detail-wrapper">
            <button className="back-link" onClick={() => handleNavigate('blog')}>
              ← Back to all articles
            </button>

            <article className="article-main">
              <span className="pill-badge">{currentBlog.category}</span>
              <h1 className="article-heading">{currentBlog.title}</h1>

              <div className="article-info-bar">
                <span>By <strong>{currentBlog.author || 'Arunesh'}</strong></span>
                <span> • </span>
                <span>{new Date(currentBlog.createdAt).toLocaleDateString()}</span>
                <span> • </span>
                <span>{readMinutes} min read</span>
              </div>

              {currentBlog.image && (
                <img
                  src={currentBlog.image}
                  alt={currentBlog.title}
                  className="article-hero-img"
                />
              )}

              <div className="toc-box">
                <h4>Table of Contents</h4>
                <ul>
                  <li><a href="#overview">1. Overview</a></li>
                  <li><a href="#details">2. Key Insights</a></li>
                  <li><a href="#summary">3. Conclusion</a></li>
                </ul>
              </div>

              <div className="article-text">
                <section id="overview">
                  <p>{currentBlog.content}</p>
                </section>
              </div>

              {/* Social Sharing */}
              <div className="social-share-row">
                <span>Share this article:</span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(currentBlog.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="share-btn x-btn"
                >
                  Share on X
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="share-btn in-btn"
                >
                  Share on LinkedIn
                </a>
                <button onClick={handleCopyLink} className="share-btn copy-btn">
                  {copied ? '✓ Link Copied!' : 'Copy Link'}
                </button>
              </div>

              {/* Prev / Next Navigation */}
              <div className="prev-next-nav">
                {prevBlog ? (
                  <button className="nav-arrow-btn" onClick={() => handleOpenBlog(prevBlog)}>
                    ← Previous: {prevBlog.title.slice(0, 25)}...
                  </button>
                ) : <div />}

                {nextBlog && (
                  <button className="nav-arrow-btn next-arrow" onClick={() => handleOpenBlog(nextBlog)}>
                    Next: {nextBlog.title.slice(0, 25)}... →
                  </button>
                )}
              </div>

              {/* Related Articles */}
              {relatedBlogs.length > 0 && (
                <div className="related-section">
                  <h3>Related Articles</h3>
                  <div className="related-grid">
                    {relatedBlogs.map((rb) => (
                      <div key={rb._id} className="related-card" onClick={() => handleOpenBlog(rb)}>
                        {rb.image && <img src={rb.image} alt={rb.title} className="related-img" />}
                        <div className="related-body">
                          <span className="pill-badge">{rb.category}</span>
                          <h4>{rb.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>
        )}

        {/* 6. Admin View */}
        {activeView === 'admin' && (
          <Admin onNavigate={handleNavigate} />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;