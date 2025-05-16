// Script to initialize the messages field for all donor and charity documents
const mongoose = require('mongoose');
const Donor = require('./models/Donor');
const Charity = require('./models/Charity');


const MONGODB_URI = 'Replace your MongoDB Atlas Connection url';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

const createWelcomeMessages = (name) => {
  return [
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
      message: "You can send and receive messages with other users through this platform.",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      from: "CharityConnect Team",
      to: name,
      message: "Follow charities or start conversations to see your messages here.",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
};

const initializeDonors = async () => {
  try {
    // Find all donors that don't have a messages field or have an empty messages array
    const donors = await Donor.find({
      $or: [
        { messages: { $exists: false } },
        { messages: { $size: 0 } }
      ]
    });

    console.log(`Found ${donors.length} donors that need message initialization`);

    for (const donor of donors) {
      // Add welcome messages
      donor.messages = createWelcomeMessages(donor.name);
      
      // Save the updated donor
      await donor.save();
      console.log(`Initialized messages for donor: ${donor.name} (${donor._id})`);
    }

    console.log('Donor message initialization complete!');
  } catch (error) {
    console.error('Error initializing donor messages:', error);
  }
};

const initializeCharities = async () => {
  try {
    // Find all charities that don't have a messages field or have an empty messages array
    const charities = await Charity.find({
      $or: [
        { messages: { $exists: false } },
        { messages: { $size: 0 } }
      ]
    });

    console.log(`Found ${charities.length} charities that need message initialization`);

    for (const charity of charities) {
      // Add welcome messages
      charity.messages = createWelcomeMessages(charity.name);
      
      // Save the updated charity
      await charity.save();
      console.log(`Initialized messages for charity: ${charity.name} (${charity._id})`);
    }

    console.log('Charity message initialization complete!');
  } catch (error) {
    console.error('Error initializing charity messages:', error);
  }
};

const runInitialization = async () => {
  try {
    await initializeDonors();
    await initializeCharities();
    console.log('All message initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
};

runInitialization(); 
