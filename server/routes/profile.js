const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Charity = require('../models/Charity');
const Donor = require('../models/Donor');

// Get user profile by email
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Basic user profile data
    const profileData = {
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      postsCount: user.postsCount,
      messagesCount: user.messagesCount,
      followersCount: user.followersCount,
      followingCount: user.followingCount
    };

    // Fetch additional role-specific data
    if (user.role === 'charity') {
      try {
        const charityData = await Charity.findOne({ email: user.email });
        if (charityData) {
          return res.json({
            ...profileData,
            charityId: charityData._id,
            address: charityData.address,
            followers: charityData.followers,
            posts: charityData.posts.length,
            paymentLinks: charityData.paymentLinks
          });
        }
      } catch (err) {
        console.error("Error fetching charity-specific data:", err);
        // Continue with basic profile if charity data fetch fails
      }
    } else if (user.role === 'donor') {
      try {
        const donorData = await Donor.findOne({ email: user.email });
        if (donorData) {
          return res.json({
            ...profileData,
            donorId: donorData._id,
            address: donorData.address,
            following: donorData.following,
            donations: donorData.donations
          });
        }
      } catch (err) {
        console.error("Error fetching donor-specific data:", err);
        // Continue with basic profile if donor data fetch fails
      }
    }

    // Return basic profile data if role-specific fetch failed
    res.json(profileData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a user profile
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, role, address } = req.body;
    
    if (!name || !email || !phone || !role) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Check if the user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      phone,
      role,
      address,
      postsCount: 0,
      messagesCount: 0,
      followersCount: 0,
      followingCount: 0
    });

    await user.save();
    
    res.status(201).json({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      postsCount: user.postsCount,
      messagesCount: user.messagesCount,
      followersCount: user.followersCount,
      followingCount: user.followingCount
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 