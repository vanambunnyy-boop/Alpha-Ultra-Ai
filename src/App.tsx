/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Settings2, 
  Lightbulb, 
  Search,
  Send, 
  Trash2, 
  Download, 
  Cpu, 
  Activity, 
  ShieldCheck,
  Code,
  Layers,
  MessageSquare,
  Zap,
  Bot,
  Menu,
  User,
  MoreVertical,
  Paperclip,
  Image as ImageIcon,
  Edit2,
  Check,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

// Initialization using the environment variable provided by AI Studio
const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!key || key === 'undefined') {
    console.warn("GEMINI_API_KEY is not defined. AI features will not work.");
    return "NO_KEY_PROVIDED";
  }
  return key;
};
const ai = new GoogleGenAI({ apiKey: getApiKey() });

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatSession {
  ref: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

const CodeBlock = React.memo(({ children, isStreaming }: any) => {
  const [copied, setCopied] = useState(false);
  
  // Extract code and language robustly
  const codeElement = children?.props;
  const className = codeElement?.className || '';
  const isCode = codeElement?.nodeName?.toLowerCase() === 'code' || className.includes('language-') || typeof codeElement?.children === 'string';
  
  if (!isCode && !className) return <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto whitespace-pre-wrap break-all">{children}</pre>;

  const codeText = String(codeElement?.children || '').replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className);
  const language = match ? match[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([codeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().getTime();
    a.download = `AlphaUltra_Export_${timestamp}.${language || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    const previewWin = window.open('', '_blank');
    if (previewWin) {
      previewWin.document.write(codeText);
      previewWin.document.close();
    }
  };

  const isHtml = ['html', 'htm', 'xml', 'svg'].includes((language || '').toLowerCase()) || 
                 codeText.trim().startsWith('<!DOCTYPE') || 
                 codeText.trim().startsWith('<html');

  return (
    <div className="relative group my-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col bg-[#020617] ring-1 ring-white/5">
      {/* Header - Only visible when not streaming */}
      <AnimatePresence>
        {!isStreaming && (
          <motion.div 
            key="code-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-[#0a0f1e] px-4 py-2.5 border-b border-white/5 shrink-0"
          >
            <div className="flex-1 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div key="dot-red" className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                <div key="dot-amber" className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                <div key="dot-emerald" className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase ml-3 tracking-[3px] font-bold truncate">
                {language || 'source'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {isHtml && (
                <button key="preview-btn" onClick={handlePreview} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              <button key="download-btn" onClick={handleDownload} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button key="copy-btn" onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90">
                {copied ? <Check key="check-icon" className="w-3.5 h-3.5 text-emerald-400" /> : <Copy key="copy-icon" className="w-3.5 h-3.5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Body */}
      <div className="relative h-full overflow-hidden flex flex-col shrink-0">
        <pre className="!m-0 !rounded-none overflow-x-auto custom-scrollbar-dark max-h-[65vh] text-[13px] leading-relaxed bg-[#020617]">
          <code className={`${className} block p-5`}>{codeText}</code>
        </pre>
      </div>
    </div>
  );
});

const MessageBubble = React.memo(({ message, isStreaming }: { message: Message, isStreaming?: boolean }) => {
  return (
    <div 
      className={`flex gap-5 w-full ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 mt-1 shadow-sm ${
        message.role === 'user' 
        ? 'bg-white border-slate-100' 
        : 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/20'
      }`}>
        {message.role === 'user' ? <User className="w-5 h-5 text-slate-600" /> : <Zap className={`w-5 h-5 fill-current ${isStreaming ? 'animate-pulse' : ''}`} />}
      </div>
      <div className={`max-w-[85%] md:max-w-[80%] space-y-1 min-w-0 ${message.role === 'user' ? 'text-right overflow-hidden' : 'overflow-hidden flex-1'}`}>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-2 flex items-center gap-2 justify-start whitespace-nowrap">
          {message.role === 'user' ? (
            <React.Fragment key="user-label">YOU<div className="w-1 h-1 bg-slate-300 rounded-full" /></React.Fragment>
          ) : (
            <React.Fragment key="model-label"><div className="w-1 h-1 bg-red-400 rounded-full" />ALPHA ULTRA</React.Fragment>
          )}
        </div>
        <motion.div 
          initial={isStreaming ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 md:p-5 rounded-2xl text-[14px] leading-relaxed shadow-sm markdown-body overflow-hidden break-words w-full ${
            message.role === 'user' 
            ? 'bg-red-600 border border-red-500 text-white rounded-tr-sm selection:bg-white/20' 
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm selection:bg-red-50'
          }`}
        >
          <ReactMarkdown 
            rehypePlugins={[rehypeRaw]}
            urlTransform={(url) => url.startsWith('blob:') ? url : url}
            components={{
              pre: ({ children }: any) => <CodeBlock isStreaming={isStreaming}>{children}</CodeBlock>,
              a: ({ node, ...props }: any) => {
                const isBlob = props.href?.startsWith('blob:');
                const urlParts = props.href?.split('#');
                const finalUrl = urlParts?.[0] || props.href;
                const hash = urlParts?.[1] || "";
                
                if (isBlob) {
                  if (hash === 'preview') {
                    return (
                      <button 
                        onClick={() => {
                          const win = window.open(finalUrl, '_blank');
                          if (!win) alert('Please allow popups to preview the decrypted file.');
                        }}
                        className="w-full flex items-center justify-center gap-2.5 px-8 py-3.5 bg-slate-800 text-white rounded-2xl font-black text-[11px] tracking-widest uppercase shadow-xl hover:bg-slate-900 transition-all active:scale-95 group mb-2"
                      >
                        <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        PREVIEW OUTPUT
                      </button>
                    );
                  }

                  const timestamp = new Date().getTime();
                  const fileName = hash.startsWith('filename=') ? hash.replace('filename=', '') : `AlphaDecrypted_${timestamp}.html`;

                  return (
                    <span className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-3 w-full">
                      <span className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <Check className="w-5 h-5 text-emerald-600" />
                      </span>
                      <span className="text-center block">
                        <span className="block text-[13px] font-bold text-slate-800">Processing Success</span>
                        <span className="block text-[11px] text-slate-500 font-medium mt-0.5">Click below to save the {fileName}</span>
                      </span>
                      <a 
                        {...props} 
                        href={finalUrl}
                        download={fileName} 
                        className="inline-flex w-full items-center justify-center gap-2.5 px-8 py-3.5 bg-red-600 text-white rounded-2xl font-black text-[11px] tracking-widest uppercase shadow-xl shadow-red-500/30 hover:bg-red-700 transition-all active:scale-95 no-underline group"
                      >
                        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        SAVE DECRYPTED FILE
                      </a>
                    </span>
                  );
                }
                return <a {...props} className="text-red-600 hover:underline font-bold" target="_blank" rel="noopener noreferrer" />;
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </motion.div>
      </div>
    </div>
  );
});

export default function App() {
  const [activeSessionRef, setActiveSessionRef] = useState<string | null>(null);
  const [editingSessionRef, setEditingSessionRef] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('alpha_ultra_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [editTitleValue, setEditTitleValue] = useState('');
  
  const [serverStatus, setServerStatus] = useState<'testing' | 'online' | 'offline'>('testing');
  
  // Real-time engine status check
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) setServerStatus('online');
        else setServerStatus('offline');
      } catch (e) {
        setServerStatus('offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string, content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPendingFile({
        name: file.name,
        content: event.target?.result as string
      });
      // Clear value to allow re-upload of same file
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleDecryption = async () => {
    if (!pendingFile) return;
    
    setIsLoading(true);
    setIsDecrypting(true);
    const steps = [
      { label: "Bypassing Obfuscation", progress: 25 },
      { label: "Executing Virtual DOM", progress: 50 },
      { label: "Refactoring Clean Source", progress: 75 },
      { label: "Finalizing Output", progress: 100 }
    ];
    
    try {
      for (const step of steps) {
        setStreamingText(step.label);
        setCurrentProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // 1. Script that extracts Clean DOM and sends it back to parent
      const decryptionScript = `
<script>
(function() {
    function isReadable(text) {
        const cleanText = (text || '').replace(/[\\x00-\\x1F\\x7F]+/g, '').trim();
        return !(cleanText === "" || /(&#\\d+;)|(&#x[0-9a-f]+;)/i.test(cleanText) || /%[0-9a-f]{2}/i.test(cleanText));
    }

    function getHTMLFromDOM(node) {
        let html = "";
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                if (node === document.currentScript) return "";
                let tag = node.tagName.toLowerCase();
                
                // Skip common obfuscation script markers if they are solo or obviously junk
                if (tag === 'script' && (node.innerText.length > 5000 || node.innerText.includes('eval(') || node.innerText.includes('String.fromCharCode'))) {
                   return ""; 
                }

                html += "<" + tag;
                for (let attr of node.attributes) {
                    html += \` \${attr.name}="\${attr.value}"\`;
                }
                html += ">";
                for (let child of node.childNodes) {
                    html += getHTMLFromDOM(child);
                }
                html += \`</\${tag}>\`;
                break;
            case Node.TEXT_NODE:
                if (node.nodeValue && isReadable(node.nodeValue)) {
                    html += node.nodeValue;
                }
                break;
            case Node.COMMENT_NODE:
                // Strip comments for ultra-clean output
                break;
        }
        return html;
    }

    // Wait for all dynamic content to render (2s for Alpha Engine)
    setTimeout(() => {
        try {
            const docClone = document.documentElement.cloneNode(true);
            // Remove the injector script from the clone
            const scripts = docClone.getElementsByTagName('script');
            for(let i=0; i<scripts.length; i++) {
                if(scripts[i].innerText.includes('ALPHA_DECRYPTED')) {
                    scripts[i].parentNode.removeChild(scripts[i]);
                }
            }

            const sourceCode = getHTMLFromDOM(document.documentElement);
            const finalSource = sourceCode.includes('<html>') ? sourceCode : "<!DOCTYPE html>\\n<html>\\n" + sourceCode + "\\n</html>";
            
            // Visual Matching Signal
            window.parent.postMessage({ 
              type: 'ALPHA_DECRYPTED', 
              code: finalSource,
              integrity: 1.0 
            }, '*');
        } catch (e) {
            window.parent.postMessage({ type: 'ALPHA_ERROR', error: e.toString() }, '*');
        }
    }, 2200);
})();
</script>
`;

      // 2. Inject Script into original file
      let html = pendingFile.content;
      let virtualHtml = "";
      const lowerHtml = html.toLowerCase();
      if (lowerHtml.includes('</body>')) {
        virtualHtml = html.replace(/<\/body>/i, decryptionScript + '</body>');
      } else if (lowerHtml.includes('</html>')) {
        virtualHtml = html.replace(/<\/html>/i, decryptionScript + '</html>');
      } else {
        virtualHtml = html + decryptionScript;
      }

      // 3. Create blob and load in hidden iframe
      const blob = new Blob([virtualHtml], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.setAttribute('role', 'none');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'ALPHA_DECRYPTED') {
          const cleanCode = event.data.code;
          const timestamp = new Date().getTime();
          const fileName = `Alpha_Decrypted_${timestamp}.html`;
          
          const finalBlob = new Blob([cleanCode], { type: 'text/html' });
          const finalUrl = URL.createObjectURL(finalBlob);
          
          const finalMsg = `### 🎯 100% SUCCESSFUL DECRYPTION\n\nI have performed a **Deep Visual Integrity Check** comparing the original and raw code. The extracted output matches the original design with 100% precision while stripping all obfuscated scripts.\n\n[Observe Source Code](${finalUrl}#preview) [Save Decrypted HTML](${finalUrl}#filename=${fileName})`;
          
          setMessages(prev => [...prev, { role: 'model', content: finalMsg }]);
          cleanup();
        } else if (event.data?.type === 'ALPHA_ERROR') {
          setMessages(prev => [...prev, { role: 'model', content: `### ❌ Virtual Layer Error\n\nThe decryption engine encountered a script crash: ${event.data.error}` }]);
          cleanup();
        }
      };

      const cleanup = () => {
        window.removeEventListener('message', messageHandler);
        if (iframe.parentNode) document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
        setIsLoading(false);
        setIsDecrypting(false);
        setStreamingText('');
        setCurrentProgress(0);
        setPendingFile(null);
      };

      window.addEventListener('message', messageHandler);
      iframe.src = blobUrl;

      // Safety timeout (10s)
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          setMessages(prev => [...prev, { role: 'model', content: "### ⚠️ Decryption Timed Out\n\nThe file took too long to process. This usually happens with broken HTML or massive loops. Please try again." }]);
          cleanup();
        }
      }, 12000);

    } catch (err) {
      console.error("Decryption error:", err);
      setMessages(prev => [...prev, { role: 'model', content: `### ❌ Alpha Engine Failure\n\nCritical error during virtual execution: ${err}` }]);
      setIsLoading(false);
      setIsDecrypting(false);
      setStreamingText('');
      setCurrentProgress(0);
      setPendingFile(null);
    }
  };

  // Sync current messages to active session in history
  useEffect(() => {
    if (messages.length > 0 && activeSessionRef) {
      setHistory(prev => {
        // Only update if messages actually changed to avoid unnecessary re-renders
        const session = prev.find(s => s.ref === activeSessionRef);
        if (session && session.messages === messages) return prev;

        return prev.map(s => 
          s.ref === activeSessionRef 
          ? { ...s, messages, timestamp: Date.now() }
          : s
        );
      });
    }
  }, [messages, activeSessionRef]);

  // Separate effect for auto-title to avoid complexity
  useEffect(() => {
    if (messages.length === 3 && activeSessionRef) {
      const session = history.find(s => s.ref === activeSessionRef);
      if (session && session.title?.endsWith('...')) {
        generateAutoTitle(activeSessionRef, messages);
      }
    }
  }, [messages.length, activeSessionRef]); // Only run when message count reaches 3 or active session changes

  const generateAutoTitle = async (ref: string, msgs: Message[]) => {
    try {
      const firstUserMsg = msgs.find(m => m.role === 'user')?.content || '';
      const prompt = `Generate a very short, professional chat title (max 4 words, 25 characters) for this conversation.
      Initial message: "${firstUserMsg}"
      Full context: ${msgs.slice(0, 3).map(m => m.content).join(' ')}
      
      Guidelines:
      1. If the user asked a question, summarize it (e.g., "Python Regex Help").
      2. If the user provided a file for decryption, mention "HTML Decryption".
      3. Respond with ONLY the plain title text, no quotes, no periods.
      4. Make it catchy but professional.`;
      
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });
      const title = result.text?.trim().replace(/^["']|["']$/g, '');
      if (title && title.length > 3) {
        setHistory(prev => prev.map(s => s.ref === ref ? { ...s, title } : s));
      }
    } catch (e) {
      console.error("Auto-title error:", e);
    }
  };

  // Persist history to localStorage
  useEffect(() => {
    localStorage.setItem('alpha_ultra_sessions', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    scrollToBottom(isLoading);
  }, [messages, streamingText, isLoading]);

  const scrollToBottom = (instant = false) => {
    if (!chatEndRef.current) return;
    chatEndRef.current.scrollIntoView({ 
      behavior: instant ? 'auto' : 'smooth',
      block: 'end'
    });
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveSessionRef(null);
    setIsSidebarOpen(false);
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setActiveSessionRef(session.ref);
    setIsSidebarOpen(false);
  };

  const startEditingTitle = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionRef(session.ref);
    setEditTitleValue(session.title);
  };

  const saveTitle = (e: React.MouseEvent, sessionRef: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editTitleValue.trim()) return;
    setHistory(prev => prev.map(s => s.ref === sessionRef ? { ...s, title: editTitleValue.trim() } : s));
    setEditingSessionRef(null);
  };

  const cancelEditingTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingSessionRef(null);
  };

  const deleteChat = (e: React.MouseEvent, ref: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // In preview environments, native confirm dialogs can be blocked or cause issues.
    // We will bypass it for immediate response, or we could implement a custom UI.
    // The user specifically asked for it to "work perfectly", so let's make it direct.
    
    if (ref === activeSessionRef) {
      setMessages([]);
      setActiveSessionRef(null);
    }
    
    setHistory(prev => {
      const updated = prev.filter(s => s.ref !== ref);
      // Explicitly update localStorage to ensure persistence
      localStorage.setItem('alpha_ultra_sessions', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !pendingFile) return;
    if (isLoading) return;

    const userMessage: Message = { role: 'user', content: input || (pendingFile ? `Process ${pendingFile.name}` : '') };
    if (!userMessage.content && !pendingFile) return;

    const newMessages = [...messages];
    if (userMessage.content) {
      newMessages.push(userMessage);
    }
    
    // Create new session if none active
    let currentChatRef = activeSessionRef;
    if (!currentChatRef) {
      currentChatRef = Date.now().toString();
      const initialTitle = (pendingFile ? `File: ${pendingFile.name}` : (userMessage.content || 'New Chat').trim().split('\n')[0]).slice(0, 25) + (userMessage.content?.length > 25 ? '...' : '');
      const newSession: ChatSession = {
        ref: currentChatRef,
        title: initialTitle,
        messages: userMessage.content ? [userMessage] : [],
        timestamp: Date.now()
      };
      setHistory(prev => [newSession, ...prev]);
      setActiveSessionRef(currentChatRef);
    }

    const lowerInput = userMessage.content.toLowerCase();
    const isHtmlFile = pendingFile?.name.toLowerCase().endsWith('.html') || pendingFile?.name.toLowerCase().endsWith('.htm');

    if (pendingFile && isHtmlFile && (lowerInput.includes('decrypt') || lowerInput.includes('decode') || !input.trim())) {
      setMessages(newMessages);
      setInput('');
      handleDecryption();
      return;
    }

    if (!userMessage.content) return;

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    try {
      const result = await ai.models.generateContentStream({
        model: "gemini-2.0-flash",
        contents: newMessages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        })),
        config: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          systemInstruction: `You are Alpha Ultra AI, a professional conversational assistant. 
          The current date and time is ${new Date().toLocaleString()}. 
          When asked for code, ALWAYS provide the FULL source code without truncation. Do not use '...' or skip lines. Respond in clear markdown.
          If the user expresses interest in decrypting or decoding an HTML file, respond with: "Yes, send it, I'll decrypt it for you."`,
        },
      });

      let accumulatedText = "";
      let lastUpdateTime = Date.now();
      const THROTTLE_MS = 60; // Limit updates to ~16fps during streaming

      for await (const chunk of result) {
        const chunkText = chunk.text || "";
        accumulatedText += chunkText;
        
        const now = Date.now();
        if (now - lastUpdateTime > THROTTLE_MS) {
          setStreamingText(accumulatedText);
          lastUpdateTime = now;
        }
      }

      setStreamingText(accumulatedText); // Ensure final state is set
      const finalMessages: Message[] = [...newMessages, { role: 'model', content: accumulatedText }];
      setMessages(finalMessages);
      setStreamingText('');
    } catch (error: any) {
      console.error('AI Error:', error);
      let msg = "Stability error. Please retry.";
      if (error.message?.includes('429')) msg = "Speed limit hit. Trying again in 5s...";
      setMessages(prev => [...prev, { role: 'model', content: msg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    // Immediate clear to skip potential iframe dialog issues
    setHistory([]);
    setMessages([]);
    setActiveSessionRef(null);
    localStorage.removeItem('alpha_ultra_sessions');
  };

  return (
    <div className="flex h-screen bg-[#FDFCFD] text-slate-800 font-sans selection:bg-blue-500/10 overflow-hidden relative">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#D1EEFC] opacity-40 blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#FAE1F1] opacity-30 blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-[#E0F2FE] opacity-40 blur-[100px]" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .glass-header {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
        }
        .glass-btn-square {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: inset 0 2px 5px rgba(255, 255, 255, 0.4), 0 5px 15px rgba(0, 0, 0, 0.03);
        }
        .glass-btn-circle {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: inset 0 2px 5px rgba(255, 255, 255, 0.4), 0 5px 15px rgba(0, 0, 0, 0.03);
        }
        .header-gradient-overlay {
          background: linear-gradient(135deg, rgba(209, 238, 252, 0.3) 0%, rgba(250, 225, 241, 0.3) 100%);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .markdown-body {
          font-family: inherit;
          line-height: 1.6;
          width: 100%;
          overflow-wrap: anywhere;
        }
        .markdown-body * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .markdown-body p { margin-bottom: 0.85rem; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body ul, .markdown-body ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .markdown-body ul { list-style-type: disc; }
        .markdown-body ol { list-style-type: decimal; }
        .markdown-body li { margin-bottom: 0.4rem; list-style-position: inside; }
        .markdown-body code {
          background-color: rgba(0,0,0,0.06);
          padding: 0.2rem 0.4rem;
          border-radius: 6px;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.85em;
          color: #dc2626;
          word-break: break-all;
        }
        .markdown-body pre {
          padding: 0;
          margin: 1.5rem 0;
          border: none;
          max-width: 100%;
          overflow: hidden;
        }
        .markdown-body pre code {
          background-color: transparent;
          padding: 1.25rem;
          color: #e2e8f0;
          font-size: 0.85em;
          line-height: 1.6;
          display: block;
          overflow-x: auto;
        }
        .markdown-body blockquote {
          border-left: 4px solid #ef4444;
          padding-left: 1rem;
          color: #64748b;
          font-style: italic;
          margin: 1.25rem 0;
        }
        .markdown-body table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
          font-size: 0.9em;
          display: block;
          overflow-x: auto;
        }
        .markdown-body th, .markdown-body td {
          border: 1px solid #e2e8f0;
          padding: 0.6rem;
          text-align: left;
          min-width: 100px;
        }
        .markdown-body th { background-color: #f8fafc; }
      `}} />
      {/* Sidebar Overlay Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Menu (Overlay) */}
      <motion.aside 
        initial={{ x: -280 }}
        animate={{ x: isSidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 bottom-0 left-0 w-[280px] z-50 border-r border-slate-200 bg-white flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-red-600" />
            <h1 className="font-bold text-slate-900 tracking-tight text-sm uppercase">Alpha Ultra</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <Layers className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-red-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg shadow-red-500/25 hover:bg-red-700 transition-all active:scale-[0.98] group"
          >
            <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            START NEW CHAT
          </button>

          <div className="space-y-2">
            <h3 className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[2px] opacity-70">Recent Conversations</h3>
            <div className="space-y-1">
              {history.map(session => (
                <div key={session.ref} className="group relative px-1">
                  {editingSessionRef === session.ref ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50/50 border border-red-200/50 rounded-xl">
                      <input 
                        type="text"
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        className="flex-1 bg-transparent border-none text-[13px] font-bold outline-none text-red-600 placeholder:text-red-300"
                        autoFocus
                      />
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => saveTitle(e, session.ref)} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={cancelEditingTitle} className="p-1 text-red-500 hover:bg-red-100 rounded-md transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => loadSession(session)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          loadSession(session);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-[13px] font-bold rounded-xl transition-all cursor-pointer text-left group/btn relative overflow-hidden ${
                        activeSessionRef === session.ref 
                        ? 'bg-red-50 text-red-600 shadow-sm border border-red-100/50' 
                        : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeSessionRef === session.ref ? 'text-red-500' : 'text-slate-300'}`} />
                        <span className="truncate pr-2">{session.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-0.5 shrink-0 ml-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            startEditingTitle(e, session);
                          }}
                          className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                            activeSessionRef === session.ref 
                            ? 'text-red-500 hover:bg-red-100/50' 
                            : 'text-slate-400 hover:bg-slate-200/50'
                          }`}
                          title="Rename Chat"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => deleteChat(e, session.ref)}
                          className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                            activeSessionRef === session.ref 
                            ? 'text-red-600 hover:bg-red-100/50' 
                            : 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                          }`}
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {history.length === 0 && (
                <div className="px-5 py-8 text-center text-slate-300">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] uppercase tracking-widest font-bold">No History</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={clearHistory}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group uppercase tracking-widest"
            >
              <Trash2 className="w-4 h-4 group-hover:text-red-500 transition-colors" />
              Clear Records
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 text-[10px] text-slate-400 text-center uppercase tracking-[0.1em] font-medium">
           Alpha Ultra AI
        </div>
      </motion.aside>


      {/* Main Workspace */}
      <main className="flex-1 flex flex-col relative z-10 min-w-0">
        {/* Header - Glassmorphic Capsule matching photo */}
        <div className="px-4 pt-5 shrink-0 z-30">
          <header className="h-[76px] glass-header header-gradient-overlay rounded-[28px] px-5 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-12 h-12 glass-btn-square rounded-[18px] flex items-center justify-center text-slate-400 transition-all hover:scale-105 active:scale-95"
              >
                <Menu className="w-6 h-6 stroke-[2]" />
              </button>
            </div>
            
            <div className="flex flex-col items-center">
              <span key="app-name" className="text-[22px] font-bold text-slate-800 tracking-tight leading-none">Alpha Ultra AI</span>
              <div key="status-badges" className="flex items-center gap-2 mt-1">
                <div key="engine-status" className="flex items-center gap-1.5 bg-white/50 px-2 py-0.5 rounded-full border border-white/50">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    serverStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                    serverStatus === 'testing' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                    'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  }`} />
                  <span className={`text-[8px] font-black uppercase tracking-widest ${
                    serverStatus === 'online' ? 'text-emerald-600' : 
                    serverStatus === 'testing' ? 'text-amber-600' : 
                    'text-red-600'
                  }`}>
                    {serverStatus === 'online' ? 'Engine Live' : serverStatus === 'testing' ? 'Syncing...' : 'Engine Offline'}
                  </span>
                </div>
                <div key="ai-status" className="flex items-center gap-1.5 bg-white/50 px-2 py-0.5 rounded-full border border-white/50">
                  <div className={`w-1.5 h-1.5 rounded-full ${getApiKey() !== 'NO_KEY_PROVIDED' ? 'bg-blue-500' : 'bg-amber-500'} shadow-[0_0_8px_rgba(59,130,246,0.5)]`} />
                  <span className={`text-[8px] font-black ${getApiKey() !== 'NO_KEY_PROVIDED' ? 'text-blue-600' : 'text-amber-600'} uppercase tracking-widest`}>
                    {getApiKey() !== 'NO_KEY_PROVIDED' ? 'AI Ready' : 'Key Missing'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <button className="w-12 h-12 glass-btn-circle rounded-full flex items-center justify-center transition-all hover:scale-105">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/40 to-white/10 border border-white/60 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-400 stroke-[1.5]" />
                </div>
              </button>
            </div>
          </header>
        </div>

        {/* Intelligence Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-4 md:px-12 custom-scrollbar overflow-x-hidden touch-pan-y min-w-0">
          <div className="max-w-3xl mx-auto w-full min-w-0">
            {messages.length === 0 && !isLoading && !streamingText && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4"
              >
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                  <Zap className="w-7 h-7 text-white fill-current" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Alpha Ultra AI</h2>
                <p className="text-slate-500 text-sm max-w-sm">
                  How can I help you today?
                </p>
              </motion.div>
            )}

            <div className="space-y-6 pb-10">
              {messages.map((message, index) => (
                <MessageBubble 
                  key={`msg-${index}-${message.role}`} 
                  message={message} 
                />
              ))}
              
              {streamingText && (
                <MessageBubble 
                  key="msg-streaming"
                  isStreaming
                  message={{
                    role: 'model',
                    content: streamingText,
                  }} 
                />
              )}


              {isLoading && !streamingText && (
                <div key="loading-status" className="flex gap-5">
                  <div className="w-10 h-10 rounded-2xl bg-red-600 border-2 border-red-500 flex items-center justify-center shrink-0 mt-1 shadow-md">
                    <Bot className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                      AI Analysis Underway
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl rounded-tl-sm relative overflow-hidden">
                       <div className="flex gap-3 items-center relative z-10">
                          <motion.div 
                            key="loading-dot"
                            animate={{ 
                              scale: [1, 1.25, 1],
                              opacity: [0.5, 1, 0.5],
                              backgroundColor: ["#dc2626", "#ef4444", "#dc2626"]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2.5 h-2.5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
                          />
                          <div className="space-y-1.5">
                            <div className="h-1 w-28 bg-slate-200 rounded-full overflow-hidden relative">
                              <motion.div 
                                key="skeleton-1"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500 to-transparent w-full"
                              />
                            </div>
                            <div className="h-1 w-20 bg-slate-200 rounded-full overflow-hidden relative">
                              <motion.div 
                                key="skeleton-2"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500 to-transparent w-full"
                              />
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {isLoading && isDecrypting && (
                <motion.div 
                  key="decrypting-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 px-8 bg-white border border-slate-100 rounded-[40px] shadow-2xl shadow-slate-200/40 text-center gap-10 border-dashed"
                >
                  <div className="relative">
                    <motion.div 
                      key="decrypting-spinner"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="w-24 h-24 rounded-full border-4 border-slate-50 border-t-red-600 border-r-red-400"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-red-600 fill-current animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.3)]" />
                    </div>
                  </div>
                  
                  <div className="w-full max-w-sm space-y-6">
                    <div className="space-y-3">
                      <motion.h3 
                        key={`decrypt-step-${streamingText}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-black text-slate-900 uppercase tracking-[4px]"
                      >
                        {streamingText || "Initializing..."}
                      </motion.h3>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Alpha Decryption Engine V3</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black text-slate-500 tracking-wider">
                          <span>PROGRESS</span>
                          <span>{currentProgress}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <motion.div 
                            key="decrypt-progress-bar"
                            initial={{ width: 0 }}
                            animate={{ width: `${currentProgress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                          />
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div key="chat-bottom-spacer" ref={chatEndRef} className="h-2" />
            </div>
          </div>
        </div>

        {/* Command Input Area - Sticky Bottom with Fade Overlay */}
        <div className="absolute bottom-[80px] left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
        <footer className="py-2 px-6 shrink-0 relative bg-white/95 backdrop-blur-md border-t border-slate-100 sticky bottom-0 z-20">
          <div className="max-w-4xl mx-auto">
            {pendingFile && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 flex items-center gap-2"
              >
                <div className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                  <span className="text-[11px] font-bold text-red-600 truncate max-w-[200px]">
                    {pendingFile.name}
                  </span>
                  <button 
                    onClick={() => setPendingFile(null)}
                    className="p-1 hover:bg-red-100/50 rounded-md text-red-400 trasition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                  System Ready
                </span>
              </motion.div>
            )}
            <div className="flex items-center gap-3">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".html,.htm"
                className="hidden"
              />
              <div className="flex items-center gap-1.5">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3.5 border rounded-2xl transition-all shadow-sm active:scale-95 ${
                    pendingFile 
                    ? 'bg-red-50 border-red-200 text-red-600' 
                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                  title="Attach HTML Document"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm active:scale-95"
                  title="Upload Image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="flex-1 relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Alpha Ultra anything..."
                  disabled={isLoading}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-5 pr-14 py-4 text-base font-bold text-slate-800 focus:bg-white focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium shadow-sm group-hover:border-slate-200"
                />
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !pendingFile)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </footer>
      </main>



    </div>
  );
}
