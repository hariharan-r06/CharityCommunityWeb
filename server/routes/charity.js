const express = require('express');
const router = express.Router();
const Charity = require('../models/Charity');
const User = require('../models/User');

// Create charity profile
router.post('/', async (req, res) => {
  try {
    const { name, email, address, phone, paymentLinks } = req.body;
    
    // Create welcome messages for the new charity
    const welcomeMessages = [
      {
        from: "CharityConnect Team",
        to: name,
        message: `Welcome to CharityConnect, ${name}! This is where you'll find your messages and notifications.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        from: "CharityConnect Team",
        to: name,
        message: "You can send and receive messages with donors through this platform.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        from: "CharityConnect Team",
        to: name,
        message: "Create posts to share updates about your work with your followers.",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Log the welcome messages to verify
    console.log(`Creating charity ${name} with ${welcomeMessages.length} welcome messages:`, 
      welcomeMessages.map(m => ({ from: m.from, to: m.to, message: m.message.substring(0, 30) + '...' }))
    );
    
    const charity = new Charity({
      name,
      email,
      address,
      phone,
      paymentLinks: paymentLinks || [],
      followers: [],
      posts: [],
      messages: welcomeMessages // Initialize with welcome messages
    });

    await charity.save();
    
    // Verify messages were saved
    const savedCharity = await Charity.findOne({ email });
    console.log(`Charity ${name} saved with ${savedCharity.messages ? savedCharity.messages.length : 0} messages`);
    
    res.status(201).json({ success: true, data: charity });
  } catch (error) {
    console.error("Error creating charity profile:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get charity by email
router.get('/email/:email', async (req, res) => {
  try {
    console.log(`Finding charity with email: ${req.params.email}`);
    const charity = await Charity.findOne({ email: req.params.email });
    
    if (!charity) {
      console.log(`No charity found with email: ${req.params.email}`);
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    console.log(`Found charity with email ${req.params.email}:`, charity.name);
    res.status(200).json({ success: true, data: charity });
  } catch (error) {
    console.error(`Error finding charity by email:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get charity by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`Finding charity with ID: ${req.params.id}`);
    const charity = await Charity.findById(req.params.id);
    
    if (!charity) {
      console.log(`No charity found with ID: ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    console.log(`Found charity with ID ${req.params.id}:`, charity.name);
    res.status(200).json({ success: true, data: charity });
  } catch (error) {
    console.error(`Error finding charity by ID:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new post for a charity
router.post('/:id/posts', async (req, res) => {
  try {
    console.log(`Creating post for charity ${req.params.id}`, { 
      text: req.body.text ? req.body.text.substring(0, 30) + '...' : 'No text',
      hasImage: !!req.body.image,
      imageSize: req.body.image ? `${Math.round(req.body.image.length / 1024)}KB` : 'No image'
    });
    
    const charity = await Charity.findById(req.params.id);
    
    if (!charity) {
      console.log(`Charity not found with ID: ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    const { text, image } = req.body;
    
    // Validate image size
    if (image && image.length > 5 * 1024 * 1024) { // 5MB limit in characters
      console.log(`Image too large: ${Math.round(image.length / 1024)}KB`);
      return res.status(400).json({ 
        success: false, 
        message: 'Image too large. Please use an image smaller than 5MB.'
      });
    }
    
    charity.posts.push({
      text,
      image,
      comments: []
    });

    await charity.save();
    
    // Return the newly created post
    const newPost = charity.posts[charity.posts.length - 1];
    console.log(`Post created successfully with ID: ${newPost._id}`);
    
    res.status(201).json({ success: true, data: newPost });
  } catch (error) {
    console.error(`Error creating post:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get all posts for a charity
router.get('/:id/posts', async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);
    
    if (!charity) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    // Process posts to ensure all comment IDs are strings
    const processedPosts = charity.posts.map(post => {
      // Process comments to ensure IDs are strings
      const processedComments = post.comments.map(comment => ({
        _id: comment._id.toString(),
        from: comment.from,
        to: comment.to,
        message: comment.message,
        createdAt: comment.createdAt
      }));

      return {
        _id: post._id.toString(),
        text: post.text,
        image: post.image,
        comments: processedComments.length,
        commentsList: processedComments,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      };
    });

    res.status(200).json({ success: true, data: processedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific post from a charity
router.get('/:id/posts/:postId', async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);
    
    if (!charity) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    const post = charity.posts.id(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a comment to a post
router.post('/:id/posts/:postId/comments', async (req, res) => {
  try {
    console.log(`Adding comment to post ${req.params.postId} for charity ${req.params.id}`, req.body);
    const charity = await Charity.findById(req.params.id);
    
    if (!charity) {
      console.log(`Charity not found with ID: ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    const post = charity.posts.id(req.params.postId);
    
    if (!post) {
      console.log(`Post not found with ID: ${req.params.postId}`);
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const { from, to, message } = req.body;
    
    post.comments.push({
      from,
      to,
      message
    });

    await charity.save();
    
    // Return the newly created comment
    const newComment = post.comments[post.comments.length - 1];
    console.log(`Comment added successfully with ID: ${newComment._id}`);
    
    // Return a processed comment with _id as a string
    const processedComment = {
      _id: newComment._id.toString(),
      from: newComment.from,
      to: newComment.to,
      message: newComment.message,
      createdAt: newComment.createdAt
    };
    
    res.status(201).json({ success: true, data: processedComment });
  } catch (error) {
    console.error(`Error adding comment:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Force-update a charity's messages field
router.patch('/:id/messages/init', async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);
    
    if (!charity) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    // Check if messages array exists and has content
    if (charity.messages && charity.messages.length > 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'Messages field already exists and has content',
        data: charity.messages
      });
    }
    
    // Create welcome messages for the new charity
    const welcomeMessages = [
      {
        from: "CharityConnect Team",
        to: charity.name,
        message: `Welcome to CharityConnect, ${charity.name}! This is where you'll find your messages and notifications.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        from: "CharityConnect Team",
        to: charity.name,
        message: "You can send and receive messages with donors through this platform.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        from: "CharityConnect Team",
        to: charity.name,
        message: "Create posts to share updates about your work with your followers.",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Initialize or update the messages field
    charity.messages = welcomeMessages;
    await charity.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Messages field initialized with welcome messages',
      data: charity.messages
    });
  } catch (error) {
    console.error("Error initializing charity messages:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all charities
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all charities');
    const charities = await Charity.find({}, {
      name: 1,
      email: 1,
      address: 1,
      followers: 1,
      phone: 1,
      createdAt: 1,
      updatedAt: 1
    });
    
    console.log(`Found ${charities.length} charities`);
    res.status(200).json({ success: true, data: charities });
  } catch (error) {
    console.error('Error fetching all charities:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update charity info including bank details
router.put('/:id', async (req, res) => {
  try {
    const { name, email, address, phone, paymentLinks, bankDetails } = req.body;
    
    // Update charity profile
    const charity = await Charity.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        email, 
        address, 
        phone, 
        paymentLinks,
        bankDetails
      },
      { new: true }
    );
    
    if (!charity) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }
    
    // Update user info if exists
    try {
      await User.findOneAndUpdate(
        { email },
        { name, phone }
      );
    } catch (userErr) {
      console.error("Error updating user data:", userErr);
      // Continue despite error in updating user data
    }
    
    res.status(200).json({ success: true, data: charity });
  } catch (error) {
    console.error("Error updating charity info:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 