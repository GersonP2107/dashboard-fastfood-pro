'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, MessageSquare, Minimize, Maximize2, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export function BusinessChatHelper() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        const newHistory = [...messages, userMsg];

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newHistory }),
            });

            if (!response.ok) throw new Error('Failed to fetch response');
            if (!response.body) return;

            // Initialize assistant message
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedContent += chunk;

                // Update the last message with new content
                setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === 'assistant') {
                        lastMsg.content = accumulatedContent;
                    }
                    return updated;
                });
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'system', content: 'Lo siento, hubo un error al procesar tu mensaje.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
                    >
                        <Bot className="w-8 h-8 text-white" />
                        <span className="absolute -top-2 -right-2 flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-sky-500"></span>
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className={cn(
                            "fixed z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col transition-all duration-300",
                            isExpanded ? "top-6 bottom-6 right-6 left-6 md:left-auto md:w-[600px]" : "bottom-6 right-6 w-[400px] h-[600px]"
                        )}
                    >
                        {/* Header */}
                        <div className="p-4 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                                    <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Asistente IA</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Conectado con Dashboard
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200" onClick={() => setIsExpanded(!isExpanded)}>
                                    {isExpanded ? <Minimize className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:text-zinc-400 dark:hover:bg-red-900/20" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-black/20">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                                    <Bot className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-sm">¡Hola! Soy tu analista de negocios inteligente.</p>
                                    <p className="text-xs mt-2 opacity-70">Prueba preguntando: "¿Cuánto vendimos hoy?" o "¿Cuál es el producto más vendido?"</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx}
                                    className={cn(
                                        "flex w-full",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap",
                                            msg.role === 'user'
                                                ? "bg-blue-600 text-white rounded-br-none"
                                                : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-bl-none"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex w-full justify-start"
                                >
                                    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl rounded-bl-none px-4 py-4 shadow-sm flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-duration:0.6s]"></span>
                                        <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></span>
                                        <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]"></span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Escribe tu pregunta..."
                                    className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-500"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className={cn(
                                        "absolute right-2 h-8 w-8 inline-flex items-center justify-center rounded-lg transition-all",
                                        input.trim() ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
                                    )}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
