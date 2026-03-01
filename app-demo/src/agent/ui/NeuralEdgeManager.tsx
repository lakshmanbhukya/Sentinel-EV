// Neural Edge Manager - Orchestrates multiple AI agents with spatial intelligence
// Maintains visual hierarchy and prevents overlap with existing UI components

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralEdgeAgent } from './NeuralEdgeAgent.js';
import { AgentState } from '../types.js';

export interface NeuralEdgeManagerProps {
  agentStates: Map<string, AgentState>;
  onAgentClose?: (stationId: string) => void;
  maxConcurrentAgents?: number;
  className?: string;
}

interface ManagedAgent {
  stationId: string;
  agentState: AgentState;
  isVisible: boolean;
  priority: number; // Higher priority = closer to center
  lastActivity: number;
}

export const NeuralEdgeManager: React.FC<NeuralEdgeManagerProps> = ({
  agentStates,
  onAgentClose,
  maxConcurrentAgents = 3,
  className = ''
}) => {
  const [managedAgents, setManagedAgents] = useState<Map<string, ManagedAgent>>(new Map());
  const [activeAgentCount, setActiveAgentCount] = useState(0);

  // Calculate priority based on agent state
  const calculatePriority = (agentState: AgentState): number => {
    switch (agentState.phase) {
      case 'CRITICAL': return 100;
      case 'EXECUTING': return 80;
      case 'DIAGNOSING': return 60;
      case 'RESOLVED': return 40;
      case 'STABLE': return 20;
      default: return 10;
    }
  };

  // Update managed agents when agent states change
  useEffect(() => {
    setManagedAgents(prev => {
      const updated = new Map(prev);
      
      // Update existing agents and add new ones
      for (const [stationId, agentState] of agentStates) {
        const existing = updated.get(stationId);
        const priority = calculatePriority(agentState);
        const shouldBeVisible = agentState.phase !== 'STABLE';
        
        updated.set(stationId, {
          stationId,
          agentState,
          isVisible: shouldBeVisible,
          priority,
          lastActivity: existing?.lastActivity || Date.now()
        });
      }
      
      // Remove agents that are no longer in the state map
      for (const [stationId] of updated) {
        if (!agentStates.has(stationId)) {
          updated.delete(stationId);
        }
      }
      
      return updated;
    });
  }, [agentStates]);

  // Manage visibility based on concurrent limit
  useEffect(() => {
    const visibleAgents = Array.from(managedAgents.values())
      .filter(agent => agent.isVisible)
      .sort((a, b) => {
        // Sort by priority first, then by last activity
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.lastActivity - a.lastActivity;
      });

    if (visibleAgents.length > maxConcurrentAgents) {
      // Hide lower priority agents
      const agentsToHide = visibleAgents.slice(maxConcurrentAgents);
      
      setManagedAgents(prev => {
        const updated = new Map(prev);
        agentsToHide.forEach(agent => {
          const current = updated.get(agent.stationId);
          if (current) {
            updated.set(agent.stationId, { ...current, isVisible: false });
          }
        });
        return updated;
      });
    }

    setActiveAgentCount(Math.min(visibleAgents.length, maxConcurrentAgents));
  }, [managedAgents, maxConcurrentAgents]);

  // Calculate positioning for multiple agents
  const calculateAgentPosition = (index: number, total: number) => {
    if (total === 1) {
      return { right: 0, top: '50%', transform: 'translateY(-50%)' };
    }

    // Vertical distribution for multiple agents
    const spacing = Math.min(300, (window.innerHeight * 0.7) / total);
    const startY = (window.innerHeight - (spacing * (total - 1))) / 2;
    
    return {
      right: 0,
      top: startY + (spacing * index),
      transform: 'none'
    };
  };

  const handleAgentClose = useCallback((stationId: string) => {
    setManagedAgents(prev => {
      const updated = new Map(prev);
      const agent = updated.get(stationId);
      if (agent) {
        updated.set(stationId, { ...agent, isVisible: false });
      }
      return updated;
    });
    
    onAgentClose?.(stationId);
  }, [onAgentClose]);

  // Get visible agents sorted by priority
  const visibleAgents = Array.from(managedAgents.values())
    .filter(agent => agent.isVisible)
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.lastActivity - a.lastActivity;
    })
    .slice(0, maxConcurrentAgents);

  return (
    <div className={`neural-edge-manager ${className}`}>
      <AnimatePresence mode="popLayout">
        {visibleAgents.map((agent, index) => {
          const position = calculateAgentPosition(index, visibleAgents.length);
          
          return (
            <motion.div
              key={agent.stationId}
              className="neural-agent-container"
              style={position}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
                delay: index * 0.1
              }}
              layout
            >
              <NeuralEdgeAgent
                agentState={agent.agentState}
                isVisible={true}
                onClose={() => handleAgentClose(agent.stationId)}
                stationId={agent.stationId}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Multi-Agent Coordinator (shows when multiple agents are active) */}
      <AnimatePresence>
        {visibleAgents.length > 1 && (
          <motion.div
            className="neural-coordinator"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }}
          >
            <div className="coordinator-header">
              <div className="coordinator-title">NEURAL GRID</div>
              <div className="coordinator-count">{visibleAgents.length} ACTIVE</div>
            </div>
            
            <div className="coordinator-agents">
              {visibleAgents.map((agent, index) => (
                <div key={agent.stationId} className="coordinator-agent">
                  <div className={`agent-indicator ${agent.agentState.phase.toLowerCase()}`} />
                  <div className="agent-info">
                    <div className="agent-station">{agent.stationId}</div>
                    <div className="agent-phase">{agent.agentState.phase}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .neural-edge-manager {
          position: fixed;
          top: 0;
          right: 0;
          width: 0;
          height: 100vh;
          pointer-events: none;
          z-index: 900;
        }

        .neural-agent-container {
          position: absolute;
          pointer-events: auto;
        }

        /* Multi-Agent Coordinator */
        .neural-coordinator {
          position: fixed;
          top: 20px;
          right: 80px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 8px;
          backdrop-filter: blur(12px);
          padding: 12px;
          min-width: 200px;
          pointer-events: auto;
          z-index: 950;
        }

        .coordinator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .coordinator-title {
          font-family: 'Space Mono', 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: rgba(34, 211, 238, 0.9);
          letter-spacing: 0.5px;
        }

        .coordinator-count {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.8);
          background: rgba(34, 211, 238, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .coordinator-agents {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .coordinator-agent {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px;
          border-radius: 4px;
          background: rgba(148, 163, 184, 0.05);
        }

        .agent-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .agent-indicator.critical {
          background: #ef4444;
          animation: pulse-critical 1s ease-in-out infinite;
        }

        .agent-indicator.diagnosing {
          background: #f59e0b;
          animation: pulse-warning 1.5s ease-in-out infinite;
        }

        .agent-indicator.executing {
          background: #06b6d4;
          animation: pulse-info 1s ease-in-out infinite;
        }

        .agent-indicator.resolved {
          background: #10b981;
        }

        .agent-indicator.stable {
          background: #10b981;
        }

        .agent-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .agent-station {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(226, 232, 240, 0.9);
          font-weight: 500;
        }

        .agent-phase {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(148, 163, 184, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .neural-coordinator {
            top: 10px;
            right: 10px;
            left: 10px;
            right: auto;
            width: calc(100% - 20px);
            max-width: 300px;
          }

          .coordinator-agents {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .coordinator-agent {
            flex: 1;
            min-width: 120px;
          }
        }

        @media (max-width: 480px) {
          .neural-coordinator {
            padding: 8px;
          }

          .coordinator-header {
            margin-bottom: 8px;
          }

          .coordinator-title {
            font-size: 10px;
          }

          .coordinator-count {
            font-size: 9px;
            padding: 1px 4px;
          }
        }

        /* Animation Keyframes */
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
      `}</style>
    </div>
  );
};

export default NeuralEdgeManager;