import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mic, 
  Send, 
  MapPin, 
  Compass, 
  Home, 
  Settings, 
  ChevronLeft, 
  AlertCircle, 
  Globe, 
  CheckCircle2, 
  User, 
  PhoneCall,
  Activity,
  FlameKindling
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStadiumState } from '../../store/StadiumStateContext';
import { mockFallbackService } from '../../services/mockFallbackService';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  metadata?: {
    context: string;
    updated: string;
  };
  actions?: { label: string; actionType: string }[];
  isEmergency?: boolean;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pt', label: 'Português' }
];

const PulseGuide: React.FC = () => {
  const { fanContext, addLiveEvent, gates, zones } = useStadiumState();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${fanContext.username}, welcome to MetLife Stadium. I am your Tournament Companion. Ask me anything about routes, amenities, or help needed.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      metadata: {
        context: 'StadiumPulse Fan Guide active',
        updated: 'Status live'
      }
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: userTime
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setProcessingStep('Understanding your request...');

    // Log query in live event feed
    addLiveEvent('query', `Fan query: "${text}"`, `User: ${fanContext.username} @ ${fanContext.currentLocation}`);

    // Update processing text step 2
    setTimeout(() => {
      setProcessingStep('Checking live stadium conditions...');
    }, 600);

    try {
      const res = await fetch('/api/ai/fan-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          fanContext: {
            stadiumName: fanContext.stadiumName,
            currentLocation: fanContext.currentLocation,
            level: fanContext.level,
            seatDetails: fanContext.seatDetails,
            username: fanContext.username,
            preferredLanguage: selectedLanguage
          },
          stadiumState: {
            gates,
            zones
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned error: ${res.status}`);
      }

      const data = await res.json();

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: {
          context: data.responseType,
          updated: data.meta?.fallbackUsed ? 'Demo fallback active' : 'Gemini Active'
        },
        actions: data.actions?.map((act: any) => ({
          label: act.label,
          actionType: act.type
        })) || [],
        isEmergency: data.urgency === 'HIGH' || data.urgency === 'CRITICAL'
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (data.urgency === 'HIGH' || data.urgency === 'CRITICAL') {
        addLiveEvent('incident', `Safety/Emergency query flagged: "${text.substring(0, 30)}..."`, `Fan Proximity: ${fanContext.currentLocation}`);
      }
    } catch (err) {
      console.warn('[PulseGuide] Server request failed. Resorting to local fallback.', err);
      // Failback to client mock
      const classification = mockFallbackService.classifyFanRequest(text);
      const data = mockFallbackService.getGroundedFanResponse(text, classification);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: {
          context: `${data.responseType} (Fallback)`,
          updated: 'Demo fallback active'
        },
        actions: data.actions?.map((act: any) => ({
          label: act.label,
          actionType: act.type
        })) || [],
        isEmergency: data.urgency === 'HIGH' || data.urgency === 'CRITICAL'
      };

      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
      setProcessingStep('');
    }
  };

  const handleQuickAction = (_actionLabel: string, queryStr: string) => {
    handleSendMessage(queryStr);
  };

  const handleActionClick = (actionType: string, _label: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let text = "";
    if (actionType === "START_SAFE_ROUTE") {
      text = `🧭 Safe Route started! Follow the visual indicators on your navigation view. Corridor B2 has been bypassed due to heavy crowd density.`;
    } else if (actionType === "VIEW_GATE_STATUS") {
      text = `📊 Live stats for Gate C: Density is currently elevated. Alternate Gate D is recommended to minimize wait times.`;
    } else if (actionType === "REQUEST_STAFF_ASSISTANCE") {
      text = `🚨 Assistance request dispatched to MetLife Stadium operations. A venue steward has been routed to your section (${fanContext.currentLocation}). Please wait there.`;
    } else if (actionType === "VIEW_FACILITY") {
      text = `🍔 concession details loaded: Punt & Pass Pizza is open behind Section 122. Low crowd density.`;
    } else if (actionType === "REPORT_INCIDENT") {
      text = `📝 Emergency safety form generated. Operations staff have logged the incident and dispatched aid responders.`;
    } else {
      text = `🧭 Standard routing initialized. Please refer to signage and staff directions.`;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `action-reply-${Date.now()}`,
        sender: 'ai',
        text,
        timestamp: timeStr,
        metadata: {
          context: 'Action executed',
          updated: 'Moments ago'
        }
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-0 md:p-6 select-none font-sans bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.05),transparent_50%)]">
      
      {/* Landing Link Back Button */}
      <div className="w-full max-w-[420px] px-4 pt-4 pb-2 flex justify-between items-center text-xs text-slate-400">
        <Link to="/" className="flex items-center gap-1 hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" />
          <span>Landing Page</span>
        </Link>
        <span className="font-mono text-slate-400">PulseGuide Mobile Client</span>
      </div>

      {/* Simulated Smartphone Shell */}
      <div className="w-full max-w-[420px] h-[calc(100vh-80px)] md:h-[780px] bg-slate-900 border-0 md:border-[6px] md:border-slate-800 rounded-none md:rounded-[32px] overflow-hidden flex flex-col justify-between shadow-2xl relative">
        
        {/* Device Status Bar */}
        <div className="bg-[#020617] text-slate-400 text-[10px] px-6 py-2 flex justify-between items-center border-b border-slate-950 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-pulse"></span>
            <span className="text-emerald-400 font-semibold tracking-wider">LIVE</span>
            <span className="text-slate-600">|</span>
            <span>METLIFE SECURITY</span>
          </div>
          <div className="flex items-center gap-2">
            <span>5G</span>
            <span>98%</span>
          </div>
        </div>

        {/* Header App Bar */}
        <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-3.5 flex justify-between items-center z-10">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-brand-accent animate-pulse" />
            <div>
              <h1 className="text-sm font-bold text-white leading-none">StadiumPulse</h1>
              <span className="text-[9px] text-slate-400 font-medium">PulseGuide Companion</span>
            </div>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="h-7 px-2.5 rounded-full bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-xs flex items-center gap-1.5 text-slate-300 font-medium transition-colors"
              aria-label="Select language"
            >
              <Globe className="h-3 w-3" />
              <span>{LANGUAGES.find(l => l.code === selectedLanguage)?.label}</span>
            </button>
            
            <AnimatePresence>
              {showLangMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 mt-1 w-32 bg-slate-900 border border-slate-880 rounded-lg shadow-xl py-1 z-20 text-xs"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setShowLangMenu(false);
                        addLiveEvent('system', `Language updated: ${lang.label}`);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between"
                    >
                      <span>{lang.label}</span>
                      {selectedLanguage === lang.code && <CheckCircle2 className="h-3 w-3 text-brand-accent" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-[#090f24]/50 flex flex-col gap-4">
          
          {/* Greeting */}
          <div className="mt-1">
            <span className="text-slate-400 text-xs block">Good evening,</span>
            <h2 className="text-xl font-bold text-white leading-tight">Alex</h2>
          </div>

          {/* Context Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 shadow-md">
            <div className="h-8 w-8 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
              <MapPin className="h-4.5 w-4.5 text-brand-primary" />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="text-slate-400 font-medium">MetLife Stadium Location</div>
              <div className="text-white font-semibold">{fanContext.currentLocation} &bull; {fanContext.level}</div>
              <div className="text-[10px] text-slate-400 font-mono">Seat: {fanContext.seatDetails}</div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-grow flex flex-col gap-3.5 justify-end">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-brand-primary text-white rounded-br-none' 
                      : msg.isEmergency 
                        ? 'bg-red-500/10 border border-red-500/30 text-slate-200 rounded-bl-none shadow-red-950/20' 
                        : 'bg-slate-800/80 border border-slate-700/40 text-slate-200 rounded-bl-none'
                  }`}>
                    {/* Emergency Alert indicator */}
                    {msg.isEmergency && (
                      <div className="flex items-center gap-1.5 text-red-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                        <AlertCircle className="h-3.5 w-3.5 animate-bounce" />
                        <span>Medical Alert Active</span>
                      </div>
                    )}
                    
                    <p>{msg.text}</p>
                    
                    {/* Metadata indicators */}
                    {msg.metadata && (
                      <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                        <span>{msg.metadata.context}</span>
                        <span>{msg.metadata.updated}</span>
                      </div>
                    )}

                    {/* Action buttons inside message */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.actions.map((act) => (
                          <button
                            key={act.label}
                            onClick={() => handleActionClick(act.actionType, act.label)}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-[10px] transition-all ${
                              msg.isEmergency
                                ? 'bg-red-505 bg-red-500 text-white hover:bg-red-600'
                                : 'bg-brand-accent text-slate-950 hover:bg-brand-accent/90'
                            }`}
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 mx-1 font-mono">{msg.timestamp}</span>
                </div>
              ))}

              {isTyping && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 bg-slate-850 px-4 py-2.5 rounded-2xl rounded-bl-none border border-slate-800 w-16 text-slate-400">
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  {processingStep && (
                    <span className="text-[9px] text-slate-400 font-mono italic block ml-2 animate-pulse">
                      {processingStep}
                    </span>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions Scroll */}
          {messages.length === 1 && !isTyping && (
            <div className="space-y-2 mt-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Quick Actions</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleQuickAction("Find my gate", "Take me to Gate C")}
                  className="bg-slate-900 border border-slate-800 hover:border-brand-primary/40 rounded-xl p-3 text-left transition-all hover:bg-slate-850"
                >
                  <Compass className="h-4 w-4 text-brand-primary mb-1.5" />
                  <div className="text-xs font-semibold text-white">Find my gate</div>
                  <span className="text-[9px] text-slate-400">Route directions</span>
                </button>

                <button 
                  onClick={() => handleQuickAction("Nearest restroom", "Find me the nearest restroom")}
                  className="bg-slate-900 border border-slate-800 hover:border-brand-primary/40 rounded-xl p-3 text-left transition-all hover:bg-slate-850"
                >
                  <MapPin className="h-4 w-4 text-brand-accent mb-1.5" />
                  <div className="text-xs font-semibold text-white">Nearest restroom</div>
                  <span className="text-[9px] text-slate-400">Low wait times</span>
                </button>

                <button 
                  onClick={() => handleQuickAction("Accessibility help", "Show accessibility assistance options")}
                  className="bg-slate-900 border border-slate-800 hover:border-brand-primary/40 rounded-xl p-3 text-left transition-all hover:bg-slate-850"
                >
                  <User className="h-4 w-4 text-brand-warning mb-1.5" />
                  <div className="text-xs font-semibold text-white">Accessibility</div>
                  <span className="text-[9px] text-slate-400">Step-free paths</span>
                </button>

                <button 
                  onClick={() => handleQuickAction("Food & drinks", "Where can I buy food & drinks?")}
                  className="bg-slate-900 border border-slate-800 hover:border-brand-primary/40 rounded-xl p-3 text-left transition-all hover:bg-slate-850"
                >
                  <FlameKindling className="h-4 w-4 text-brand-orange mb-1.5" />
                  <div className="text-xs font-semibold text-white">Food & drinks</div>
                  <span className="text-[9px] text-slate-400">Check queue sizes</span>
                </button>

                <button 
                  onClick={() => handleQuickAction("Transport", "How do I get to public transport or parking?")}
                  className="bg-slate-900 border border-slate-800 hover:border-brand-primary/40 rounded-xl p-3 text-left transition-all hover:bg-slate-850"
                >
                  <Compass className="h-4 w-4 text-blue-400 mb-1.5" />
                  <div className="text-xs font-semibold text-white">Transport</div>
                  <span className="text-[9px] text-slate-400">Transit routes</span>
                </button>

                <button 
                  onClick={() => handleQuickAction("Get help", "My father is feeling dizzy")}
                  className="bg-red-955 bg-red-950/20 border border-red-900/40 hover:border-red-500/50 rounded-xl p-3 text-left transition-all hover:bg-red-950/30 group"
                >
                  <PhoneCall className="h-4 w-4 text-brand-danger mb-1.5 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-semibold text-red-200">Get Help</div>
                  <span className="text-[9px] text-red-400/80">Medical assistance</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Input Bar */}
        <div className="bg-[#020617] border-t border-slate-800/80 p-3.5 flex items-center space-x-2">
          {/* Mock Mic button */}
          <button 
            onClick={() => {
              setInputText("My father is feeling dizzy");
              addLiveEvent('query', 'Voice recognition input clicked');
            }}
            className="h-10 w-10 shrink-0 rounded-full bg-slate-800 hover:bg-slate-750 border border-slate-700/60 flex items-center justify-center text-slate-300 transition-colors"
            title="Voice input"
            aria-label="Activate voice query"
          >
            <Mic className="h-4.5 w-4.5" />
          </button>
          
          {/* Main Input Text Field */}
          <div className="flex-grow relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              placeholder="Ask about gates, facilities, accessibility..."
              aria-label="Ask a question about the stadium"
              className="w-full h-10 bg-slate-900 border border-slate-700/60 focus:border-brand-primary rounded-full px-4 text-xs text-white focus:outline-none transition-colors pr-10 font-sans"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim()}
              aria-label="Send message"
              className="absolute right-1 top-1 h-8 w-8 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-brand-primary/95 disabled:opacity-30 disabled:hover:bg-brand-primary transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Tab Bar */}
        <div className="bg-slate-900 border-t border-slate-800/80 grid grid-cols-3 py-2 text-center text-[10px] text-slate-500 font-medium">
          <button onClick={() => setMessages([messages[0]])} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition-colors">
            <Home className="h-4.5 w-4.5" />
            <span>Home</span>
          </button>
          <button onClick={() => handleQuickAction("Guide me", "Take me to Gate C")} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition-colors">
            <Compass className="h-4.5 w-4.5" />
            <span>Map</span>
          </button>
          <button onClick={() => setShowLangMenu(true)} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition-colors">
            <Settings className="h-4.5 w-4.5" />
            <span>Setup</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PulseGuide;
