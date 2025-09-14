'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Minimize2, Send } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StreamParser } from '@/lib/streaming';
import { useCandidatesStore, useChatStore, useUIStore } from '@/store';

export default function ChatPanel() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Store state
  const { setRankedIds, setLoading, setHasSearched } = useCandidatesStore();
  const {
    messages,
    input,
    isLoading,
    setInput,
    setLoading: setChatLoading,
    addMessage,
    updateMessage,
    startNewSession,
    addPhaseToSession,
    completeSession,
  } = useChatStore();
  const { isChatExpanded, setChatExpanded } = useUIStore();

  // Rotating suggestions
  const suggestions = [
    'React developers with 5+ years experience',
    'All engineers with 5+ years experience',
    'Mobile developers show least salary expectation first',
    'Backend engineers in Germany, most experience first.',
    'Backend engineers in the US',
    'Engineers in Nigeria with 2+ years experience',
  ];

  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);

  // Rotate suggestions every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestionIndex(prevIndex => (prevIndex + 1) % suggestions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [suggestions.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle chat expansion
  const handleExpand = () => {
    setChatExpanded(true);
  };

  // Check network connectivity
  const checkNetworkConnection = async (): Promise<boolean> => {
    if (!navigator.onLine) {
      toast.error('You are not connected to the internet', {
        description: 'Please check your network connection and try again.',
        duration: 4000,
      });
      return false;
    }

    // Additional check by trying to reach a reliable endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await fetch('/api/test', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return true;
    } catch (e) {
      toast.error('Network connection failed', {
        description: 'Unable to reach the server. Please check your internet connection.',
        duration: 4000,
      });
      return false;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;

    // Check network connectivity first
    const isConnected = await checkNetworkConnection();
    if (!isConnected) return;

    setInput(suggestion);
    setChatLoading(true);
    setLoading(true);

    // Add user message
    addMessage({ type: 'user', content: suggestion });
    const userQuery = suggestion;

    // Start new session
    const sessionId = startNewSession(userQuery);

    // Add assistant message placeholder
    const assistantMessageId = addMessage({
      type: 'assistant',
      content: '',
      streaming: true,
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userQuery }],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();

      const parser = new StreamParser();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunks = parser.parse(value);

        for (const chunk of chunks) {
          switch (chunk.type) {
            case 'phase':
              addPhaseToSession(sessionId, {
                phase: chunk.phase as any,
                timestamp: new Date(),
                title: chunk.title || '',
                description: chunk.description || '',
                data: chunk.data,
              });

              // Update table immediately after ranking is complete
              if (chunk.phase === 'rank' && chunk.data?.rankedIds) {
                // Small delay to ensure smooth transition
                setTimeout(() => {
                  setRankedIds(chunk.data?.rankedIds as number[]);
                  setHasSearched(true); // Mark that a search has been performed
                  setLoading(false); // Ensure loading state is cleared
                }, 100);
              }
              break;

            case 'content':
              if (chunk.content) {
                assistantContent += chunk.content;
                updateMessage(assistantMessageId, {
                  content: assistantContent,
                  streaming: true,
                });
              }
              break;

            case 'complete':
              updateMessage(assistantMessageId, { streaming: false });
              completeSession(sessionId);

              // Update ranked IDs if available (including empty arrays for no results)
              if (chunk.data?.finalResults !== undefined) {
                setRankedIds(chunk.data.finalResults as number[]);
                setHasSearched(true); // Mark that a search has been performed
              }
              setLoading(false); // Always clear loading state on completion
              break;

            case 'error':
              updateMessage(assistantMessageId, {
                content: `Error: ${chunk.error}`,
                streaming: false,
              });
              setLoading(false); // Clear loading state on error
              break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateMessage(assistantMessageId, {
        content: `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
        streaming: false,
      });
    } finally {
      setChatLoading(false);
      setLoading(false); // Clear loading state
      setInput(''); // Clear input after submission
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check network connectivity first
    const isConnected = await checkNetworkConnection();
    if (!isConnected) return;

    setChatLoading(true);
    setLoading(true);

    // Add user message
    addMessage({ type: 'user', content: input.trim() });
    const userQuery = input.trim();
    setInput('');

    // Start new session
    const sessionId = startNewSession(userQuery);

    // Add assistant message placeholder
    const assistantMessageId = addMessage({
      type: 'assistant',
      content: '',
      streaming: true,
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userQuery }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const parser = new StreamParser();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunks = parser.parse(value);

        for (const chunk of chunks) {
          switch (chunk.type) {
            case 'phase':
              addPhaseToSession(sessionId, {
                phase: chunk.phase as any,
                timestamp: new Date(),
                title: chunk.title || '',
                description: chunk.description || '',
                data: chunk.data,
              });

              // Update table immediately after ranking is complete
              if (chunk.phase === 'rank' && chunk.data?.rankedIds) {
                // Small delay to ensure smooth transition
                setTimeout(() => {
                  setRankedIds(chunk.data?.rankedIds as number[]);
                  setHasSearched(true); // Mark that a search has been performed
                  setLoading(false); // Ensure loading state is cleared
                }, 100);
              }
              break;

            case 'content':
              if (chunk.content) {
                assistantContent += chunk.content;
                updateMessage(assistantMessageId, {
                  content: assistantContent,
                  streaming: true,
                });
              }
              break;

            case 'complete':
              updateMessage(assistantMessageId, { streaming: false });
              completeSession(sessionId);

              // Update ranked IDs if available (including empty arrays for no results)
              if (chunk.data?.finalResults !== undefined) {
                setRankedIds(chunk.data.finalResults as number[]);
                setHasSearched(true); // Mark that a search has been performed
              }
              setLoading(false); // Always clear loading state on completion
              break;

            case 'error':
              updateMessage(assistantMessageId, {
                content: `Error: ${chunk.error}`,
                streaming: false,
              });
              completeSession(sessionId);
              setLoading(false); // Clear loading state on error
              break;
          }
        }
      }

      // Handle any remaining buffer
      const remainingChunks = parser.flush();
      for (const chunk of remainingChunks) {
        if (chunk.type === 'content' && chunk.content) {
          assistantContent += chunk.content;
          updateMessage(assistantMessageId, {
            content: assistantContent,
            streaming: false,
          });
        }
      }
    } catch (error) {
      console.error('Error processing query:', error);
      updateMessage(assistantMessageId, {
        content: '❌ Error processing your query. Please try again.',
        streaming: false,
      });
      completeSession(sessionId);
    } finally {
      setChatLoading(false);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <>
      {/* Chat Button - Always positioned bottom-right */}
      <AnimatePresence>
        {!isChatExpanded && (
          <motion.button
            key='chat-button'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
              delay: 0.1,
            }}
            onClick={handleExpand}
            className='cursor-pointer fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground rounded-full shadow-lg flex items-center justify-center'
          >
            <MessageSquare className='w-6 h-6' />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel - Also positioned bottom-right */}
      <AnimatePresence>
        {isChatExpanded && (
          <motion.div
            key='chat-panel'
            initial={{
              scale: 0.3,
              opacity: 0,
              y: 20,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale: 0.3,
              opacity: 0,
              y: 20,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className={`fixed bottom-6 right-6 z-50 ${'w-[500px] h-[600px]'} bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out`}
            style={{
              transformOrigin: 'bottom right',
            }}
          >
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b border-border/50 bg-background/50 flex-shrink-0'>
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 rounded-full bg-green-500' />
                <span className='font-medium text-sm'>ATS-Lite</span>
              </div>
              <div className='flex items-center gap-1'>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setChatExpanded(!isChatExpanded)}
                    className='w-8 h-8 p-0 hover:bg-background/50 transition-colors cursor-pointer'
                  >
                    <Minimize2 className='w-4 h-4' />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Messages */}
            <div className='flex-1 overflow-y-auto p-4 space-y-4 min-h-0'>
              {messages.length === 0 && (
                <div className='text-center text-muted-foreground py-8 mt-10'>
                  <MessageSquare className='w-8 h-8 mx-auto mb-2 opacity-50' />
                  <p className='text-sm'>Ask me anything about candidates...</p>
                  <div className='text-xs mt-4'>
                    <motion.button
                      key={currentSuggestionIndex}
                      initial={{ opacity: 0.8, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      onClick={() => handleSuggestionClick(suggestions[currentSuggestionIndex])}
                      className='inline-flex items-center px-3 py-1.5 ml-1 bg-secondary/10 hover:bg-secondary/20 border border-primary/20 hover:border-primary/30 rounded-full text-primary hover:text-primary/90 cursor-pointer transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                      disabled={isLoading}
                    >
                      &quot;{suggestions[currentSuggestionIndex]}&quot;
                    </motion.button>
                  </div>
                </div>
              )}

              {messages.map(message => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : message.type === 'system'
                          ? 'bg-muted/50 text-muted-foreground text-sm rounded-bl-md'
                          : 'bg-muted/50 text-foreground rounded-bl-md'
                    }`}
                  >
                    <div className='prose prose-sm'>
                      {message.type === 'user' ? (
                        <span>{message.content || ''}</span>
                      ) : message.streaming ? (
                        <div className='typing-content'>
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => (
                                <h1 className='text-lg font-bold mb-2'>{children}</h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className='text-base font-bold mb-2'>{children}</h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className='text-sm font-semibold mb-1'>{children}</h3>
                              ),
                              p: ({ children }) => <p className='mb-2 last:mb-0'>{children}</p>,
                              ul: ({ children }) => (
                                <ul className='list-disc list-inside mb-2 space-y-1'>{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className='list-decimal list-inside mb-2 space-y-1'>
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => <li className='text-sm'>{children}</li>,
                              strong: ({ children }) => (
                                <strong className='font-semibold'>{children}</strong>
                              ),
                              em: ({ children }) => <em className='italic'>{children}</em>,
                            }}
                          >
                            {message.content || ''}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className='text-lg font-bold mb-2'>{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className='text-base font-bold mb-2'>{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className='text-sm font-semibold mb-1'>{children}</h3>
                            ),
                            p: ({ children }) => <p className='mb-2 last:mb-0'>{children}</p>,
                            ul: ({ children }) => (
                              <ul className='list-disc list-inside mb-2 space-y-1'>{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className='list-decimal list-inside mb-2 space-y-1'>
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => <li className='text-sm'>{children}</li>,
                            strong: ({ children }) => (
                              <strong className='font-semibold'>{children}</strong>
                            ),
                            em: ({ children }) => <em className='italic'>{children}</em>,
                          }}
                        >
                          {message.content || ''}
                        </ReactMarkdown>
                      )}
                      {message.streaming && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className='inline-block w-2 h-4 bg-current ml-1'
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className='p-4 border-t border-border/50 bg-background/30'>
              <form onSubmit={handleSubmit} className='flex gap-2'>
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Try: 'Backend engineers in Berlin'"
                  className='flex-1 resize-none min-h-[44px] max-h-[120px] text-sm bg-background/50 border-border/50'
                  disabled={isLoading}
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type='submit'
                    size='sm'
                    disabled={isLoading || !input.trim()}
                    className='px-3 h-11 transition-all duration-200'
                  >
                    <AnimatePresence mode='wait'>
                      {isLoading ? (
                        <motion.div
                          key='loading'
                          initial={{ scale: 0, rotate: 0 }}
                          animate={{ scale: 1, rotate: 360 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.2 }}
                          className='w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin'
                        />
                      ) : (
                        <motion.div
                          className='cursor-pointer'
                          key='send'
                          initial={{ scale: 0, x: -10 }}
                          animate={{ scale: 1, x: 0 }}
                          exit={{ scale: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Send className='w-4 h-4' />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </form>
              <div className='text-xs text-muted-foreground mt-2'>⌘ + Enter to send</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
