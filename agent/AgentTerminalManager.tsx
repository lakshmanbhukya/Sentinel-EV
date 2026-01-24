// Agent Terminal Manager Component
// Manages multiple concurrent agent terminals with proper positioning and isolation

import React, { useEffect, useState } from 'react';
import AgentTerminal from './AgentTerminal.js';
import { useAgentTerminal } from './useAgentTerminal.js';
import { AgentState } from './types.js';

export interface AgentTerminalManagerProps {
  agentStates: Map<string, AgentState>;
  onTerminalClose?: (stationId: string) => void;
  maxConcurrentTerminals?: number;
  autoOpenOnFault?: boolean;
  terminalSpacing?: number;
}

export const AgentTerminalManager: React.FC<AgentTerminalManagerProps> = ({
  agentStates,
  onTerminalClose,
  maxConcurrentTerminals = 5,
  autoOpenOnFault = true,
  terminalSpacing = 20
}) => {
  const {
    visibleTerminals,
    updateAgentState,
    closeTerminal,
    getAgentState,
    isTerminalVisible
  } = useAgentTerminal({
    autoOpenOnFault,
    maxConcurrentTerminals,
    autoCloseDelay: 15000, // 15 seconds auto-close after resolution
    persistState: true
  });

  // Sync agent states with the terminal manager
  useEffect(() => {
    for (const [stationId, agentState] of agentStates) {
      updateAgentState(stationId, agentState);
    }
  }, [agentStates, updateAgentState]);

  // Calculate terminal positions to avoid overlap
  const calculateTerminalPosition = (index: number, isMinimized: boolean) => {
    const terminalWidth = isMinimized ? 300 : 500;
    const terminalHeight = isMinimized ? 60 : 400;
    
    // Position terminals in a grid pattern from bottom-right
    const maxColumns = Math.floor((window.innerWidth - 40) / (terminalWidth + terminalSpacing));
    const column = index % maxColumns;
    const row = Math.floor(index / maxColumns);
    
    return {
      right: 20 + column * (terminalWidth + terminalSpacing),
      bottom: 20 + row * (terminalHeight + terminalSpacing)
    };
  };

  const handleTerminalClose = (stationId: string) => {
    closeTerminal(stationId);
    onTerminalClose?.(stationId);
  };

  return (
    <>
      {visibleTerminals.map((terminal, index) => {
        const agentState = getAgentState(terminal.stationId);
        if (!agentState) return null;

        const position = calculateTerminalPosition(index, terminal.isMinimized);

        return (
          <div
            key={terminal.stationId}
            style={{
              position: 'fixed',
              right: `${position.right}px`,
              bottom: `${position.bottom}px`,
              zIndex: 1000 + index,
              transition: 'all 0.3s ease'
            }}
          >
            <AgentTerminal
              agentState={agentState}
              isVisible={true}
              onClose={() => handleTerminalClose(terminal.stationId)}
              stationId={terminal.stationId}
              autoOpen={autoOpenOnFault}
            />
          </div>
        );
      })}
      
      {/* Terminal Overview Panel (when multiple terminals are active) */}
      {visibleTerminals.length > 1 && (
        <TerminalOverviewPanel
          terminals={visibleTerminals}
          agentStates={agentStates}
          onTerminalSelect={(stationId) => {
            // Bring selected terminal to front by updating z-index
            const terminalElement = document.querySelector(`[data-station-id="${stationId}"]`);
            if (terminalElement) {
              (terminalElement as HTMLElement).style.zIndex = '2000';
            }
          }}
          onCloseAll={() => {
            visibleTerminals.forEach(terminal => {
              handleTerminalClose(terminal.stationId);
            });
          }}
        />
      )}
    </>
  );
};

// Overview panel for managing multiple terminals
interface TerminalOverviewPanelProps {
  terminals: Array<{ stationId: string; isMinimized: boolean }>;
  agentStates: Map<string, AgentState>;
  onTerminalSelect: (stationId: string) => void;
  onCloseAll: () => void;
}

const TerminalOverviewPanel: React.FC<TerminalOverviewPanelProps> = ({
  terminals,
  agentStates,
  onTerminalSelect,
  onCloseAll
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (phase: AgentState['phase']) => {
    switch (phase) {
      case 'STABLE': return '#00ff41';
      case 'CRITICAL': return '#ff4444';
      case 'DIAGNOSING': return '#ffaa00';
      case 'EXECUTING': return '#00aaff';
      case 'RESOLVED': return '#00ff88';
      default: return '#888888';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#1a1a1a',
        border: '2px solid #00ff41',
        borderRadius: '8px',
        padding: '8px',
        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
        fontSize: '11px',
        color: '#00ff41',
        zIndex: 2100,
        minWidth: '200px',
        maxWidth: '300px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isExpanded ? '8px' : '0',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>🤖 Active Agents ({terminals.length})</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onCloseAll(); }}
            style={{
              background: 'none',
              border: '1px solid #ff4444',
              color: '#ff4444',
              padding: '2px 6px',
              fontSize: '9px',
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            CLOSE ALL
          </button>
          <span>{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {terminals.map(terminal => {
            const agentState = agentStates.get(terminal.stationId);
            if (!agentState) return null;

            return (
              <div
                key={terminal.stationId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 6px',
                  backgroundColor: 'rgba(0, 255, 65, 0.1)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: `1px solid ${getStatusColor(agentState.phase)}`
                }}
                onClick={() => onTerminalSelect(terminal.stationId)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(agentState.phase)
                    }}
                  />
                  <span>{terminal.stationId}</span>
                </div>
                
                <div style={{ fontSize: '9px', opacity: 0.7 }}>
                  {agentState.phase}
                  {terminal.isMinimized && ' (MIN)'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentTerminalManager;