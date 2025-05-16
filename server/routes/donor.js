const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');
const Charity = require('../models/Charity');
const User = require('../models/User');

// Create donor profile
router.post('/', async (req, res) => {
  try {
    const { name, email, address, phone } = req.body;
    
    // Create welcome messages for the new donor
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
        message: "You can send and receive messages with charities through this platform.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        from: "CharityConnect Team",
        to: name,
        message: "Follow charities you care about to stay updated with their work.",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Log the welcome messages to verify
    console.log(`Creating donor ${name} with ${welcomeMessages.length} welcome messages:`, 
      welcomeMessages.map(m => ({ from: m.from, to: m.to, message: m.message.substring(0, 30) + '...' }))
    );
    
    const donor = new Donor({
      name,
      email,
      address,
      phone,
      following: [],
      donations: [],
      messages: welcomeMessages // Initialize with welcome messages
    });

    await donor.save();
    
    // Verify messages were saved
    const savedDonor = await Donor.findOne({ email });
    console.log(`Donor ${name} saved with ${savedDonor.messages ? savedDonor.messages.length : 0} messages`);
    
    res.status(201).json({ success: true, data: donor });
  } catch (error) {
    console.error("Error creating donor profile:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get donor by email
router.get('/email/:email', async (req, res) => {
  try {
    console.log(`Finding donor with email: ${req.params.email}`);
    const donor = await Donor.findOne({ email: req.params.email });
    
    if (!donor) {
      console.log(`No donor found with email: ${req.params.email}`);
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    console.log(`Found donor with email ${req.params.email}:`, donor.name);
    res.status(200).json({ success: true, data: donor });
  } catch (error) {
    console.error(`Error finding donor by email:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get donor by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`Finding donor with ID: ${req.params.id}`);
    const donor = await Donor.findById(req.params.id);
    
    if (!donor) {
      console.log(`No donor found with ID: ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    console.log(`Found donor with ID ${req.params.id}:`, donor.name);
    res.status(200).json({ success: true, data: donor });
  } catch (error) {
    console.error(`Error finding donor by ID:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Follow a charity
router.post('/:donorId/follow/:charityId', async (req, res) => {
  try {
    const { donorId, charityId } = req.params;
    
    // Check if donor exists
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Check if charity exists
    const charity = await Charity.findById(charityId);
    if (!charity) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    // Check if already following
    if (donor.following.includes(charityId)) {
      return res.status(400).json({ success: false, message: 'Already following this charity' });
    }

    // Add charity to donor's following list
    donor.following.push(charityId);
    await donor.save();

    // Add donor to charity's followers list
    charity.followers.push(donorId);
    await charity.save();

    res.status(200).json({ 
      success: true, 
      message: 'Successfully followed charity',
      data: { 
        followingCount: donor.following.length,
        followersCount: charity.followers.length
      } 
    });
  } catch (error) {
    console.error('Error following charity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Unfollow a charity
router.post('/:donorId/unfollow/:charityId', async (req, res) => {
  try {
    const { donorId, charityId } = req.params;
    
    // Check if donor exists
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Check if charity exists
    const charity = await Charity.findById(charityId);
    if (!charity) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    // Check if actually following
    if (!donor.following.includes(charityId)) {
      return res.status(400).json({ success: false, message: 'Not following this charity' });
    }

    // Remove charity from donor's following list
    donor.following = donor.following.filter(id => id.toString() !== charityId);
    await donor.save();

    // Remove donor from charity's followers list
    charity.followers = charity.followers.filter(id => id.toString() !== donorId);
    await charity.save();

    res.status(200).json({ 
      success: true, 
      message: 'Successfully unfollowed charity',
      data: { 
        followingCount: donor.following.length,
        followersCount: charity.followers.length
      } 
    });
  } catch (error) {
    console.error('Error unfollowing charity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get followed charities posts (feed)
router.get('/:id/feed', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // If donor is not following any charities
    if (!donor.following.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Fetch all followed charities
    const charities = await Charity.find({
      _id: { $in: donor.following }
    });

    // Extract all posts from followed charities
    const allPosts = [];
    
    charities.forEach(charity => {
      const charityPosts = charity.posts.map(post => {
        // Process comments to include only necessary fields
        const processedComments = post.comments.map(comment => ({
          _id: comment._id.toString(),
          from: comment.from,
          to: comment.to,
          message: comment.message,
          createdAt: comment.createdAt
        }));

        return {
          _id: post._id,
          text: post.text,
          image: post.image,
          comments: post.comments.length,
          commentsList: processedComments,
          likes: 0, // Since we don't store likes yet
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          charity: {
            id: charity._id,
            name: charity.name,
            email: charity.email,
            avatar: '/placeholder.svg?height=40&width=40', // Placeholder for now
            verified: true // Assuming all charities are verified for now
          }
        };
      });
      
      allPosts.push(...charityPosts);
    });
    
    // Sort posts by creation date (most recent first)
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.status(200).json({ success: true, data: allPosts });
  } catch (error) {
    console.error("Error fetching donor feed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Force-update a donor's messages field
router.patch('/:id/messages/init', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Check if messages array exists and has content
    if (donor.messages && donor.messages.length > 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'Messages field already exists and has content',
        data: donor.messages
      });
    }
    
    // Create welcome messages for the donor
    const welcomeMessages = [
      {
        from: "CharityConnect Team",
        to: donor.name,
        message: `Welcome to CharityConnect, ${donor.name}! This is where you'll find your messages and notifications.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        from: "CharityConnect Team",
        to: donor.name,
        message: "You can send and receive messages with charities through this platform.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        from: "CharityConnect Team",
        to: donor.name,
        message: "Follow charities you care about to stay updated with their work.",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Initialize or update the messages field
    donor.messages = welcomeMessages;
    await donor.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Messages field initialized with welcome messages',
      data: donor.messages
    });
  } catch (error) {
    console.error("Error initializing donor messages:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 