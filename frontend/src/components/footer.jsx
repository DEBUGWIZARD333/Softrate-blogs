function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Company Info */}
        <div className="footer-section">
          <h4>Softrate Blog</h4>
          <p>
            Sharing tutorials, trends, and engineering insights on software development, AI, and cloud technology.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li onClick={() => onNavigate('home')}>Home</li>
            <li onClick={() => onNavigate('admin')}>Admin Portal</li>
          </ul>
        </div>

        {/* Social Links */}
        <div className="footer-section">
          <h4>Follow Us</h4>
          <div className="social-links">
            <a href="https://www.linkedin.com/company/softrate/home/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Softrate Technologies. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;