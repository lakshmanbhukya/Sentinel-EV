// Agent Terminal UI Component for Self-Healing AI Agent
// Real-time display of agent reasoning and actions with agentic AI narrative

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgentState, FaultEvent, DiagnosisResult, RecoveryResult } from './types.js';
import { RecoveryTerminalDisplay } from './RecoveryTerminalDisplay.js';

// Import recovery store from app-demo
// @ts-ignore - Cross-boundary import
import { useRecoveryStore } from '../app-demo/src/store/useRecoveryStore.ts';

export interface TerminalProps {
  agentState: AgentState;
  isVisible: boolean;
  onClose: () => void;
  stationId: string;
  autoOpen?: boolean;
}

interface TerminalMessage {
  id: string;
  timestamp: number;
  type: 'thinking' | 'action' | 'result' | 'error' | 'system';
  content: string;
  delay?: number;
  progress?: number; // 0-100 for progress indicators
  metadata?: any;
}

interface AgentPersonality {
  name: string;
  avatar: string;
  thinkingStyle: 'analytical' | 'methodical' | 'rapid' | 'thorough';
  communicationStyle: 'technical' | 'friendly' | 'concise' | 'detailed';
}

export const AgentTerminal: React.FC<TerminalProps> = ({
  agentState,
  isVisible,
  onClose,
  stationId,
  autoOpen = true
}) => {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [personality] = useState<AgentPersonality>({
    name: `Agent-${stationId.slice(-3).toUpperCase()}`,
    avatar: '🤖',
    thinkingStyle: 'analytical',
    communicationStyle: 'technical'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Get recovery progress from store
  const { getRecoveryProgress } = useRecoveryStore();
  const recoveryProgress = getRecoveryProgress(stationId);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Monitor agent state changes and generate appropriate messages
  useEffect(() => {
    if (!agentState) return;

    const handleStateChange = async () => {
      switch (agentState.phase) {
        case 'CRITICAL':
          if (agentState.currentFault) {
            await handleFaultDetected(agentState.currentFault);
          }
          break;
        case 'DIAGNOSING':
          await handleDiagnosisPhase();
          break;
        case 'EXECUTING':
          await handleExecutionPhase();
          break;
        case 'RESOLVED':
          await handleResolutionPhase();
          break;
        case 'STABLE':
          await handleStablePhase();
          break;
      }
    };

    handleStateChange();
  }, [agentState.phase, agentState.currentFault]);

  const addMessage = useCallback((message: Omit<TerminalMessage, 'id' | 'timestamp'>) => {
    const newMessage: TerminalMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const addThinkingMessage = useCallback(async (content: string, delay: number = 1000) => {
    const message = addMessage({
      type: 'thinking',
      content,
      delay
    });

    // Simulate thinking delay with typing effect
    await new Promise(resolve => setTimeout(resolve, delay));
    return message;
  }, [addMessage]);

  const addActionMessage = useCallback(async (content: string, estimatedDuration: number = 2000) => {
    const message = addMessage({
      type: 'action',
      content,
      progress: 0
    });

    // Simulate action progress
    setIsProcessing(true);
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / estimatedDuration) * 100);
      setCurrentProgress(progress);

      if (progress >= 100) {
        clearInterval(progressInterval);
        setIsProcessing(false);
        setCurrentProgress(0);
      }
    }, 50);

    await new Promise(resolve => setTimeout(resolve, estimatedDuration));
    return message;
  }, [addMessage]);

  const handleFaultDetected = async (fault: FaultEvent) => {
    addMessage({
      type: 'system',
      content: `🚨 FAULT DETECTED: ${fault.type.toUpperCase()}`,
      metadata: { severity: fault.severity, faultId: fault.id }
    });

    await addThinkingMessage(
      `Analyzing ${fault.type} fault... Severity: ${fault.severity}`,
      800
    );

    await addThinkingMessage(
      `Telemetry snapshot captured. Voltage: ${fault.telemetrySnapshot.voltage.toFixed(1)}V, Current: ${fault.telemetrySnapshot.current.toFixed(1)}A, Temperature: ${fault.telemetrySnapshot.temperature.toFixed(1)}°C`,
      1200
    );

    await addThinkingMessage(
      `Fault classification complete. Initiating diagnosis protocol...`,
      600
    );
  };

  const handleDiagnosisPhase = async () => {
    await addThinkingMessage(
      `🔍 Entering diagnosis mode. Analyzing telemetry patterns...`,
      1000
    );

    await addThinkingMessage(
      `Evaluating diagnosis rules... Checking historical data patterns...`,
      1500
    );

    await addThinkingMessage(
      `Cross-referencing fault signatures with known patterns...`,
      1200
    );

    if (agentState.diagnosis) {
      await addThinkingMessage(
        `✅ Diagnosis complete. Root cause: ${agentState.diagnosis.rootCause}`,
        800
      );

      await addThinkingMessage(
        `Confidence level: ${(agentState.diagnosis.confidence * 100).toFixed(1)}%. Preparing recovery plan...`,
        600
      );
    }
  };

  const handleExecutionPhase = async () => {
    await addThinkingMessage(
      `⚡ Initiating recovery sequence. Selecting optimal recovery actions...`,
      800
    );

    if (agentState.diagnosis) {
      const estimatedTime = agentState.diagnosis.estimatedRecoveryTime || 3000;
      
      await addActionMessage(
        `Executing recovery procedure: ${agentState.diagnosis.recommendedActions[0] || 'Primary recovery action'}`,
        estimatedTime
      );

      await addThinkingMessage(
        `Monitoring recovery progress... Validating system response...`,
        1000
      );
    }
  };

  const handleResolutionPhase = async () => {
    await addThinkingMessage(
      `✅ Recovery actions completed. Verifying system stability...`,
      1000
    );

    await addThinkingMessage(
      `Running post-recovery diagnostics... All systems nominal.`,
      800
    );

    addMessage({
      type: 'result',
      content: `🎯 RESOLUTION SUCCESSFUL: Fault resolved and system restored to normal operation.`,
      metadata: { success: true }
    });

    // Auto-minimize after successful resolution
    setTimeout(() => {
      if (autoOpen) {
        setIsMinimized(true);
      }
    }, 3000);
  };

  const handleStablePhase = async () => {
    if (messages.length > 0) {
      await addThinkingMessage(
        `🟢 System stable. Returning to monitoring mode...`,
        600
      );
    }

    addMessage({
      type: 'system',
      content: `📊 Monitoring station ${stationId} - All systems operational`,
      metadata: { monitoring: true }
    });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getMessageIcon = (type: TerminalMessage['type']) => {
    switch (type) {
      case 'thinking': return '🧠';
      case 'action': return '⚡';
      case 'result': return '✅';
      case 'error': return '❌';
      case 'system': return '📡';
      default: return '💬';
    }
  };

  const getMessageClass = (type: TerminalMessage['type']) => {
    const baseClass = 'terminal-message';
    switch (type) {
      case 'thinking': return `${baseClass} thinking`;
      case 'action': return `${baseClass} action`;
      case 'result': return `${baseClass} result`;
      case 'error': return `${baseClass} error`;
      case 'system': return `${baseClass} system`;
      default: return baseClass;
    }
  };

  const clearTerminal = () => {
    setMessages([]);
    setCurrentProgress(0);
    setIsProcessing(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      ref={terminalRef}
      className={`agent-terminal ${isMinimized ? 'minimized' : ''}`}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: isMinimized ? '300px' : '500px',
        height: isMinimized ? '60px' : '400px',
        backgroundColor: '#1a1a1a',
        border: '2px solid #00ff41',
        borderRadius: '8px',
        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
        fontSize: '12px',
        color: '#00ff41',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 20px rgba(0, 255, 65, 0.3)'
      }}
    >
      {/* Terminal Header */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: '#2a2a2a',
          borderBottom: isMinimized ? 'none' : '1px solid #00ff41',
          borderRadius: '6px 6px 0 0',
          cursor: 'pointer'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{personality.avatar}</span>
          <span style={{ fontWeight: 'bold' }}>{personality.name}</span>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>
            [{agentState.phase}]
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isMinimized && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); clearTerminal(); }}
                style={{
                  background: 'none',
                  border: '1px solid #00ff41',
                  color: '#00ff41',
                  padding: '2px 6px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  borderRadius: '3px'
                }}
              >
                CLEAR
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                style={{
                  background: 'none',
                  border: '1px solid #ff4444',
                  color: '#ff4444',
                  padding: '2px 6px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  borderRadius: '3px'
                }}
              >
                ✕
              </button>
            </>
          )}
          
          <span style={{ fontSize: '10px', cursor: 'pointer' }}>
            {isMinimized ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Terminal Content */}
      {!isMinimized && (
        <div 
          style={{
            height: 'calc(100% - 50px)',
            overflow: 'auto',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={getMessageClass(message.type)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '4px',
                borderRadius: '4px',
                backgroundColor: message.type === 'system' ? 'rgba(0, 255, 65, 0.1)' : 'transparent',
                animation: 'fadeIn 0.3s ease-in'
              }}
            >
              <span style={{ minWidth: '16px' }}>
                {getMessageIcon(message.type)}
              </span>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>
                  {formatTimestamp(message.timestamp)}
                </div>
                
                <div style={{ lineHeight: '1.4' }}>
                  {message.content}
                </div>
                
                {message.type === 'action' && isProcessing && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      backgroundColor: '#333',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${currentProgress}%`,
                        height: '100%',
                        backgroundColor: '#00ff41',
                        transition: 'width 0.1s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.7 }}>
                      Progress: {currentProgress.toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Recovery Progress Display */}
          {recoveryProgress && (
            <RecoveryTerminalDisplay 
              stationId={stationId}
              recoveryProgress={recoveryProgress}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Minimized Status */}
      {isMinimized && (
        <div style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: agentState.phase === 'STABLE' ? '#00ff41' : '#ffaa00',
            animation: agentState.phase !== 'STABLE' ? 'pulse 1s infinite' : 'none'
          }} />
          <span>Station {stationId} - {agentState.phase}</span>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .agent-terminal::-webkit-scrollbar {
          width: 6px;
        }
        
        .agent-terminal::-webkit-scrollbar-track {
          background: #2a2a2a;
        }
        
        .agent-terminal::-webkit-scrollbar-thumb {
          background: #00ff41;
          border-radius: 3px;
        }
        
        .terminal-message.thinking {
          color: #88ccff;
        }
        
        .terminal-message.action {
          color: #ffaa00;
        }
        
        .terminal-message.result {
          color: #00ff88;
        }
        
        .terminal-message.error {
          color: #ff4444;
        }
        
        .terminal-message.system {
          color: #00ff41;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default AgentTerminal;