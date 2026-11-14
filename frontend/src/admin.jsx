import { useState, useEffect } from 'react';
import defaultBlogs from './data/defaultBlogs';
import { API_BASE_URL } from './config';

const CATEGORIES = [
  'Software Development',
  'Artificial Intelligence & Machine Learning',
  'Web and Mobile App Development',
  'Technology & Innovation',
  'Cybersecurity',
  'Cloud Computing',
  'Industry Insights'
];

function Admin({ onNavigate }) {
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || '');
  const [emailInput, setEmailInput] = useState('admin@softrate.com');
  const [passInput, setPassInput] = useState('admin123');
  const [authErr, setAuthErr] = useState('');

  // CMS state
  const [articleList, setArticleList] = useState(defaultBlogs);
  const [currentTab, setCurrentTab] = useState('list'); // 'list' | 'editor'
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [editId, setEditId] = useState(null);

  // Form input state
  const [postData, setPostData] = useState({
    title: '',
    slug: '',
    category: CATEGORIES[0],
    tags: '',
    author: 'Arunesh R',
    image: '',
    content: '',
    status: 'published',
    isFeatured: false,
    seoTitle: '',
    seoDescription: ''
  });

  const fetchArticles = () => {
    fetch(`${API_BASE_URL}/api/posts`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          if (data.length >= 42) {
            setArticleList(data);
          } else if (data.length > 0) {
            const merged = [...data];
            defaultBlogs.forEach((db) => {
              if (!merged.some((m) => m.slug === db.slug || m.title === db.title)) {
                merged.push(db);
              }
            });
            setArticleList(merged);
          }
        }
      })
      .catch((err) => console.log('Fetch error:', err));
  };

  useEffect(() => {
    if (authToken) {
      fetchArticles();
    }
  }, [authToken]);

  // Login handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthErr('');

    try {
      await fetch(`${API_BASE_URL}/api/auth/setup-admin`, { method: 'POST' });

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passInput })
      });

      const resData = await res.json();
      if (!res.ok) {
        setAuthErr(resData.message || 'Invalid credentials');
        return;
      }

      localStorage.setItem('token', resData.token);
      setAuthToken(resData.token);
    } catch (err) {
      if (emailInput === 'admin@softrate.com' && passInput === 'admin123') {
        const fallbackToken = 'admin_session_' + Date.now();
        localStorage.setItem('token', fallbackToken);
        setAuthToken(fallbackToken);
        setFeedbackMsg('Admin access unlocked. Make sure backend is running on port 5000 for live MongoDB sync.');
      } else {
        setAuthErr('Could not connect to backend server. Please verify backend is running on port 5000.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken('');
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPostData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    const cleanSlug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    setPostData((prev) => ({
      ...prev,
      title: newTitle,
      slug: cleanSlug,
      seoTitle: newTitle
    }));
  };

  const handleStartEdit = (blog) => {
    setEditId(blog._id);
    setPostData({
      title: blog.title || '',
      slug: blog.slug || '',
      category: blog.category || CATEGORIES[0],
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
      author: blog.author || 'Arunesh R',
      image: blog.image || '',
      content: blog.content || '',
      status: blog.status || 'published',
      isFeatured: Boolean(blog.isFeatured),
      seoTitle: blog.seoTitle || '',
      seoDescription: blog.seoDescription || ''
    });
    setCurrentTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setEditId(null);
    setPostData({
      title: '',
      slug: '',
      category: CATEGORIES[0],
      tags: '',
      author: 'Arunesh R',
      image: '',
      content: '',
      status: 'published',
      isFeatured: false,
      seoTitle: '',
      seoDescription: ''
    });
    setCurrentTab('list');
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();

    if (!postData.title.trim() || !postData.content.trim()) {
      alert('Please fill out the title and content.');
      return;
    }

    const endpoint = editId
      ? `${API_BASE_URL}/api/posts/${editId}`
      : `${API_BASE_URL}/api/posts`;

    const reqMethod = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method: reqMethod,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(postData)
      });

      const resData = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          setAuthToken('');
          alert('Your login session has expired. Please log in again.');
          return;
        }
        alert(`Could not save: ${resData.message || 'Please check your inputs'}`);
        setFeedbackMsg(`Error: ${resData.message || 'Failed'}`);
        return;
      }

      setFeedbackMsg(editId ? 'Article updated successfully!' : 'Article published successfully!');
      handleResetForm();
      fetchArticles();
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err) {
      console.log('Error saving:', err);
      alert('Network error: Unable to connect to the backend server. Is backend running?');
    }
  };

  const handleDeleteArticle = (id) => {
    if (!window.confirm('Delete this article?')) return;

    fetch(`${API_BASE_URL}/api/posts/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            setAuthToken('');
            alert('Your session has expired. Please log in again.');
            return;
          }
          const errData = await res.json();
          alert(errData.message || 'Failed to delete');
          return;
        }
        fetchArticles();
      })
      .catch((err) => console.log('Delete error:', err));
  };

  const displayedArticles = articleList.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  if (!authToken) {
    return (
      <div className="admin-login-box">
        <button className="back-link" onClick={() => onNavigate('home')}>
          ← Back to Site
        </button>
        <h2>Admin Login</h2>
        <p style={{ color: '#666', fontSize: '13px', margin: '8px 0 16px' }}>
          Please sign in to access the blog management system.
        </p>

        {authErr && <p style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>{authErr}</p>}

        <form onSubmit={handleAuthSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Log In to Admin
          </button>
        </form>

        <div style={{ marginTop: '16px', background: '#f1f5f9', padding: '10px', borderRadius: '4px', fontSize: '12px', color: '#475569' }}>
          <strong>Default Login:</strong><br />
          admin@softrate.com / admin123
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-topbar">
        <div>
          <h2>Content Management System</h2>
          <small style={{ color: '#64748b' }}>Admin: Arunesh (Online)</small>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="back-link" onClick={() => onNavigate('home')}>
            View Blog
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '4px', margin: '14px 0', fontSize: '14px' }}>
          {feedbackMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-nav-tabs">
        <button
          className={`tab-btn ${currentTab === 'list' ? 'active' : ''}`}
          onClick={() => { setCurrentTab('list'); setEditId(null); }}
        >
          Manage Posts ({articleList.length})
        </button>
        <button
          className={`tab-btn ${currentTab === 'editor' ? 'active' : ''}`}
          onClick={() => setCurrentTab('editor')}
        >
          {editId ? 'Edit Post' : '+ Create Post'}
        </button>
      </div>

      {/* TAB 1: POSTS TABLE */}
      {currentTab === 'list' && (
        <div>
          <div className="status-filters">
            <button
              className={statusFilter === 'all' ? 'active-filter' : ''}
              onClick={() => setStatusFilter('all')}
            >
              All ({articleList.length})
            </button>
            <button
              className={statusFilter === 'published' ? 'active-filter' : ''}
              onClick={() => setStatusFilter('published')}
            >
              Published ({articleList.filter(a => a.status === 'published').length})
            </button>
            <button
              className={statusFilter === 'draft' ? 'active-filter' : ''}
              onClick={() => setStatusFilter('draft')}
            >
              Drafts ({articleList.filter(a => a.status === 'draft').length})
            </button>
            <button
              className={statusFilter === 'scheduled' ? 'active-filter' : ''}
              onClick={() => setStatusFilter('scheduled')}
            >
              Scheduled ({articleList.filter(a => a.status === 'scheduled').length})
            </button>
          </div>

          <table className="cms-table">
            <thead>
              <tr>
                <th style={{ width: '36%' }}>Title & Slug</th>
                <th style={{ width: '16%' }}>Category</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '10%' }}>Featured</th>
                <th style={{ width: '12%' }}>Author</th>
                <th style={{ width: '14%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedArticles.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                    No articles found.
                  </td>
                </tr>
              ) : (
                displayedArticles.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="table-title">{item.title}</div>
                      <div className="table-slug">/{item.slug || 'no-slug'}</div>
                    </td>
                    <td>{item.category}</td>
                    <td>
                      <span className={`status-tag ${item.status || 'published'}`}>
                        {item.status || 'published'}
                      </span>
                    </td>
                    <td>{item.isFeatured ? 'Yes' : 'No'}</td>
                    <td>{item.author}</td>
                    <td className="actions-cell">
                      <button className="edit-btn" onClick={() => handleStartEdit(item)}>
                        Edit
                      </button>
                      <button className="delete-btn" onClick={() => handleDeleteArticle(item._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: COMPOSE / EDIT FORM */}
      {currentTab === 'editor' && (
        <form onSubmit={handleSaveArticle} className="cms-form">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{editId ? 'Edit Article' : 'Write New Article'}</h3>
            {editId && (
              <button type="button" onClick={handleResetForm} style={{ padding: '4px 8px', cursor: 'pointer' }}>
                Cancel Edit
              </button>
            )}
          </div>

          <div className="form-group">
            <label>Article Title</label>
            <input
              type="text"
              name="title"
              value={postData.title}
              onChange={handleTitleChange}
              placeholder="e.g. Modern Web Development"
              required
            />
          </div>

          <div className="form-group">
            <label>URL Slug</label>
            <input
              type="text"
              name="slug"
              value={postData.slug}
              onChange={handleFieldChange}
              required
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={postData.category} onChange={handleFieldChange}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Author Name</label>
              <input
                type="text"
                name="author"
                value={postData.author}
                onChange={handleFieldChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Tags</label>
              <input
                type="text"
                name="tags"
                value={postData.tags}
                onChange={handleFieldChange}
                placeholder="react, web, javascript"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Publication Status</label>
              <select name="status" value={postData.status} onChange={handleFieldChange}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={postData.isFeatured}
                  onChange={handleFieldChange}
                />
                <span>Mark as Featured Article</span>
              </label>
            </div>
          </div>

          {/* Featured Image URL with Presets and Live Preview */}
          <div className="form-group">
            <label>Featured Image URL</label>
            <input
              type="text"
              name="image"
              value={postData.image}
              onChange={handleFieldChange}
              placeholder="Paste direct image URL (e.g. https://images.unsplash.com/...)"
            />

            {/* Quick Preset Buttons for Instant 100% Working Image Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Quick presets:</span>
              <button
                type="button"
                className="share-btn"
                onClick={() => setPostData({ ...postData, image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800' })}
              >
                Coding
              </button>
              <button
                type="button"
                className="share-btn"
                onClick={() => setPostData({ ...postData, image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800' })}
              >
                AI / Neural
              </button>
              <button
                type="button"
                className="share-btn"
                onClick={() => setPostData({ ...postData, image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800' })}
              >
                Cybersecurity
              </button>
              <button
                type="button"
                className="share-btn"
                onClick={() => setPostData({ ...postData, image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800' })}
              >
                Cloud Servers
              </button>
              <button
                type="button"
                className="share-btn"
                onClick={() => setPostData({ ...postData, image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800' })}
              >
                Mobile App
              </button>
            </div>

            {postData.image && (
              <div style={{ marginTop: '10px' }}>
                <small style={{ display: 'block', marginBottom: '4px', color: '#64748b', fontWeight: 600 }}>Image Preview:</small>
                <img
                  src={postData.image}
                  alt="Preview"
                  style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800';
                  }}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Article Content</label>
            <textarea
              name="content"
              rows="8"
              value={postData.content}
              onChange={handleFieldChange}
              placeholder="Write your article text here..."
              required
            />
          </div>

          <fieldset className="seo-box">
            <legend>SEO Settings</legend>
            <div className="form-group">
              <label>Meta Title</label>
              <input
                type="text"
                name="seoTitle"
                value={postData.seoTitle}
                onChange={handleFieldChange}
              />
            </div>
            <div className="form-group">
              <label>Meta Description</label>
              <textarea
                name="seoDescription"
                rows="2"
                value={postData.seoDescription}
                onChange={handleFieldChange}
              />
            </div>
          </fieldset>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" className="save-btn">
              {editId ? 'Update Article' : postData.status === 'draft' ? 'Save Draft' : 'Publish Article'}
            </button>
            <button type="button" className="cancel-btn" onClick={handleResetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Admin;