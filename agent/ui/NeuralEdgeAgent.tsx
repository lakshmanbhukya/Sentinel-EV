// Neural Edge Agent UI - System-Level Intelligence Interface
// World-class design that integrates seamlessly without overlapping existing components

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentState, FaultEvent, DiagnosisResult } from '../types.js';

export interface NeuralEdgeAgentProps {
  agentState: AgentState;
  isVisible: boolean;
  onClose?: () => void;
  stationId: string;
  className?: string;
}

interface NeuralMessage {
  id: string;
  timestamp: number;
  type: 'system' | 'analysis' | 'action' | 'result';
  content: string;
  phase?: string;
  metadata?: any;
}

export const NeuralEdgeAgent: React.FC<NeuralEdgeAgentProps> = ({
  agentState,
  isVisible,
  onClose,
  stationId,
  className = ''
}) => {
  const [mode, setMode] = useState<'idle' | 'active' | 'resolved'>('idle');
  const [messages, setMessages] = useState<NeuralMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [performance, setPerformance] = useState<{ startTime?: number; duration?: number }>({});
  
  const streamingRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Agent identifier based on station
  const agentId = `AGENT-${stationId.slice(-3).toUpperCase()}`;

  // Monitor agent state changes
  useEffect(() => {
    if (!agentState) return;

    switch (agentState.phase) {
      case 'CRITICAL':
        handleActivation();
        break;
      case 'DIAGNOSING':
        handleDiagnosis();
        break;
      case 'EXECUTING':
        handleExecution();
        break;
      case 'RESOLVED':
        handleResolution();
        break;
      case 'STABLE':
        handleStable();
        break;
    }
  }, [agentState.phase, agentState.currentFault]);

  const addMessage = useCallback((message: Omit<NeuralMessage, 'id' | 'timestamp'>) => {
    const newMessage: NeuralMessage = {
      ...message,
      id: `neural-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const streamMessage = useCallback(async (content: string, type: NeuralMessage['type'] = 'analysis') => {
    setIsStreaming(true);
    setCurrentMessage('');
    
    // Add message placeholder
    const messageId = addMessage({ type, content: '', phase: agentState.phase });
    
    // Stream character by character
    for (let i = 0; i <= content.length; i++) {
      await new Promise(resolve => {
        streamingRef.current = setTimeout(() => {
          setCurrentMessage(content.slice(0, i));
          resolve(void 0);
        }, 40); // 40ms per character for realistic typing
      });
    }
    
    // Update final message
    setMessages(prev => prev.map(msg => 
      msg.id === messageId.id ? { ...msg, content } : msg
    ));
    
    setCurrentMessage('');
    setIsStreaming(false);
  }, [addMessage, agentState.phase]);

  const handleActivation = async () => {
    if (mode === 'active') return;
    
    setMode('active');
    setPerformance({ startTime: Date.now() });
    
    if (agentState.currentFault) {
      await streamMessage(`FAULT DETECTED: ${agentState.currentFault.type.toUpperCase()}`, 'system');
      await new Promise(resolve => setTimeout(resolve, 500));
      await streamMessage(`severity: ${agentState.currentFault.severity}`, 'analysis');
      await streamMessage(`initiating diagnostic protocol...`, 'analysis');
    }
  };

  const handleDiagnosis = async () => {
    await streamMessage('analyzing telemetry patterns', 'analysis');
    await new Promise(resolve => setTimeout(resolve, 800));
    await streamMessage('cross-referencing fault signatures', 'analysis');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (agentState.diagnosis) {
      await streamMessage(`root cause: ${agentState.diagnosis.rootCause}`, 'result');
      await streamMessage(`confidence: ${(agentState.diagnosis.confidence * 100).toFixed(1)}%`, 'result');
    }
  };

  const handleExecution = async () => {
    await streamMessage('executing recovery sequence', 'action');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (agentState.diagnosis?.recommendedActions?.[0]) {
      await streamMessage(`action: ${agentState.diagnosis.recommendedActions[0]}`, 'action');
    }
    
    await streamMessage('monitoring system response', 'action');
  };

  const handleResolution = async () => {
    const duration = performance.startTime ? Date.now() - performance.startTime : 0;
    setPerformance(prev => ({ ...prev, duration }));
    
    await streamMessage('recovery completed successfully', 'result');
    await streamMessage(`execution time: ${(duration / 1000).toFixed(1)}s`, 'system');
    
    setMode('resolved');
    
    // Auto-collapse after 4 seconds
    setTimeout(() => {
      setMode('idle');
      setMessages([]);
    }, 4000);
  };

  const handleStable = () => {
    if (mode === 'resolved') return; // Let resolution complete naturally
    
    setMode('idle');
    setMessages([]);
    setPerformance({});
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentMessage]);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (streamingRef.current) {
        clearTimeout(streamingRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`neural-edge-container ${className}`}>
      <motion.div
        className="neural-edge"
        initial={{ width: 60 }}
        animate={{ 
          width: mode === 'idle' ? 60 : 320,
        }}
        transition={{ 
          duration: 0.3, 
          ease: [0.4, 0, 0.2, 1] 
        }}
      >
        {/* Idle State: Neural Pulse */}
        <AnimatePresence>
          {mode === 'idle' && (
            <motion.div
              className="neural-pulse-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="neural-pulse primary" />
              <div className="neural-pulse secondary" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active/Resolved State: Neural Interface */}
        <AnimatePresence>
          {(mode === 'active' || mode === 'resolved') && (
            <motion.div
              className="neural-interface"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.1 }}
            >
              {/* Agent Header */}
              <div className="neural-header">
                <div className="agent-id">{agentId}</div>
                <div className="system-status">
                  <div className={`status-indicator ${agentState.phase.toLowerCase()}`} />
                  <span className="phase-text">{agentState.phase}</span>
                </div>
              </div>

              {/* Processing Indicator */}
              {mode === 'active' && (
                <div className="processing-indicator">
                  <div className="processing-dots">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              {/* Message Stream */}
              <div className="message-stream">
                {messages.map((message) => (
                  <div key={message.id} className={`neural-message ${message.type}`}>
                    <span className="message-prefix">{'>'}</span>
                    <span className="message-content">{message.content}</span>
                  </div>
                ))}
                
                {/* Current streaming message */}
                {isStreaming && currentMessage && (
                  <div className="neural-message streaming">
                    <span className="message-prefix">{'>'}</span>
                    <span className="message-content">
                      {currentMessage}
                      <span className="cursor" />
                    </span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Performance Metrics */}
              {mode === 'resolved' && performance.duration && (
                <div className="performance-metrics">
                  <div className="metric">
                    <span className="metric-icon">✓</span>
                    <span className="metric-value">{(performance.duration / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .neural-edge-container {
          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 900;
          pointer-events: none;
        }

        .neural-edge {
          background: rgba(15, 23, 42, 0.95);
          border-left: 1px solid rgba(148, 163, 184, 0.1);
          backdrop-filter: blur(12px);
          height: auto;
          max-height: 70vh;
          display: flex;
          flex-direction: column;
          pointer-events: auto;
          border-radius: 8px 0 0 8px;
          overflow: hidden;
        }

        /* Idle State Styles */
        .neural-pulse-container {
          height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
          padding: 20px 0;
        }

        .neural-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(34, 211, 238, 0.6);
        }

        .neural-pulse.primary {
          animation: neural-pulse 3s ease-in-out infinite;
        }

        .neural-pulse.secondary {
          animation: neural-pulse 3s ease-in-out infinite 1.5s;
        }

        @keyframes neural-pulse {
          0%, 100% { 
            opacity: 0.4; 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.4);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.2);
            box-shadow: 0 0 0 8px rgba(34, 211, 238, 0);
          }
        }

        /* Active State Styles */
        .neural-interface {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 200px;
          max-height: calc(70vh - 32px);
        }

        .neural-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          padding-bottom: 12px;
        }

        .agent-id {
          font-family: 'Space Mono', 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          color: rgba(148, 163, 184, 0.8);
          letter-spacing: 0.5px;
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(148, 163, 184, 0.4);
        }

        .status-indicator.critical {
          background: #ef4444;
          animation: pulse-critical 1s ease-in-out infinite;
        }

        .status-indicator.diagnosing {
          background: #f59e0b;
          animation: pulse-warning 1.5s ease-in-out infinite;
        }

        .status-indicator.executing {
          background: #06b6d4;
          animation: pulse-info 1s ease-in-out infinite;
        }

        .status-indicator.resolved {
          background: #10b981;
        }

        .status-indicator.stable {
          background: #10b981;
        }

        @keyframes pulse-critical {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes pulse-warning {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes pulse-info {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .phase-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(226, 232, 240, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Processing Indicator */
        .processing-indicator {
          display: flex;
          justify-content: center;
          padding: 8px 0;
        }

        .processing-dots {
          display: flex;
          gap: 4px;
        }

        .processing-dots span {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(34, 211, 238, 0.6);
          animation: processing-wave 1.5s ease-in-out infinite;
        }

        .processing-dots span:nth-child(1) { animation-delay: 0s; }
        .processing-dots span:nth-child(2) { animation-delay: 0.1s; }
        .processing-dots span:nth-child(3) { animation-delay: 0.2s; }
        .processing-dots span:nth-child(4) { animation-delay: 0.3s; }
        .processing-dots span:nth-child(5) { animation-delay: 0.4s; }
        .processing-dots span:nth-child(6) { animation-delay: 0.5s; }
        .processing-dots span:nth-child(7) { animation-delay: 0.6s; }
        .processing-dots span:nth-child(8) { animation-delay: 0.7s; }

        @keyframes processing-wave {
          0%, 60%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          30% {
            transform: scale(1.4);
            opacity: 1;
          }
        }

        /* Message Stream */
        .message-stream {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.2) transparent;
        }

        .message-stream::-webkit-scrollbar {
          width: 4px;
        }

        .message-stream::-webkit-scrollbar-track {
          background: transparent;
        }

        .message-stream::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 2px;
        }

        .neural-message {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          line-height: 1.4;
        }

        .message-prefix {
          color: rgba(34, 211, 238, 0.8);
          font-weight: 500;
          flex-shrink: 0;
        }

        .message-content {
          color: rgba(226, 232, 240, 0.9);
          word-break: break-word;
        }

        .neural-message.system .message-content {
          color: rgba(34, 211, 238, 0.9);
          font-weight: 500;
        }

        .neural-message.analysis .message-content {
          color: rgba(251, 191, 36, 0.9);
        }

        .neural-message.action .message-content {
          color: rgba(6, 182, 212, 0.9);
        }

        .neural-message.result .message-content {
          color: rgba(16, 185, 129, 0.9);
        }

        .cursor {
          display: inline-block;
          width: 8px;
          height: 14px;
          background: rgba(34, 211, 238, 0.8);
          margin-left: 2px;
          animation: cursor-blink 1s step-end infinite;
        }

        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        /* Performance Metrics */
        .performance-metrics {
          display: flex;
          justify-content: center;
          padding-top: 12px;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
        }

        .metric {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }

        .metric-icon {
          color: rgba(16, 185, 129, 0.9);
          font-weight: 500;
        }

        .metric-value {
          color: rgba(226, 232, 240, 0.9);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .neural-edge-container {
            position: fixed;
            bottom: 0;
            right: 0;
            top: auto;
            transform: none;
            width: 100%;
          }

          .neural-edge {
            width: 100% !important;
            height: auto;
            max-height: 40vh;
            border-radius: 12px 12px 0 0;
            border-left: none;
            border-top: 1px solid rgba(148, 163, 184, 0.1);
          }

          .neural-pulse-container {
            flex-direction: row;
            height: 60px;
            justify-content: center;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default NeuralEdgeAgent;