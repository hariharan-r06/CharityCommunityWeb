const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Reuse the same schema for direct messages
const messageSchema = commentSchema;

const postSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  comments: [commentSchema]
}, { timestamps: true });

const paymentLinkSchema = new mongoose.Schema({
  gpayNo: {
    type: String
  },
  razorpay: {
    type: String
  }
});

const bankDetailsSchema = new mongoose.Schema({
  bankName: {
    type: String
  },
  accountNumber: {
    type: String
  },
  ifscCode: {
    type: String
  },
  branch: {
    type: String
  },
  accountType: {
    type: String
  },
  accountHolderName: {
    type: String
  }
});

const charitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor'
  }],
  posts: [postSchema],
  paymentLinks: [paymentLinkSchema],
  messages: [messageSchema],
  bankDetails: bankDetailsSchema,
  phone: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Charity', charitySchema); 