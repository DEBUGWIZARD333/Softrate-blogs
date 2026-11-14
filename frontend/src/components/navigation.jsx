import logoImg from '../assets/softrate-logo.jpg';

function Navbar({ onNavigate, activeView }) {
  return (
    <nav className="navbar">
      <div className="brand-logo" onClick={() => onNavigate('home')}>
        <img src={logoImg} alt="Softrate Logo" className="navbar-brand-logo" />
        <h2>Softrate Blog</h2>
      </div>

      <div className="nav-controls">
        <button
          className={`nav-btn ${activeView === 'home' ? 'active-link' : ''}`}
          onClick={() => onNavigate('home')}
        >
          Home
        </button>

        <button
          className={`nav-btn ${activeView === 'blog' ? 'active-link' : ''}`}
          onClick={() => onNavigate('blog')}
        >
          Blog
        </button>

        <button
          className={`nav-btn ${activeView === 'about' ? 'active-link' : ''}`}
          onClick={() => onNavigate('about')}
        >
          About
        </button>

        <button
          className={`nav-btn ${activeView === 'contact' ? 'active-link' : ''}`}
          onClick={() => onNavigate('contact')}
        >
          Contact
        </button>

        <button
          className="nav-btn write-btn"
          onClick={() => onNavigate('admin')}
        >
          + Admin
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
