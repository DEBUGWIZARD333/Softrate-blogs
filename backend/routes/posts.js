const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const protect = require('../middleware/auth');
const sampleBlogs = require('../seed');

// 1. Get all posts (public)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    let posts = await Post.find(filter).sort({ createdAt: -1 });

    // Auto-populate: If MongoDB has fewer than 42 posts, automatically seed the full 42 articles
    if (posts.length < 42 && !req.query.status) {
      try {
        await Post.deleteMany({});
        await Post.insertMany(sampleBlogs);
        posts = await Post.find(filter).sort({ createdAt: -1 });
      } catch (seedErr) {
        console.log('Auto-seed note:', seedErr.message);
      }
    }

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Explicit endpoint to force sync all 42 articles
router.post('/sync-42', async (req, res) => {
  try {
    await Post.deleteMany({});
    const inserted = await Post.insertMany(sampleBlogs);
    res.json({ message: 'Successfully populated all 42 articles', count: inserted.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Get single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Create a new post (Admin protected)
router.post('/', protect, async (req, res) => {
  try {
    const { title, category, author, content, image, status, isFeatured, tags, seoTitle, seoDescription } = req.body;

    // Generate unique slug automatically avoiding index collision
    let baseSlug = (req.body.slug || title || 'post')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    let slug = baseSlug;
    const existingCount = await Post.countDocuments({ slug });
    if (existingCount > 0) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const newPost = new Post({
      title: title.trim(),
      slug,
      category,
      author: author ? author.trim() : (req.user?.name || 'Arunesh R'),
      content: content.trim(),
      image: image ? image.trim() : '',
      status: status || 'published',
      isFeatured: Boolean(isFeatured),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      seoTitle: seoTitle ? seoTitle.trim() : title.trim(),
      seoDescription: seoDescription ? seoDescription.trim() : ''
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// 4. Update / Edit post (Admin protected)
router.put('/:id', protect, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.image) {
      updateData.image = updateData.image.trim();
    }
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(t => t.trim());
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 5. Delete post (Admin protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
