'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Sparkles } from 'lucide-react';

/**
 * ZENITH ORB - The Revolutionary Conversational Interface
 * 
 * The world's first voice-enabled autonomous digital agency interface
 * Features speech-to-text, text-to-speech, and natural conversation flow
 * 
 * Technology Stack:
 * - Web Speech API (SpeechRecognition) for voice input
 * - Web Speech API (speechSynthesis) for voice output
 * - Intent Analysis Agent integration
 * - Localization Agent for multilingual support
 */

interface ConversationTurn {
  speaker: 'user' | 'agent';
  message: string;
  timestamp: Date;
  language?: string;
  confidence?: number;
}

interface ZenithOrbProps {
  onConversationUpdate?: (conversation: ConversationTurn[]) => void;
  defaultLanguage?: string;
  className?: string;
}

export default function ZenithOrb({ 
  onConversationUpdate, 
  defaultLanguage = 'en-US',
  className = ''
}: ZenithOrbProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const lastUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech capabilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const speechSynthesis = window.speechSynthesis;

      if (SpeechRecognition && speechSynthesis) {
        setSpeechSupported(true);
        
        // Initialize speech recognition
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = defaultLanguage;

        recognition.onstart = () => {
          console.log('🎤 Voice recognition started');
          setError(null);
        };

        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          setTranscript(finalTranscript || interimTranscript);

          // Process final transcript
          if (finalTranscript.trim()) {
            handleUserSpeech(finalTranscript.trim(), event.results[event.resultIndex][0].confidence);
          }
        };

        recognition.onerror = (event) => {
          console.error('🚨 Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognition.onend = () => {
          console.log('🎤 Voice recognition ended');
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        synthRef.current = speechSynthesis;
      } else {
        console.warn('Speech APIs not supported in this browser');
        setError('Voice features not supported in this browser');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current && lastUtteranceRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [defaultLanguage]);

  // Handle user speech input
  const handleUserSpeech = async (message: string, confidence: number) => {
    console.log('👤 User said:', message, `(confidence: ${confidence})`);
    
    const userTurn: ConversationTurn = {
      speaker: 'user',
      message,
      timestamp: new Date(),
      language: defaultLanguage,
      confidence
    };

    const newConversation = [...conversation, userTurn];
    setConversation(newConversation);
    onConversationUpdate?.(newConversation);

    // Stop listening while processing
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsProcessing(true);
    setTranscript('');

    try {
      // Send to Intent Analysis Agent
      const response = await fetch('/api/agents/intent-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          clientRequest: message,
          conversationHistory: newConversation.map(turn => ({
            clientMessage: turn.speaker === 'user' ? turn.message : '',
            agentResponse: turn.speaker === 'agent' ? turn.message : '',
            timestamp: turn.timestamp.toISOString(),
            status: 'CLARIFYING' as const
          })).filter(h => h.clientMessage || h.agentResponse)
        })
      });

      if (response.ok) {
        const data = await response.json();
        const agentResponse = await generateAgentResponse(data.analysis);
        await speakAgentResponse(agentResponse);
      } else {
        const fallbackResponse = "I'd be happy to help with that! Could you provide a bit more detail about what you're hoping to achieve?";
        await speakAgentResponse(fallbackResponse);
      }
    } catch (error) {
      console.error('🚨 Error processing speech:', error);
      const errorResponse = "I'm having trouble processing that request right now. Could you try again?";
      await speakAgentResponse(errorResponse);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate contextual agent response
  const generateAgentResponse = async (analysis: any): Promise<string> => {
    if (analysis.confidence > 80) {
      // High confidence - provide direct response
      return `Great! I understand you want to ${analysis.clarifiedGoal.toLowerCase()}. Let me get started on that for you. I'll have the ${analysis.suggestedAgents[0] || 'ContentAgent'} begin working and show you the results for approval shortly.`;
    } else if (analysis.clarifyingQuestions?.length > 0) {
      // Need clarification
      return analysis.clarifyingQuestions[0];
    } else {
      // Generic clarification
      return "That's an interesting request! To make sure I build exactly what you envision, could you tell me a bit more about your specific goals?";
    }
  };

  // Speak agent response using TTS
  const speakAgentResponse = async (message: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        resolve();
        return;
      }

      const agentTurn: ConversationTurn = {
        speaker: 'agent',
        message,
        timestamp: new Date(),
        language: defaultLanguage
      };

      const newConversation = [...conversation, agentTurn];
      setConversation(newConversation);
      onConversationUpdate?.(newConversation);

      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = defaultLanguage;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        console.log('🤖 Agent speaking:', message);
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        console.log('🤖 Agent finished speaking');
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('🚨 Speech synthesis error:', event.error);
        setIsSpeaking(false);
        resolve();
      };

      lastUtteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    });
  };

  // Toggle listening state
  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setError(null);
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Get orb state styling
  const getOrbState = () => {
    if (isProcessing) return 'processing';
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    return 'idle';
  };

  const orbState = getOrbState();

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Conversation Transcript */}
      {showTranscript && conversation.length > 0 && (
        <div className="absolute bottom-20 right-0 w-96 max-h-64 overflow-y-auto backdrop-blur-xl bg-black/80 border border-white/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Conversation</h3>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {conversation.slice(-5).map((turn, index) => (
              <div key={index} className={`text-sm ${turn.speaker === 'user' ? 'text-blue-300' : 'text-green-300'}`}>
                <span className="font-medium">{turn.speaker === 'user' ? 'You' : 'Zenith'}:</span>
                <span className="ml-2">{turn.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Transcript */}
      {isListening && transcript && (
        <div className="absolute bottom-20 right-0 w-80 backdrop-blur-xl bg-blue-500/20 border border-blue-500/30 rounded-2xl p-3 mb-4">
          <div className="text-sm text-blue-300 mb-1">Listening...</div>
          <div className="text-white">{transcript}</div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-20 right-0 w-80 backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-2xl p-3 mb-4">
          <div className="text-sm text-red-300">{error}</div>
        </div>
      )}

      {/* Main Orb */}
      <div className="relative">
        {/* Orb Glow Effects */}
        <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
          orbState === 'listening' ? 'animate-pulse bg-blue-500/40 scale-150 blur-2xl' :
          orbState === 'speaking' ? 'animate-pulse bg-green-500/40 scale-150 blur-2xl' :
          orbState === 'processing' ? 'animate-spin bg-purple-500/40 scale-150 blur-2xl' :
          'bg-gray-500/20 scale-100 blur-xl'
        }`} />

        {/* Primary Orb Button */}
        <button
          onClick={isSpeaking ? stopSpeaking : toggleListening}
          disabled={isProcessing || !speechSupported}
          title={
            orbState === 'processing' ? 'Processing your request...' :
            orbState === 'speaking' ? 'Click to stop speaking' :
            orbState === 'listening' ? 'Click to stop listening' :
            'Click to start voice conversation'
          }
          aria-label={
            orbState === 'processing' ? 'Processing your request' :
            orbState === 'speaking' ? 'Stop speaking' :
            orbState === 'listening' ? 'Stop listening' :
            'Start voice conversation'
          }
          className={`relative w-16 h-16 rounded-full border-2 transition-all duration-300 backdrop-blur-xl ${
            orbState === 'listening' ? 'border-blue-400 bg-blue-500/20 scale-110' :
            orbState === 'speaking' ? 'border-green-400 bg-green-500/20 scale-110' :
            orbState === 'processing' ? 'border-purple-400 bg-purple-500/20 animate-pulse' :
            'border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20 hover:scale-105'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {orbState === 'processing' ? (
            <Sparkles className="w-6 h-6 text-purple-400 mx-auto animate-spin" />
          ) : orbState === 'speaking' ? (
            <Volume2 className="w-6 h-6 text-green-400 mx-auto animate-pulse" />
          ) : orbState === 'listening' ? (
            <Mic className="w-6 h-6 text-blue-400 mx-auto" />
          ) : (
            <Mic className="w-6 h-6 text-white mx-auto" />
          )}
        </button>

        {/* Conversation Toggle */}
        {conversation.length > 0 && (
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            title={showTranscript ? 'Hide conversation history' : 'Show conversation history'}
            aria-label={showTranscript ? 'Hide conversation history' : 'Show conversation history'}
            className="absolute -top-2 -left-2 w-6 h-6 rounded-full backdrop-blur-xl bg-white/20 border border-white/30 hover:bg-white/30 transition-all"
          >
            <MessageCircle className="w-3 h-3 text-white mx-auto" />
          </button>
        )}

        {/* Status Indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black">
          <div className={`w-full h-full rounded-full ${
            orbState === 'listening' ? 'bg-blue-400 animate-pulse' :
            orbState === 'speaking' ? 'bg-green-400 animate-pulse' :
            orbState === 'processing' ? 'bg-purple-400 animate-pulse' :
            speechSupported ? 'bg-gray-400' : 'bg-red-400'
          }`} />
        </div>
      </div>

      {/* Instructions */}
      {!isListening && !isSpeaking && !isProcessing && conversation.length === 0 && (
        <div className="absolute bottom-20 right-0 w-64 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-3 mb-4">
          <div className="text-sm text-white text-center">
            👋 Hey! Click me to start a conversation with Zenith
          </div>
        </div>
      )}
    </div>
  );
}

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}
