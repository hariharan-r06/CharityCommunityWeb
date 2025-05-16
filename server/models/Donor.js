const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
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

const donorSchema = new mongoose.Schema({
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
    type: String
  },
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charity'
  }],
  donations: [{
    charity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Charity'
    },
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [messageSchema],
  phone: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Donor', donorSchema); 