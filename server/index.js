const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();


app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


<<<<<<< HEAD
const MONGODB_URI = 'mongodb+srv://harihari91408:Hari123456@cc.trjljib.mongodb.net/?retryWrites=true&w=majority&appName=CC';
=======
const MONGODB_URI = 'your url';
>>>>>>> fba60b6d640eb49447538c7729e830389b62f96f

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));


const charityRoutes = require('./routes/charity');
const donorRoutes = require('./routes/donor');
const profileRoutes = require('./routes/profile');
const messageRoutes = require('./routes/message');

app.use('/api/charity', charityRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/messages', messageRoutes);


const Charity = require('./models/Charity');

app.get('/api/feed', async (req, res) => {
  try {
    // Get all charities
    const charities = await Charity.find();
    
    // Collect all posts from all charities
    let allPosts = [];
    
    for (const charity of charities) {
      // For each charity, get their posts with charity info
      const charityPosts = charity.posts.map(post => ({
        ...post.toObject(),
        charity: {
          id: charity._id,
          name: charity.name,
          avatar: "/placeholder.svg?height=40&width=40",
          verified: true
        }
      }));
      
      allPosts = [...allPosts, ...charityPosts];
    }
    
    // Sort posts by creation date (newest first)
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.status(200).json({ success: true, data: allPosts });
  } catch (error) {
    console.error('Get feed API error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


app.use('/api/dashboard/charity/:id', (req, res, next) => {
  req.url = `/${req.params.id}`;
  charityRoutes(req, res, next);
});

app.use('/api/dashboard/donor/:id', (req, res, next) => {
  req.url = `/${req.params.id}`;
  donorRoutes(req, res, next);
});

// Get all charities endpoint
app.get('/api/charities', async (req, res) => {
  try {
    const charities = await Charity.find();
    
    // Map charities to include only necessary information
    const formattedCharities = charities.map(charity => ({
      _id: charity._id,
      name: charity.name,
      email: charity.email,
      address: charity.address,
      phone: charity.phone,
      followers: charity.followers,
      postsCount: charity.posts.length,
      paymentLinks: charity.paymentLinks,
      createdAt: charity.createdAt,
      updatedAt: charity.updatedAt
    }));
    
    res.status(200).json({ success: true, data: formattedCharities });
  } catch (error) {
    console.error('Get all charities API error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
