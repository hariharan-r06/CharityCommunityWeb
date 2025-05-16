"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Send, Paperclip, CheckCircle, User, MessageSquare, Plus } from "lucide-react"
import { auth } from "@/app/firebase"
import { 
  getUserProfile, 
  getConversations, 
  getConversation, 
  sendMessage, 
  markMessagesAsRead,
  getCharityById,
  getDonorById,
  getAllCharities,
  Conversation,
  Message,
  CharityProfile
} from "@/services/apiService"
import { getTimeAgo } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from "axios"

// Add a SimpleMessage component for more consistent rendering
interface SimpleMessageProps {
  text: string;
  isSent: boolean;
  time?: string;
}

const SimpleMessage: React.FC<SimpleMessageProps> = ({ text, isSent, time }) => {
  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-lg ${
          isSent
            ? 'bg-teal-600 text-white rounded-br-none'
            : 'bg-muted rounded-bl-none'
        }`}
      >
        <p>{text}</p>
        {time && (
          <p className={`text-xs mt-1 ${isSent ? 'text-teal-100' : 'text-muted-foreground'}`}>
            {time}
          </p>
        )}
      </div>
    </div>
  );
};

export default function MessagesPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [sendingMessage, setSendingMessage] = useState(false)
  const [allCharities, setAllCharities] = useState<CharityProfile[]>([])
  const [filteredCharities, setFilteredCharities] = useState<CharityProfile[]>([])
  const [activeTab, setActiveTab] = useState("conversations")
  const [selectedCharity, setSelectedCharity] = useState<CharityProfile | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const messageEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setMounted(true)
    
    // Check if userId is available
    if (!userId) {
      // If no ID in URL, we'll need to fetch from Firebase auth
      const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
        if (authUser) {
          try {
            // Get user profile to determine role and ID
            const userProfile = await getUserProfile(authUser.email || "");
            const id = userProfile.donorId || userProfile.charityId;
            
            // Redirect to the proper URL with ID
            if (id) {
              router.replace(`/messages/${id}`);
            }
            
            setUser({
              ...userProfile,
              id,
              role: userProfile.role
            });
            setLoading(false);
          } catch (error) {
            console.error("Error fetching user profile:", error);
            setLoading(false);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      });
      
      return () => unsubscribe();
    } else {
      // We have a userId in params, fetch the user data directly
      const fetchUserData = async () => {
        try {
          // Try both donor and charity endpoints to determine the type
          try {
            const donorData = await getDonorById(userId);
            if (donorData) {
              setUser({
                ...donorData,
                id: userId,
                role: 'donor'
              });
              setLoading(false);
              return;
            }
          } catch (error) {
            // Not a donor, try charity
          }
          
          try {
            const charityData = await getCharityById(userId);
            if (charityData) {
              setUser({
                ...charityData,
                id: userId,
                role: 'charity'
              });
              setLoading(false);
              return;
            }
          } catch (error) {
            // Not a charity either
          }
          
          // If we get here, we couldn't find the user
          setLoading(false);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setLoading(false);
        }
      };
      
      fetchUserData();
    }
  }, [userId, router]);

  // Fetch conversations when user is loaded
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user || !user.id || !user.role) return;
      
      try {
        const conversationsData = await getConversations(user.id, user.role);
        setConversations(conversationsData);
        setFilteredConversations(conversationsData);
        
        // Set active conversation to the first one if available
        if (conversationsData.length > 0 && !activeConversation) {
          setActiveConversation(conversationsData[0]);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };
    
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Fetch messages for active conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation || !user) return;
      
      try {
        // Mark messages as read
        await markMessagesAsRead(activeConversation.id, user.id);
        
        // Get messages for this conversation
        const messagesData = await getConversation(
          activeConversation.otherParty.id,
          user.id
        );
        setMessages(messagesData);
        
        // Update unread count in the active conversation
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === activeConversation.id 
              ? { ...conv, unreadCount: 0 } 
              : conv
          )
        );

        // Also update filtered conversations
        setFilteredConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === activeConversation.id 
              ? { ...conv, unreadCount: 0 } 
              : conv
          )
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    
    if (activeConversation) {
      fetchMessages();
    }
  }, [activeConversation, user]);

  // Filter conversations based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = conversations.filter(conversation => 
        conversation.otherParty.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  // Fetch all charities when user is a donor
  useEffect(() => {
    const fetchAllCharities = async () => {
      if (!user || user.role !== 'donor') return;
      
      try {
        const charitiesData = await getAllCharities();
        setAllCharities(charitiesData);
        setFilteredCharities(charitiesData);
      } catch (error) {
        console.error("Error fetching all charities:", error);
      }
    };
    
    if (user && user.role === 'donor') {
      fetchAllCharities();
    }
  }, [user]);

  // Filter charities based on search query
  useEffect(() => {
    if (!allCharities.length) return;
    
    if (searchQuery) {
      const filtered = allCharities.filter(charity => 
        charity.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCharities(filtered);
    } else {
      setFilteredCharities(allCharities);
    }
  }, [searchQuery, allCharities]);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !user) {
      setStatusMessage({ type: 'error', text: 'Please enter a message first' });
      return;
    }
    
    // Check if we have a conversation or a selected charity
    if (!activeConversation && !selectedCharity) {
      console.error('Cannot send message: No active conversation or selected charity');
      setStatusMessage({ type: 'error', text: 'Please select a recipient first' });
      return;
    }
    
    console.log('Sending message:', messageText);
    setStatusMessage({ type: 'success', text: 'Sending message...' });
    setSendingMessage(true);
    
    try {
      // Determine recipient info
      const recipientId = activeConversation 
        ? activeConversation.otherParty.id 
        : (selectedCharity ? selectedCharity._id : '');
        
      const recipientModel = activeConversation 
        ? activeConversation.otherParty.model 
        : 'Charity';
      
      console.log('Message recipient:', recipientId, recipientModel);
      console.log('Message sender:', user.id, user.role);
      
      // Handle missing IDs or models
      if (!recipientId) {
        throw new Error('Recipient ID is missing');
      }
      
      if (!user.id) {
        throw new Error('Sender ID is missing');
      }
      
      const fromModel = user.role === 'donor' ? 'Donor' : 'Charity';
      
      // Print full message data for debugging
      const messageData = {
        from: user.id,
        fromModel: fromModel as 'Donor' | 'Charity',
        to: recipientId,
        toModel: recipientModel as 'Donor' | 'Charity',
        text: messageText
      };
      
      console.log('Full message data:', JSON.stringify(messageData, null, 2));
      
      // Try to use direct message format if needed (for faster debugging)
      try {
        // Send the message
        const newMessage = await sendMessage(messageData);
        
        console.log('Message sent successfully:', newMessage);
        setStatusMessage({ type: 'success', text: 'Message sent!' });
        
        // If this was a temporary conversation, we should update it with real data
        if (activeConversation && activeConversation.id.startsWith('temp_')) {
          console.log('Updating temporary conversation with real data');
          const updatedConversation: Conversation = {
            id: newMessage.conversationId,
            lastMessage: newMessage,
            otherParty: {
              id: recipientId,
              model: recipientModel,
              name: activeConversation.otherParty.name,
              email: activeConversation.otherParty.email
            },
            unreadCount: 0
          };
          
          setActiveConversation(updatedConversation);
          
          // Add this conversation to the list
          setConversations(prev => [updatedConversation, ...prev]);
          setFilteredConversations(prev => [updatedConversation, ...prev]);
        } else if (activeConversation) {
          console.log('Updating existing conversation:', activeConversation.id);
          // Update conversations with new last message
          setConversations(prevConversations => 
            prevConversations.map(conv => 
              conv.id === activeConversation.id 
                ? { ...conv, lastMessage: newMessage } 
                : conv
            )
          );
          
          // Also update filtered conversations
          setFilteredConversations(prevConversations => 
            prevConversations.map(conv => 
              conv.id === activeConversation.id 
                ? { ...conv, lastMessage: newMessage } 
                : conv
            )
          );
        }
        
        // Update messages
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        // Clear input
        setMessageText("");
        
        // Clear status message after a short delay
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      } catch (error) {
        console.error("Error sending message:", error);
        
        // Show detailed error for debugging
        if (axios.isAxiosError(error)) {
          console.error("API Error details:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
          
          setStatusMessage({ 
            type: 'error', 
            text: `Failed to send message: ${error.response?.status} - ${error.response?.data?.message || error.message}` 
          });
        } else {
          setStatusMessage({ 
            type: 'error', 
            text: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}` 
          });
        }
      }
      
    } catch (error) {
      console.error("Error preparing message:", error);
      setStatusMessage({ 
        type: 'error', 
        text: `Failed to prepare message: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    
    // Ensure messages are loaded for this conversation
    try {
      // Mark messages as read
      await markMessagesAsRead(conversation.id, user.id);
      
      // Get messages for this conversation
      const messagesData = await getConversation(
        conversation.otherParty.id,
        user.id
      );
      setMessages(messagesData);
      
      // Update unread count in the active conversation
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
      
      // Also update filtered conversations
      setFilteredConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
    } catch (error) {
      console.error("Error loading messages for conversation:", error);
      // Initialize with empty array if we can't fetch messages
      setMessages([]);
    }
  };

  const startNewConversation = async (charity: CharityProfile) => {
    if (!user) return;
    
    // Check if conversation already exists
    const existingConversation = conversations.find(conv => 
      conv.otherParty.id === charity._id
    );
    
    if (existingConversation) {
      setActiveConversation(existingConversation);
      setActiveTab("conversations");
      
      // Fetch messages for this conversation
      try {
        const messagesData = await getConversation(charity._id, user.id);
        setMessages(messagesData);
      } catch (error) {
        console.error("Error fetching conversation messages:", error);
        // Initialize with empty array if we can't fetch messages
        setMessages([]);
      }
      return;
    }
    
    // Send an initial message to start the conversation
    try {
      setSendingMessage(true);
      
      const initialMessage = await sendMessage({
        from: user.id,
        fromModel: 'Donor',
        to: charity._id,
        toModel: 'Charity',
        text: `Hello ${charity.name}, I'd like to connect with you.`
      });
      
      // Create a new conversation object
      const newConversation: Conversation = {
        id: initialMessage.conversationId,
        lastMessage: initialMessage,
        otherParty: {
          id: charity._id,
          model: 'Charity',
          name: charity.name,
          email: charity.email
        },
        unreadCount: 0
      };
      
      // Add to conversations and set as active
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(newConversation);
      setMessages([initialMessage]);
      setActiveTab("conversations");
    } catch (error) {
      console.error("Error starting new conversation:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle when a charity is selected from the list
  const handleCharitySelect = (charity: CharityProfile) => {
    console.log('Charity selected:', charity.name, charity._id);
    setSelectedCharity(charity);
    
    // Try to find an existing conversation
    const existingConversation = conversations.find(conv => 
      conv.otherParty.id === charity._id
    );
    
    if (existingConversation) {
      console.log('Found existing conversation:', existingConversation.id);
      setActiveConversation(existingConversation);
      handleConversationSelect(existingConversation);
    } else {
      console.log('Creating temporary conversation for:', charity.name);
      // Create a simple conversation object for the UI
      const newConversation: Conversation = {
        id: `temp_${user.id}_${charity._id}`,
        lastMessage: {
          _id: 'temp',
          from: user.id,
          fromModel: user.role === 'donor' ? 'Donor' : 'Charity',
          to: charity._id,
          toModel: 'Charity',
          text: '',
          read: true,
          conversationId: `temp_${user.id}_${charity._id}`
        },
        otherParty: {
          id: charity._id,
          model: 'Charity',
          name: charity.name,
          email: charity.email
        },
        unreadCount: 0
      };
      
      setActiveConversation(newConversation);
      setMessages([]);
    }
    
    setActiveTab("conversations");
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav role={user?.role || "donor"} />
        <div className="container flex-1 p-4 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin"></div>
          <p className="ml-2">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav role="donor" />
        <div className="container flex-1 p-4 flex flex-col items-center justify-center">
          <p className="text-lg mb-4">Please log in to view your messages</p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav role={user.role} />
      <div className="container flex-1 p-0 md:p-4">
        <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row border rounded-lg overflow-hidden">
          {/* Contacts Sidebar */}
          <div className="w-full md:w-80 border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {user && user.role === 'donor' ? (
              <Tabs defaultValue="conversations" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <div className="px-4 pt-2">
                  <TabsList className="w-full">
                    <TabsTrigger value="conversations" className="flex-1">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Messages
                    </TabsTrigger>
                    <TabsTrigger value="charities" className="flex-1">
                      <User className="h-4 w-4 mr-2" />
                      Charities
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="conversations" className="mt-0 h-[calc(100vh-10rem)]">
                  <ScrollArea className="flex-1 h-full">
                    {filteredConversations.length > 0 ? (
                      filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${
                            activeConversation?.id === conversation.id ? "bg-muted" : ""
                          }`}
                          onClick={() => handleConversationSelect(conversation)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg" alt={conversation.otherParty.name} />
                            <AvatarFallback>{conversation.otherParty.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="font-medium truncate pr-1">{conversation.otherParty.name}</span>
                                {conversation.otherParty.model === 'Charity' && (
                                  <CheckCircle className="h-4 w-4 text-teal-600 fill-white flex-shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {conversation.lastMessage.createdAt 
                                  ? getTimeAgo(new Date(conversation.lastMessage.createdAt)) 
                                  : ''}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage.text}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <span className="ml-2 flex-shrink-0 h-5 w-5 bg-teal-600 text-white rounded-full text-xs flex items-center justify-center">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        <p>No conversations yet</p>
                        <p className="text-sm mt-1">
                          Start a conversation with a charity by visiting the Charities tab
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="charities" className="mt-0 h-[calc(100vh-10rem)]">
                  <ScrollArea className="flex-1 h-full">
                    {filteredCharities.length > 0 ? (
                      filteredCharities.map((charity) => (
                        <div
                          key={charity._id}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => handleCharitySelect(charity)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg" alt={charity.name} />
                            <AvatarFallback>{charity.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <span className="font-medium truncate pr-1">{charity.name}</span>
                              <CheckCircle className="h-4 w-4 text-teal-600 fill-white flex-shrink-0" />
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {charity.address}
                            </p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        <p>No charities found</p>
                        <p className="text-sm mt-1">
                          Try adjusting your search query
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <ScrollArea className="flex-1">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${
                        activeConversation?.id === conversation.id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleConversationSelect(conversation)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg" alt={conversation.otherParty.name} />
                        <AvatarFallback>{conversation.otherParty.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="font-medium truncate pr-1">{conversation.otherParty.name}</span>
                            {conversation.otherParty.model === 'Charity' && (
                              <CheckCircle className="h-4 w-4 text-teal-600 fill-white flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {conversation.lastMessage.createdAt 
                              ? getTimeAgo(new Date(conversation.lastMessage.createdAt)) 
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.text}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="ml-2 flex-shrink-0 h-5 w-5 bg-teal-600 text-white rounded-full text-xs flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">
                      {user?.role === 'donor' 
                        ? 'Follow charities to start messaging' 
                        : 'Donors will appear here when they message you'}
                    </p>
                  </div>
                )}
              </ScrollArea>
            )}
          </div>

          {/* Chat Area */}
          {activeConversation || selectedCharity ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src="/placeholder.svg" 
                      alt={activeConversation ? activeConversation.otherParty.name : (selectedCharity ? selectedCharity.name : '')} 
                    />
                    <AvatarFallback>
                      {activeConversation ? activeConversation.otherParty.name[0] : (selectedCharity ? selectedCharity.name[0] : '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center">
                      <h2 className="font-semibold">
                        {activeConversation ? activeConversation.otherParty.name : (selectedCharity ? selectedCharity.name : '')}
                      </h2>
                      <CheckCircle className="h-4 w-4 text-teal-600 fill-white ml-1 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Charity
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message) => {
                      const isSentByUser = message.from === user.id;
                      // Handle both text field (from Message model) and message field (from embedded schema)
                      const messageText = message.text || (message as any).message || '';
                      const time = message.createdAt ? getTimeAgo(new Date(message.createdAt)) : '';
                      return (
                        <SimpleMessage
                          key={message._id}
                          text={messageText}
                          isSent={isSentByUser}
                          time={time}
                        />
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeConversation?.id.startsWith('temp_') || (selectedCharity && !activeConversation)
                          ? 'Type your first message below to start the conversation'
                          : 'Start the conversation by sending a message below'}
                      </p>
                    </div>
                  )}
                  
                  {/* Show loading indicator when sending */}
                  {sendingMessage && (
                    <SimpleMessage
                      text="Sending..."
                      isSent={true}
                    />
                  )}
                  
                  {/* This empty div helps us scroll to the bottom */}
                  <div ref={messageEndRef} />
                </div>
              </ScrollArea>
              
              {/* Message Input - Always show this */}
              <div className="border-t p-4">
                {statusMessage && (
                  <div className={`mb-2 p-2 text-sm rounded-md ${
                    statusMessage.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {statusMessage.text}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1"
                    disabled={sendingMessage}
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!messageText.trim() || sendingMessage}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Select a conversation</h3>
              <p className="text-muted-foreground mt-1">
                {user?.role === 'donor' 
                  ? 'Choose a charity to start messaging or find new charities in the Charities tab.' 
                  : 'Select a donor to view your conversation.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 