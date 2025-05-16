const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'fromModel'
  },
  fromModel: {
    type: String,
    required: true,
    enum: ['Donor', 'Charity']
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'toModel'
  },
  toModel: {
    type: String,
    required: true,
    enum: ['Donor', 'Charity']
  },
  text: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  // For keeping track of conversation threads
  conversationId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Create an index on conversationId for faster lookups of conversation threads
messageSchema.index({ conversationId: 1 });

// Create a compound index for sender and receiver for faster lookups
messageSchema.index({ from: 1, to: 1 });

module.exports = mongoose.model('Message', messageSchema); 