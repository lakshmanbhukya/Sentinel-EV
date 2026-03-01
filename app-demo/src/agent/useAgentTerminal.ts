// React Hook for managing Agent Terminal state and interactions
// Handles multiple concurrent agent displays and state synchronization

import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentState } from './types.js';

export interface AgentTerminalState {
  stationId: string;
  isVisible: boolean;
  isMinimized: boolean;
  lastActivity: number;
  autoOpenEnabled: boolean;
}

export interface UseAgentTerminalOptions {
  autoOpenOnFault?: boolean;
  autoCloseDelay?: number; // ms to auto-close after resolution
  maxConcurrentTerminals?: number;
  persistState?: boolean;
}

export const useAgentTerminal = (options: UseAgentTerminalOptions = {}) => {
  const {
    autoOpenOnFault = true,
    autoCloseDelay = 10000,
    maxConcurrentTerminals = 5,
    persistState = true
  } = options;

  const [terminals, setTerminals] = useState<Map<string, AgentTerminalState>>(new Map());
  const [agentStates, setAgentStates] = useState<Map<string, AgentState>>(new Map());
  const autoCloseTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Initialize terminal for a station
  const initializeTerminal = useCallback((stationId: string) => {
    setTerminals(prev => {
      const newTerminals = new Map(prev);
      if (!newTerminals.has(stationId)) {
        newTerminals.set(stationId, {
          stationId,
          isVisible: false,
          isMinimized: false,
          lastActivity: Date.now(),
          autoOpenEnabled: autoOpenOnFault
        });
      }
      return newTerminals;
    });
  }, [autoOpenOnFault]);

  // Update agent state for a station
  const updateAgentState = useCallback((stationId: string, newState: AgentState) => {
    setAgentStates(prev => {
      const newStates = new Map(prev);
      newStates.set(stationId, newState);
      return newStates;
    });

    // Initialize terminal if it doesn't exist
    initializeTerminal(stationId);

    // Auto-open terminal on fault detection
    if (autoOpenOnFault && newState.phase === 'CRITICAL' && newState.currentFault) {
      openTerminal(stationId);
    }

    // Auto-close terminal after resolution
    if (newState.phase === 'STABLE' && autoCloseDelay > 0) {
      const existingTimer = autoCloseTimers.current.get(stationId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        closeTerminal(stationId);
        autoCloseTimers.current.delete(stationId);
      }, autoCloseDelay);

      autoCloseTimers.current.set(stationId, timer);
    }
  }, [autoOpenOnFault, autoCloseDelay, initializeTerminal]);

  // Open terminal for a station
  const openTerminal = useCallback((stationId: string) => {
    // Enforce maximum concurrent terminals
    const visibleTerminals = Array.from(terminals.values()).filter(t => t.isVisible);
    if (visibleTerminals.length >= maxConcurrentTerminals) {
      // Close the oldest terminal
      const oldestTerminal = visibleTerminals.reduce((oldest, current) => 
        current.lastActivity < oldest.lastActivity ? current : oldest
      );
      closeTerminal(oldestTerminal.stationId);
    }

    setTerminals(prev => {
      const newTerminals = new Map(prev);
      const terminal = newTerminals.get(stationId);
      if (terminal) {
        newTerminals.set(stationId, {
          ...terminal,
          isVisible: true,
          isMinimized: false,
          lastActivity: Date.now()
        });
      }
      return newTerminals;
    });

    // Clear any pending auto-close timer
    const existingTimer = autoCloseTimers.current.get(stationId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      autoCloseTimers.current.delete(stationId);
    }
  }, [terminals, maxConcurrentTerminals]);

  // Close terminal for a station
  const closeTerminal = useCallback((stationId: string) => {
    setTerminals(prev => {
      const newTerminals = new Map(prev);
      const terminal = newTerminals.get(stationId);
      if (terminal) {
        newTerminals.set(stationId, {
          ...terminal,
          isVisible: false,
          isMinimized: false
        });
      }
      return newTerminals;
    });

    // Clear any auto-close timer
    const existingTimer = autoCloseTimers.current.get(stationId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      autoCloseTimers.current.delete(stationId);
    }
  }, []);

  // Toggle terminal visibility
  const toggleTerminal = useCallback((stationId: string) => {
    const terminal = terminals.get(stationId);
    if (terminal?.isVisible) {
      closeTerminal(stationId);
    } else {
      openTerminal(stationId);
    }
  }, [terminals, openTerminal, closeTerminal]);

  // Minimize/maximize terminal
  const toggleMinimize = useCallback((stationId: string) => {
    setTerminals(prev => {
      const newTerminals = new Map(prev);
      const terminal = newTerminals.get(stationId);
      if (terminal) {
        newTerminals.set(stationId, {
          ...terminal,
          isMinimized: !terminal.isMinimized,
          lastActivity: Date.now()
        });
      }
      return newTerminals;
    });
  }, []);

  // Get terminal state for a station
  const getTerminalState = useCallback((stationId: string): AgentTerminalState | undefined => {
    return terminals.get(stationId);
  }, [terminals]);

  // Get agent state for a station
  const getAgentState = useCallback((stationId: string): AgentState | undefined => {
    return agentStates.get(stationId);
  }, [agentStates]);

  // Get all visible terminals
  const getVisibleTerminals = useCallback((): AgentTerminalState[] => {
    return Array.from(terminals.values()).filter(t => t.isVisible);
  }, [terminals]);

  // Close all terminals
  const closeAllTerminals = useCallback(() => {
    setTerminals(prev => {
      const newTerminals = new Map(prev);
      for (const [stationId, terminal] of newTerminals) {
        newTerminals.set(stationId, {
          ...terminal,
          isVisible: false,
          isMinimized: false
        });
      }
      return newTerminals;
    });

    // Clear all auto-close timers
    for (const timer of autoCloseTimers.current.values()) {
      clearTimeout(timer);
    }
    autoCloseTimers.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const timer of autoCloseTimers.current.values()) {
        clearTimeout(timer);
      }
      autoCloseTimers.current.clear();
    };
  }, []);

  // Persist state to localStorage if enabled
  useEffect(() => {
    if (persistState && terminals.size > 0) {
      const terminalData = Array.from(terminals.entries());
      localStorage.setItem('agentTerminals', JSON.stringify(terminalData));
    }
  }, [terminals, persistState]);

  // Restore state from localStorage on mount
  useEffect(() => {
    if (persistState) {
      const savedData = localStorage.getItem('agentTerminals');
      if (savedData) {
        try {
          const terminalData = JSON.parse(savedData) as [string, AgentTerminalState][];
          const restoredTerminals = new Map<string, AgentTerminalState>(terminalData);
          
          // Only restore non-visible terminals to avoid auto-opening on page load
          for (const [stationId, terminal] of restoredTerminals) {
            restoredTerminals.set(stationId, {
              ...terminal,
              isVisible: false,
              isMinimized: false
            });
          }
          
          setTerminals(restoredTerminals);
        } catch (error) {
          console.warn('Failed to restore agent terminal state:', error);
        }
      }
    }
  }, [persistState]);

  return {
    // State
    terminals: Array.from(terminals.values()),
    visibleTerminals: getVisibleTerminals(),
    
    // Actions
    initializeTerminal,
    updateAgentState,
    openTerminal,
    closeTerminal,
    toggleTerminal,
    toggleMinimize,
    closeAllTerminals,
    
    // Getters
    getTerminalState,
    getAgentState,
    
    // Utilities
    isTerminalVisible: (stationId: string) => terminals.get(stationId)?.isVisible || false,
    isTerminalMinimized: (stationId: string) => terminals.get(stationId)?.isMinimized || false,
    getActiveTerminalCount: () => getVisibleTerminals().length
  };
};

export default useAgentTerminal;