/**
 * Helper functions for handling messages
 */

/**
 * Create a welcome message for new users
 * @param userName The name of the user
 * @returns A message object
 */
export function createWelcomeMessage(userName: string) {
  return {
    from: "CharityConnect Team",
    to: userName,
    message: `Welcome to CharityConnect, ${userName}! This is where you'll find your messages and notifications.`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a collection of initial messages for new users
 * @param userName The name of the user
 * @returns An array of message objects
 */
export function createInitialMessages(userName: string) {
  return [
    createWelcomeMessage(userName),
    {
      from: "CharityConnect Team",
      to: userName,
      message: "You can send and receive messages with other users through this platform.",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      from: "CharityConnect Team",
      to: userName,
      message: userName.toLowerCase().includes('charity') 
        ? "Create posts to share updates about your work with your followers."
        : "Follow charities you care about to stay updated with their work.",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
}

/**
 * Ensure message arrays exist and are properly initialized
 * This normalizes the message structure to ensure consistency
 * @param entity The entity (donor or charity) object to check
 * @returns The entity with a valid messages array
 */
export function ensureMessagesExist(entity: any) {
  if (!entity) return entity;
  
  // Initialize messages array if it doesn't exist
  if (!entity.messages) {
    entity.messages = [];
  }
  
  // If the array is empty, add welcome messages
  if (entity.messages.length === 0) {
    entity.messages = createInitialMessages(entity.name);
  }
  
  return entity;
}

/**
 * Format a message for display in the UI
 * @param message The raw message from the database
 * @returns The formatted message object
 */
export function formatMessage(message: any) {
  return {
    from: message.from,
    to: message.to,
    message: message.message || message.text,
    createdAt: message.createdAt || new Date(),
    updatedAt: message.updatedAt || new Date()
  };
}

/**
 * Create a notification message for following/unfollowing events
 * @param fromName The name of the user initiating the action
 * @param toName The name of the recipient
 * @param action The action (follow, unfollow, etc.)
 * @returns A message object
 */
export function createNotificationMessage(fromName: string, toName: string, action: 'follow' | 'unfollow') {
  const message = action === 'follow'
    ? `${fromName} is now following your charity.`
    : `${fromName} has unfollowed your charity.`;
    
  return {
    from: fromName,
    to: toName,
    message,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a direct message object that's compatible with both the Message model and embedded schema
 * @param fromEntity The sender entity (donor or charity)
 * @param toEntity The recipient entity (donor or charity)
 * @param messageText The message text
 * @returns A properly formatted message object
 */
export function createDirectMessage(fromEntity: any, toEntity: any, messageText: string) {
  const now = new Date();
  
  return {
    from: fromEntity.name,
    to: toEntity.name,
    message: messageText, // For embedded schema in donor/charity documents
    text: messageText,    // For Message collection documents
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Creates a properly formatted message request object for the API
 * Use this when sending direct messages between donors and charities
 * @param fromId Sender's ID
 * @param fromRole Sender's role ('donor' or 'charity')
 * @param toId Recipient's ID
 * @param toRole Recipient's role ('donor' or 'charity')
 * @param messageText The message content
 * @returns A properly formatted message request object
 */
export function createDirectMessageRequest(
  fromId: string,
  fromRole: string,
  toId: string,
  toRole: string,
  messageText: string
) {
  return {
    fromId: fromId,
    fromModel: fromRole === 'donor' ? 'Donor' : 'Charity',
    toId: toId,
    toModel: toRole === 'donor' ? 'Donor' : 'Charity',
    message: messageText
  };
} 