const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Donor = require('../models/Donor');
const Charity = require('../models/Charity');
const User = require('../models/User');

// Helper to generate a unique conversation ID for two entities
const generateConversationId = (id1, id2) => {
  // Ensure consistent ordering to get the same ID regardless of who initiates
  const sortedIds = [id1, id2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Send a message
router.post('/', async (req, res) => {
  try {
    const { from, fromModel, to, toModel, text } = req.body;

    if (!from || !to || !text || !fromModel || !toModel) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: from, fromModel, to, toModel, text' 
      });
    }

    // Verify fromModel and toModel are valid
    if (!['Donor', 'Charity'].includes(fromModel) || !['Donor', 'Charity'].includes(toModel)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid fromModel or toModel. Must be "Donor" or "Charity"' 
      });
    }

    // Generate a unique conversation ID
    const conversationId = generateConversationId(from, to);

    // Create new message
    const message = new Message({
      from,
      fromModel,
      to,
      toModel,
      text,
      conversationId
    });

    await message.save();

    // Also store messages in both entities' collections for persistence
    try {
      // Get sender details
      let fromEntity, fromName;
      if (fromModel === 'Donor') {
        fromEntity = await Donor.findById(from);
      } else {
        fromEntity = await Charity.findById(from);
      }

      if (!fromEntity) {
        throw new Error(`${fromModel} sender not found`);
      }
      fromName = fromEntity.name;

      // Get recipient details
      let toEntity, toName;
      if (toModel === 'Donor') {
        toEntity = await Donor.findById(to);
      } else {
        toEntity = await Charity.findById(to);
      }

      if (!toEntity) {
        throw new Error(`${toModel} recipient not found`);
      }
      toName = toEntity.name;

      // Create message in both sender's and recipient's message collections
      const currentDate = new Date();
      
      // Add to sender's messages
      fromEntity.messages = fromEntity.messages || [];
      fromEntity.messages.push({
        from: fromName,
        to: toName,
        message: text,
        createdAt: currentDate,
        updatedAt: currentDate
      });
      await fromEntity.save();

      // Add to recipient's messages
      toEntity.messages = toEntity.messages || [];
      toEntity.messages.push({
        from: fromName,
        to: toName,
        message: text,
        createdAt: currentDate,
        updatedAt: currentDate
      });
      await toEntity.save();
    } catch (error) {
      // Log the error but don't fail the message creation
      console.error("Error syncing messages to entities:", error);
    }

    // Update the messagesCount for both parties
    try {
      // Find the user documents for both parties and increment their messagesCount
      const fromUser = await User.findOne({ 
        email: fromModel === 'Donor' 
          ? (await Donor.findById(from)).email 
          : (await Charity.findById(from)).email 
      });
      
      const toUser = await User.findOne({ 
        email: toModel === 'Donor' 
          ? (await Donor.findById(to)).email 
          : (await Charity.findById(to)).email 
      });

      if (fromUser) {
        fromUser.messagesCount += 1;
        await fromUser.save();
      }

      if (toUser) {
        toUser.messagesCount += 1;
        await toUser.save();
      }
    } catch (error) {
      // Log the error but don't fail the message creation
      console.error("Error updating messagesCount:", error);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get conversation history between two entities
router.get('/conversation/:id1/:id2', async (req, res) => {
  try {
    const { id1, id2 } = req.params;
    const conversationId = generateConversationId(id1, id2);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 }); // Ascending order by time

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all conversations for a donor or charity
router.get('/conversations/:id/:role', async (req, res) => {
  try {
    const { id, role } = req.params;

    if (!['Donor', 'Charity'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "Donor" or "Charity"'
      });
    }

    // Find all messages where the entity is either sender or receiver
    const sentMessages = await Message.find({ from: id, fromModel: role });
    const receivedMessages = await Message.find({ to: id, toModel: role });

    // Combine all messages
    const allMessages = [...sentMessages, ...receivedMessages];

    // Extract unique conversation IDs
    const conversationIds = [...new Set(allMessages.map(msg => msg.conversationId))];

    // For each conversation, get the most recent message
    const conversations = await Promise.all(conversationIds.map(async (convId) => {
      const lastMessage = await Message.findOne({ conversationId: convId })
        .sort({ createdAt: -1 }); // Get most recent

      // Determine the other party in the conversation
      const otherPartyId = lastMessage.from.toString() === id ? lastMessage.to : lastMessage.from;
      const otherPartyModel = lastMessage.from.toString() === id ? lastMessage.toModel : lastMessage.fromModel;

      // Get details of the other party
      let otherParty;
      if (otherPartyModel === 'Donor') {
        otherParty = await Donor.findById(otherPartyId);
      } else {
        otherParty = await Charity.findById(otherPartyId);
      }

      // Get unread count for this conversation
      const unreadCount = await Message.countDocuments({
        conversationId: convId,
        to: id,
        toModel: role,
        read: false
      });

      return {
        id: convId,
        lastMessage,
        otherParty: {
          id: otherPartyId,
          model: otherPartyModel,
          name: otherParty?.name || 'Unknown',
          email: otherParty?.email || 'unknown@example.com'
        },
        unreadCount
      };
    }));

    // Sort conversations by the timestamp of the last message (most recent first)
    conversations.sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark messages as read
router.put('/read/:conversationId/:recipientId', async (req, res) => {
  try {
    const { conversationId, recipientId } = req.params;

    // Update all unread messages in this conversation where recipient is the specified user
    const result = await Message.updateMany(
      { conversationId, to: recipientId, read: false },
      { read: true }
    );

    res.status(200).json({ 
      success: true, 
      data: { modifiedCount: result.modifiedCount } 
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send a direct message that's stored in both collections
// This is a more robust endpoint that also ensures the message appears in the
// embedded messages arrays in both the sender and recipient documents
router.post('/direct', async (req, res) => {
  try {
    const { 
      fromId, 
      fromModel, 
      toId, 
      toModel, 
      message 
    } = req.body;

    if (!fromId || !fromModel || !toId || !toModel || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: fromId, fromModel, toId, toModel, message' 
      });
    }

    // Verify fromModel and toModel are valid
    if (!['Donor', 'Charity'].includes(fromModel) || !['Donor', 'Charity'].includes(toModel)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid fromModel or toModel. Must be "Donor" or "Charity"' 
      });
    }

    // Get sender details
    let fromEntity, fromName;
    if (fromModel === 'Donor') {
      fromEntity = await Donor.findById(fromId);
    } else {
      fromEntity = await Charity.findById(fromId);
    }

    if (!fromEntity) {
      return res.status(404).json({ 
        success: false, 
        message: `${fromModel} not found` 
      });
    }
    fromName = fromEntity.name;

    // Get recipient details
    let toEntity, toName;
    if (toModel === 'Donor') {
      toEntity = await Donor.findById(toId);
    } else {
      toEntity = await Charity.findById(toId);
    }

    if (!toEntity) {
      return res.status(404).json({ 
        success: false, 
        message: `${toModel} not found` 
      });
    }
    toName = toEntity.name;

    // Create message in both sender's and recipient's message collections
    const currentDate = new Date();
    
    // Add to sender's messages
    fromEntity.messages.push({
      from: fromName,
      to: toName,
      message: message,
      createdAt: currentDate,
      updatedAt: currentDate
    });
    await fromEntity.save();

    // Add to recipient's messages
    toEntity.messages.push({
      from: fromName,
      to: toName,
      message: message,
      createdAt: currentDate,
      updatedAt: currentDate
    });
    await toEntity.save();

    // Create a Message document for the conversation history
    const conversationId = generateConversationId(fromId, toId);
    const messageDoc = new Message({
      from: fromId,
      fromModel,
      to: toId,
      toModel,
      text: message,
      conversationId
    });
    await messageDoc.save();

    // Update message counts
    try {
      const fromUser = await User.findOne({ 
        email: fromEntity.email
      });
      
      const toUser = await User.findOne({ 
        email: toEntity.email
      });

      if (fromUser) {
        fromUser.messagesCount += 1;
        await fromUser.save();
      }

      if (toUser) {
        toUser.messagesCount += 1;
        await toUser.save();
      }
    } catch (error) {
      console.error("Error updating messagesCount:", error);
    }

    res.status(201).json({ 
      success: true, 
      data: {
        from: fromName,
        to: toName,
        message,
        timestamp: currentDate
      } 
    });
  } catch (error) {
    console.error("Error sending direct message:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get direct messages for an entity
router.get('/direct/:id/:model', async (req, res) => {
  try {
    const { id, model } = req.params;

    if (!['Donor', 'Charity'].includes(model)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid model. Must be "Donor" or "Charity"'
      });
    }

    let entity;
    if (model === 'Donor') {
      entity = await Donor.findById(id);
    } else {
      entity = await Charity.findById(id);
    }

    if (!entity) {
      return res.status(404).json({ 
        success: false, 
        message: `${model} not found` 
      });
    }

    // Sort messages by creation date (newest first)
    const messages = entity.messages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 