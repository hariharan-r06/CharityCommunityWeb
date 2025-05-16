import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  phone: string;
  address?: string;
  postsCount: number;
  messagesCount: number;
  followersCount: number;
  followingCount: number;
  
  // Charity specific fields
  charityId?: string;
  followers?: any[];
  posts?: number;
  paymentLinks?: any[];
  
  // Donor specific fields
  donorId?: string;
  following?: any[];
  donations?: any[];
}

export interface CharityProfile {
  _id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
  followers: string[];
  posts: any[];
  paymentLinks: any[];
  messages?: DirectMessage[];
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
    accountType?: string;
    accountHolderName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DonorProfile {
  _id: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  following: string[];
  donations: any[];
  messages?: DirectMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id?: string;
  _id?: string;
  from: string;
  to: string;
  message: string;
  author?: string;
  text?: string;
  timeAgo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  id?: string;
  _id?: string;
  text?: string;
  content?: string;
  image?: string;
  comments: number;
  commentsList?: PostComment[];
  likes: number;
  timeAgo?: string;
  createdAt?: string;
  updatedAt?: string;
  charity: {
    id?: string;
    name: string;
    email?: string;
    avatar?: string;
    verified?: boolean;
  };
}

export interface Message {
  _id?: string;
  from: string;
  fromModel: 'Donor' | 'Charity';
  to: string;
  toModel: 'Donor' | 'Charity';
  text: string;
  read: boolean;
  conversationId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  lastMessage: Message;
  otherParty: {
    id: string;
    model: 'Donor' | 'Charity';
    name: string;
    email: string;
  };
  unreadCount: number;
}

export interface DirectMessage {
  _id?: string;
  from: string;
  to: string;
  message: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createCharityProfile = async (data: { name: string; email: string; address: string; phone?: string; paymentLinks?: any[] }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/charity`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createDonorProfile = async (data: { name: string; email: string; address?: string; phone?: string }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/donor`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async (email: string): Promise<UserProfile> => {
  try {
    console.log(`Fetching user profile for email: ${email}`);
    const response = await axios.get(`${API_BASE_URL}/profile`, {
      params: { email }
    });
    console.log(`Profile data received:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching user profile for ${email}:`, error.response?.data || error.message);
    throw error;
  }
};

export const getCharityById = async (id: string): Promise<CharityProfile> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/charity/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getDonorById = async (id: string): Promise<DonorProfile> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/donor/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getCharityByEmail = async (email: string): Promise<CharityProfile> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/charity/email/${email}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getDonorByEmail = async (email: string): Promise<DonorProfile> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/donor/email/${email}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Post-related functions
export const createPost = async (charityId: string, data: { text: string; image?: string }): Promise<Post> => {
  try {
    // Add some basic validation on the client side
    if (data.image && data.image.length > 5 * 1024 * 1024) { // 5MB in characters
      throw new Error('Image size is too large. Please use a smaller image (less than 5MB).');
    }
    
    console.log(`Sending post with ${data.text.length} characters of text and ${data.image ? Math.round(data.image.length / 1024) : 0}KB of image data`);
    
    // Use a longer timeout for large uploads
    const response = await axios.post(
      `${API_BASE_URL}/charity/${charityId}/posts`, 
      data, 
      { timeout: 60000 } // 60 second timeout
    );
    
    return response.data.data;
  } catch (error: any) {
    console.error("Error in createPost:", error.message);
    if (error.response) {
      console.error("Server response:", error.response.status, error.response.data);
    }
    throw error;
  }
};

export const getCharityPosts = async (charityId: string): Promise<Post[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/charity/${charityId}/posts`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getPost = async (charityId: string, postId: string): Promise<Post> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/charity/${charityId}/posts/${postId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const addComment = async (charityId: string, postId: string, commentData: { from: string; to: string; message: string }): Promise<PostComment> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/charity/${charityId}/posts/${postId}/comments`, commentData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getFeed = async (): Promise<Post[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/feed`);
    
    // Process the posts to add timeAgo and ensure proper structure
    const posts = response.data.data.map((post: any) => {
      // Handle comments array vs count
      let commentsList = [];
      let commentsCount = 0;
      
      if (Array.isArray(post.comments)) {
        commentsList = post.comments;
        commentsCount = post.comments.length;
      } else {
        commentsCount = post.comments || 0;
      }
      
      // Ensure charity object has required fields
      const charity = {
        id: post.charity?.id || post._id,
        name: post.charity?.name || "Unknown Charity",
        avatar: post.charity?.avatar || "/placeholder.svg",
        verified: post.charity?.verified !== undefined ? post.charity.verified : true
      };
      
      return {
        ...post,
        charity,
        comments: commentsCount,
        commentsList: commentsList,
        likes: post.likes || 0,
        timeAgo: getTimeAgo(new Date(post.createdAt))
      };
    });
    
    return posts;
  } catch (error) {
    console.error('Error fetching feed:', error);
    throw error;
  }
};

// Helper function to format timeAgo
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y ago`;
}

// Function to like a post (mock implementation for now)
export const likePost = async (charityId: string, postId: string, userEmail: string): Promise<{ likes: number; liked: boolean }> => {
  try {
    // This is a mock implementation
    // In a real implementation, you would send a request to the server
    return { likes: Math.floor(Math.random() * 200) + 1, liked: true };
  } catch (error) {
    throw error;
  }
};

export const getAllCharities = async (): Promise<CharityProfile[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/charities`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Message-related functions
export const sendMessage = async (data: {
  from: string;
  fromModel: 'Donor' | 'Charity';
  to: string;
  toModel: 'Donor' | 'Charity';
  text: string;
}): Promise<Message> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/messages`, data);
    return response.data.data;
  } catch (error) {
    // If we get a 404, try the direct message endpoint instead
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('Regular message endpoint failed with 404, trying direct message endpoint');
      try {
        // Convert the data format to direct message format
        const directData = {
          fromId: data.from,
          fromModel: data.fromModel,
          toId: data.to,
          toModel: data.toModel,
          message: data.text
        };
        
        const directResponse = await axios.post(`${API_BASE_URL}/messages/direct`, directData);
        
        // Convert the response to match the Message interface
        return {
          _id: 'generated_' + Date.now(),
          from: data.from,
          fromModel: data.fromModel,
          to: data.to,
          toModel: data.toModel,
          text: data.text,
          read: false,
          conversationId: `${data.from}_${data.to}`,
          createdAt: new Date().toISOString()
        };
      } catch (directError) {
        console.error('Error with direct message endpoint:', directError);
        throw directError;
      }
    }
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getConversation = async (id1: string, id2: string): Promise<Message[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/messages/conversation/${id1}/${id2}`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
};

export const getConversations = async (id: string, role: 'Donor' | 'Charity'): Promise<Conversation[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/messages/conversations/${id}/${role}`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
};

export const markMessagesAsRead = async (conversationId: string, recipientId: string): Promise<{ modifiedCount: number }> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/messages/read/${conversationId}/${recipientId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Direct message API functions
export const sendDirectMessage = async (data: {
  fromId: string;
  fromModel: 'Donor' | 'Charity';
  toId: string;
  toModel: 'Donor' | 'Charity';
  message: string;
}): Promise<{ from: string; to: string; message: string; timestamp: string }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/messages/direct`, data);
    return response.data.data;
  } catch (error) {
    console.error('Error sending direct message:', error);
    throw error;
  }
};

export const getDirectMessages = async (id: string, model: 'Donor' | 'Charity'): Promise<DirectMessage[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/messages/direct/${id}/${model}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    throw error;
  }
};

// Updated follow function to handle automatic welcome message
export const followCharity = async (donorId: string, charityId: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/donor/${donorId}/follow/${charityId}`);
    return response.data;
  } catch (error) {
    console.error("Error following charity:", error);
    throw error;
  }
};

// Updated unfollow function
export const unfollowCharity = async (donorId: string, charityId: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/donor/${donorId}/unfollow/${charityId}`);
    return response.data;
  } catch (error) {
    console.error("Error unfollowing charity:", error);
    throw error;
  }
};

export const getDonorFeed = async (donorId: string): Promise<Post[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/donor/${donorId}/feed`);
    
    // Process the posts to add timeAgo
    const posts = response.data.data.map((post: any) => {
      return {
        ...post,
        timeAgo: getTimeAgo(new Date(post.createdAt))
      };
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting donor feed:', error);
    throw error;
  }
};

// User profile-related API functions
export const createUserProfile = async (data: {
  name: string;
  email: string;
  phone: string;
  role: 'donor' | 'charity';
  address?: string;
}): Promise<UserProfile> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/profile`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Add initialization functions

// Initialize messages for a donor
export const initializeDonorMessages = async (donorId: string): Promise<DirectMessage[]> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/donor/${donorId}/messages/init`);
    return response.data.data;
  } catch (error) {
    console.error('Error initializing donor messages:', error);
    throw error;
  }
};

// Initialize messages for a charity
export const initializeCharityMessages = async (charityId: string): Promise<DirectMessage[]> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/charity/${charityId}/messages/init`);
    return response.data.data;
  } catch (error) {
    console.error('Error initializing charity messages:', error);
    throw error;
  }
};

export const getCharityPaymentDetails = async (charityId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/charity/${charityId}`);
    const charityData = response.data.data;
    
    // Extract the payment links, specifically GPay number if available
    let gpayNumber = null;
    
    if (charityData.paymentLinks && charityData.paymentLinks.length > 0) {
      // Find the first payment link with a gpayNo
      const gpayLink = charityData.paymentLinks.find(link => link.gpayNo);
      if (gpayLink) {
        gpayNumber = gpayLink.gpayNo;
      }
    }
    
    return {
      name: charityData.name,
      gpayNumber,
      paymentLinks: charityData.paymentLinks || []
    };
  } catch (error) {
    console.error("Error fetching charity payment details:", error);
    throw error;
  }
};

export const updateCharityProfile = async (
  charityId: string, 
  data: {
    name: string;
    email: string;
    address: string;
    phone?: string;
    paymentLinks?: {
      gpayNo?: string;
      razorpay?: string;
    }[];
    bankDetails?: {
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
      branch?: string;
      accountType?: string;
      accountHolderName?: string;
    };
  }
): Promise<CharityProfile> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/charity/${charityId}`, data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}; 