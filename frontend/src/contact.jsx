import { useState } from 'react';

function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
    setIsSubmitted(true);
  };

  return (
    <div className="page-box">
      <h2>Contact Us</h2>
      <p className="page-lead">
        Get in touch with the Softrate editorial and engineering team.
      </p>

      <div className="contact-layout">
        <div className="contact-info">
          <div className="info-item">
            <h4>Office Address</h4>
            <p>Softrate Technologies Pvt Ltd<br />Bengaluru, Karnataka, India</p>
          </div>

          <div className="info-item">
            <h4>Email</h4>
            <p>editorial@softrate.com</p>
          </div>

          <div className="info-item">
            <h4>Office Hours</h4>
            <p>Monday - Friday, 9:00 AM - 6:00 PM IST</p>
          </div>
        </div>

        <div className="contact-form-card">
          {isSubmitted ? (
            <div className="success-banner">
              <h3>Message Received</h3>
              <p>Thank you for getting in touch. Our team will review your note and respond shortly.</p>
              <button
                className="cancel-btn"
                style={{ marginTop: '16px' }}
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: '', email: '', message: '' });
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '14px' }}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '14px' }}>
                <label>Message</label>
                <textarea
                  rows="5"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help?"
                  required
                />
              </div>

              <button type="submit" className="save-btn" style={{ marginTop: '18px', width: '100%' }}>
                Submit Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Contact;
