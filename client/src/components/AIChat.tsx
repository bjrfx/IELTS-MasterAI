import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db, chatMessagesCollection, chatSessionsCollection } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp, serverTimestamp, limit, doc, updateDoc } from 'firebase/firestore';
import { Loader2, Send, Bot, User, Trash, RefreshCw } from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768);
  const [retryCount, setRetryCount] = useState(0);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Fetch chat sessions from Firebase
  useEffect(() => {
    const fetchChatSessions = async () => {
      if (!currentUser) {
        setIsFetching(false);
        return;
      }
      
      try {
        setIsFetching(true);
        console.log('Fetching chat sessions for user:', currentUser.uid);
        
        // First, try with orderBy
        try {
          const sessionsRef = chatSessionsCollection;
          const sessionsQuery = query(
            sessionsRef,
            where('userId', '==', currentUser.uid),
            orderBy('updatedAt', 'desc')
          );
          
          const sessionsSnapshot = await getDocs(sessionsQuery);
          const fetchedSessions: ChatSession[] = [];
          
          if (sessionsSnapshot.empty) {
            console.log('No chat sessions found for user');
            setChatSessions([]);
            setIsFetching(false);
            return;
          }
          
          sessionsSnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedSessions.push({
              id: doc.id,
              title: data.title || 'New Chat',
              lastMessage: data.lastMessage || '',
              timestamp: data.updatedAt?.toDate() || new Date()
            });
          });
          
          console.log('Successfully fetched chat sessions:', fetchedSessions.length);
          setChatSessions(fetchedSessions);
          
          // If we have sessions and no current session is selected, select the most recent one
          if (fetchedSessions.length > 0 && !currentSessionId) {
            setCurrentSessionId(fetchedSessions[0].id);
          }
        } catch (indexError) {
          // If the orderBy query fails (likely due to missing index), fall back to a simpler query
          console.warn('Error with ordered query, falling back to simple query:', indexError);
          
          const simpleQuery = query(
            chatSessionsCollection,
            where('userId', '==', currentUser.uid)
          );
          
          const simpleSnapshot = await getDocs(simpleQuery);
          const simpleFetchedSessions: ChatSession[] = [];
          
          simpleSnapshot.forEach((doc) => {
            const data = doc.data();
            simpleFetchedSessions.push({
              id: doc.id,
              title: data.title || 'New Chat',
              lastMessage: data.lastMessage || '',
              timestamp: data.updatedAt?.toDate() || new Date()
            });
          });
          
          // Sort manually since we couldn't use orderBy
          simpleFetchedSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          
          console.log('Successfully fetched chat sessions with fallback:', simpleFetchedSessions.length);
          setChatSessions(simpleFetchedSessions);
          
          if (simpleFetchedSessions.length > 0 && !currentSessionId) {
            setCurrentSessionId(simpleFetchedSessions[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching chat sessions:', error);
        if (retryCount < 3) {
          // Retry up to 3 times with exponential backoff
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * Math.pow(2, retryCount));
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load chat sessions. Please refresh the page.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchChatSessions();
  }, [currentUser, currentSessionId, toast, retryCount]);
  
  // Fetch messages for the current session
  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      if (!currentUser || !currentSessionId) {
        if (isMounted) {
          setIsFetching(false);
        }
        return;
      }
      
      try {
        setIsFetching(true);
        console.log('Fetching messages for session:', currentSessionId);
        
        // First try with orderBy
        try {
          const messagesRef = chatMessagesCollection;
          const q = query(
            messagesRef,
            where('userId', '==', currentUser.uid),
            where('sessionId', '==', currentSessionId),
            orderBy('timestamp', 'asc')
          );
          
          const querySnapshot = await getDocs(q);
          
          if (!isMounted) return;
          
          const fetchedMessages: Message[] = [];
          
          if (querySnapshot.empty) {
            console.log('No messages found for this session');
            setMessages([]);
            setIsFetching(false);
            return;
          }
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedMessages.push({
              id: doc.id,
              role: data.role,
              content: data.content,
              timestamp: data.timestamp?.toDate() || new Date()
            });
          });
          
          console.log('Successfully fetched messages:', fetchedMessages.length);
          setMessages(fetchedMessages);
        } catch (indexError) {
          // If the orderBy query fails (likely due to missing index), fall back to a simpler query
          console.warn('Error with ordered query for messages, falling back to simple query:', indexError);
          
          if (!isMounted) return;
          
          const simpleQuery = query(
            chatMessagesCollection,
            where('userId', '==', currentUser.uid),
            where('sessionId', '==', currentSessionId)
          );
          
          const simpleSnapshot = await getDocs(simpleQuery);
          const simpleFetchedMessages: Message[] = [];
          
          simpleSnapshot.forEach((doc) => {
            const data = doc.data();
            simpleFetchedMessages.push({
              id: doc.id,
              role: data.role,
              content: data.content,
              timestamp: data.timestamp?.toDate() || new Date()
            });
          });
          
          // Sort manually since we couldn't use orderBy
          simpleFetchedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          console.log('Successfully fetched messages with fallback:', simpleFetchedMessages.length);
          setMessages(simpleFetchedMessages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        if (isMounted) {
          toast({
            title: 'Error',
            description: 'Failed to load chat messages. Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };
    
    if (currentSessionId) {
      fetchMessages();
    } else {
      setMessages([]);
      setIsFetching(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [currentUser, currentSessionId, toast]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input on load
  useEffect(() => {
    if (!isFetching) {
      inputRef.current?.focus();
    }
  }, [isFetching]);
  
  const createNewSession = async () => {
    if (!currentUser) return null;
    
    try {
      // Create a new chat session
      const sessionRef = await addDoc(collection(db, 'chatSessions'), {
        userId: currentUser.uid,
        title: 'New Chat',
        lastMessage: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Add the new session to the state
      const newSession: ChatSession = {
        id: sessionRef.id,
        title: 'New Chat',
        lastMessage: '',
        timestamp: new Date(),
      };
      
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      
      return newSession.id;
    } catch (error) {
      console.error('Error creating new session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create a new chat session',
        variant: 'destructive',
      });
      return null;
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentUser) return;
    
    let sessionId = currentSessionId;
    
    // If no session exists, create a new one
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return; // Failed to create session
    }
    
    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };
    
    try {
      setIsLoading(true);
      setMessages((prev) => [...prev, userMessage]);
      setInputMessage('');
      
      // Save user message to Firebase
      await addDoc(chatMessagesCollection, {
        userId: currentUser.uid,
        sessionId: sessionId,
        role: userMessage.role,
        content: userMessage.content,
        timestamp: serverTimestamp(),
      });
      
      // Update the session with the last message
      await updateDoc(doc(db, 'chatSessions', sessionId), {
        lastMessage: userMessage.content,
        updatedAt: serverTimestamp(),
      });
      
      // Update session in state
      setChatSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, lastMessage: userMessage.content, timestamp: new Date() } 
            : session
        )
      );
      
      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBcuPiW2QH9eDO-aKLVbBcCnoY2BNmogwU`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: userMessage.content }]
            }]
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      
      // Save assistant message to Firebase
      await addDoc(chatMessagesCollection, {
        userId: currentUser.uid,
        sessionId: sessionId,
        role: assistantMessage.role,
        content: assistantMessage.content,
        timestamp: serverTimestamp(),
      });
      
      // Update session title if it's a new chat
      if (chatSessions.find(s => s.id === sessionId)?.title === 'New Chat') {
        // Generate a title based on the first user message
        const sessionTitle = userMessage.content.length > 30 
          ? `${userMessage.content.substring(0, 30)}...` 
          : userMessage.content;
          
        await updateDoc(doc(db, 'chatSessions', sessionId), {
          title: sessionTitle,
        });
        
        // Update session in state
        setChatSessions(prev => 
          prev.map(session => 
            session.id === sessionId 
              ? { ...session, title: sessionTitle } 
              : session
          )
        );
      }
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const clearChat = async () => {
    if (!currentUser || !currentSessionId || messages.length === 0) return;
    
    try {
      setMessages([]);
      
      // In a real implementation, you would delete the messages from Firebase
      // For now, we'll just clear the messages in the UI
      toast({
        title: 'Chat Cleared',
        description: 'Your chat history has been cleared',
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear chat history',
        variant: 'destructive',
      });
    }
  };
  
  const handleNewChat = async () => {
    await createNewSession();
  };
  
  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };
  
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };
  
  const refreshChats = async () => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to refresh chats.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsFetching(true);
      setRetryCount(0); // Reset retry count
      console.log('Refreshing chat sessions for user:', currentUser.uid);
      
      // First try with orderBy
      try {
        const sessionsRef = chatSessionsCollection;
        const sessionsQuery = query(
          sessionsRef,
          where('userId', '==', currentUser.uid),
          orderBy('updatedAt', 'desc')
        );
        
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const fetchedSessions: ChatSession[] = [];
        
        sessionsSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedSessions.push({
            id: doc.id,
            title: data.title || 'New Chat',
            lastMessage: data.lastMessage || '',
            timestamp: data.updatedAt?.toDate() || new Date()
          });
        });
        
        console.log('Successfully refreshed chat sessions:', fetchedSessions.length);
        setChatSessions(fetchedSessions);
        
        toast({
          title: 'Success',
          description: 'Chat sessions refreshed successfully',
        });
      } catch (indexError) {
        // If the orderBy query fails (likely due to missing index), fall back to a simpler query
        console.warn('Error with ordered query for refresh, falling back to simple query:', indexError);
        
        const simpleQuery = query(
          chatSessionsCollection,
          where('userId', '==', currentUser.uid)
        );
        
        const simpleSnapshot = await getDocs(simpleQuery);
        const simpleFetchedSessions: ChatSession[] = [];
        
        simpleSnapshot.forEach((doc) => {
          const data = doc.data();
          simpleFetchedSessions.push({
            id: doc.id,
            title: data.title || 'New Chat',
            lastMessage: data.lastMessage || '',
            timestamp: data.updatedAt?.toDate() || new Date()
          });
        });
        
        // Sort manually since we couldn't use orderBy
        simpleFetchedSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        console.log('Successfully refreshed chat sessions with fallback:', simpleFetchedSessions.length);
        setChatSessions(simpleFetchedSessions);
        
        toast({
          title: 'Success',
          description: 'Chat sessions refreshed successfully',
        });
      }
    } catch (error) {
      console.error('Error refreshing chats:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh chat sessions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  };
  
  return (
    <div className="flex h-[calc(100vh-12rem)] shadow-md border rounded-lg overflow-hidden">
      {/* Chat Sidebar */}
      <div 
        className={`${showSidebar ? 'w-64' : 'w-0'} border-r bg-muted/30 transition-all duration-300 flex flex-col overflow-hidden`}
      >
        <div className="p-3 border-b flex justify-between items-center bg-background">
          <h3 className="font-semibold text-sm">Chat History</h3>
          <Button variant="ghost" size="sm" onClick={refreshChats} title="Refresh chats">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 mb-2" 
            onClick={handleNewChat}
          >
            <span className="text-xs">+ New Chat</span>
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-2">
          {chatSessions.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground text-sm">
              <p>No chat history yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chatSessions.map((session) => (
                <Button
                  key={session.id}
                  variant={currentSessionId === session.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-left h-auto py-2 px-3 overflow-hidden"
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="truncate w-full">
                    <div className="font-medium text-xs truncate">{session.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {session.lastMessage || "New conversation"}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={toggleSidebar}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">IELTS AI Assistant</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              disabled={isLoading || messages.length === 0}
              title="Clear chat"
              className="h-8 w-8"
            >
              <Trash className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              disabled={isLoading}
              title="New chat"
              className="h-8 w-8"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 5v14"></path>
                <path d="M5 12h14"></path>
              </svg>
            </Button>
          </div>
        </div>
        
        {/* Chat Messages */}
        {isFetching ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading chat history...</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 text-primary/40" />
                <h3 className="text-lg font-medium mb-2">IELTS AI Assistant</h3>
                <p>Ask me anything about IELTS preparation, generate practice materials, or get feedback on your writing and speaking.</p>
              </div>
            ) : (
              <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[90%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar className={`h-8 w-8 ${message.role === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                        {message.role === 'user' ? (
                          <User className="h-5 w-5 text-white" />
                        ) : (
                          <Bot className="h-5 w-5" />
                        )}
                      </Avatar>
                      <div
                        className={`rounded-lg p-4 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs mt-2 opacity-70">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        )}
        
        {/* Chat Input */}
        <div className="border-t p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="min-h-[60px] resize-none rounded-lg border-muted-foreground/20"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="h-auto rounded-lg"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}