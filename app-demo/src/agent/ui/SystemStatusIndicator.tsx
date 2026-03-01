// System Status Indicator - Minimal, elegant system intelligence indicator
// Integrates seamlessly with existing UI without visual competition

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SystemStatusIndicatorProps {
  isAgentEnabled: boolean;
  activeAgentCount: number;
  systemHealth: 'optimal' | 'monitoring' | 'responding' | 'critical';
  onToggleAgent: () => void;
  className?: string;
}

export const SystemStatusIndicator: React.FC<SystemStatusIndicatorProps> = ({
  isAgentEnabled,
  activeAgentCount,
  systemHealth,
  onToggleAgent,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Update activity timestamp when agent count changes
  useEffect(() => {
    if (activeAgentCount > 0) {
      setLastActivity(Date.now());
    }
  }, [activeAgentCount]);

  // Auto-collapse after period of inactivity
  useEffect(() => {
    if (activeAgentCount === 0 && isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeAgentCount, isExpanded]);

  const getHealthColor = () => {
    switch (systemHealth) {
      case 'optimal': return '#10b981';
      case 'monitoring': return '#06b6d4';
      case 'responding': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getHealthLabel = () => {
    switch (systemHealth) {
      case 'optimal': return 'OPTIMAL';
      case 'monitoring': return 'MONITORING';
      case 'responding': return 'RESPONDING';
      case 'critical': return 'CRITICAL';
      default: return 'OFFLINE';
    }
  };

  return (
    <div className={`system-status-indicator ${className}`}>
      <motion.div
        className="status-container"
        initial={false}
        animate={{
          width: isExpanded ? 180 : 44,
          height: isExpanded ? 'auto' : 44
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onHoverStart={() => setIsExpanded(true)}
        onHoverEnd={() => activeAgentCount === 0 && setIsExpanded(false)}
      >
        {/* Collapsed State - Neural Pulse */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              className="status-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggleAgent}
            >
              <div 
                className={`neural-pulse ${systemHealth}`}
                style={{ backgroundColor: getHealthColor() }}
              />
              {activeAgentCount > 0 && (
                <div className="agent-count-badge">
                  {activeAgentCount}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded State - System Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="status-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="status-header">
                <div className="system-label">NEURAL GRID</div>
                <button
                  className="toggle-button"
                  onClick={onToggleAgent}
                  title={isAgentEnabled ? 'Disable AI System' : 'Enable AI System'}
                >
                  <div className={`toggle-indicator ${isAgentEnabled ? 'enabled' : 'disabled'}`} />
                </button>
              </div>

              <div className="status-details">
                <div className="health-status">
                  <div 
                    className="health-indicator"
                    style={{ backgroundColor: getHealthColor() }}
                  />
                  <span className="health-label">{getHealthLabel()}</span>
                </div>

                {isAgentEnabled && (
                  <div className="agent-stats">
                    <div className="stat">
                      <span className="stat-value">{activeAgentCount}</span>
                      <span className="stat-label">ACTIVE</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .system-status-indicator {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1200;
          pointer-events: auto;
        }

        .status-container {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 22px;
          backdrop-filter: blur(12px);
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.3s ease;
        }

        .status-container:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        /* Collapsed State */
        .status-collapsed {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .neural-pulse {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          position: relative;
        }

        .neural-pulse.optimal {
          animation: pulse-gentle 3s ease-in-out infinite;
        }

        .neural-pulse.monitoring {
          animation: pulse-active 2s ease-in-out infinite;
        }

        .neural-pulse.responding {
          animation: pulse-urgent 1.5s ease-in-out infinite;
        }

        .neural-pulse.critical {
          animation: pulse-critical 1s ease-in-out infinite;
        }

        @keyframes pulse-gentle {
          0%, 100% { 
            opacity: 0.6; 
            transform: scale(1);
            box-shadow: 0 0 0 0 currentColor;
          }
          50% { 
            opacity: 1; 
            transform: scale(1.1);
            box-shadow: 0 0 0 4px transparent;
          }
        }

        @keyframes pulse-active {
          0%, 100% { 
            opacity: 0.7; 
            transform: scale(1);
            box-shadow: 0 0 0 0 currentColor;
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2);
            box-shadow: 0 0 0 6px transparent;
          }
        }

        @keyframes pulse-urgent {
          0%, 100% { 
            opacity: 0.8; 
            transform: scale(1);
            box-shadow: 0 0 0 0 currentColor;
          }
          50% { 
            opacity: 1; 
            transform: scale(1.3);
            box-shadow: 0 0 0 8px transparent;
          }
        }

        @keyframes pulse-critical {
          0%, 100% { 
            opacity: 0.9; 
            transform: scale(1);
            box-shadow: 0 0 0 0 currentColor;
          }
          50% { 
            opacity: 1; 
            transform: scale(1.4);
            box-shadow: 0 0 0 10px transparent;
          }
        }

        .agent-count-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          background: #ef4444;
          border: 2px solid rgba(15, 23, 42, 0.95);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          color: white;
        }

        /* Expanded State */
        .status-expanded {
          padding: 12px 16px;
          min-width: 180px;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .system-label {
          font-family: 'Space Mono', 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: rgba(34, 211, 238, 0.9);
          letter-spacing: 0.5px;
        }

        .toggle-button {
          background: none;
          border: none;
          padding: 2px;
          cursor: pointer;
          border-radius: 10px;
          transition: background-color 0.2s ease;
        }

        .toggle-button:hover {
          background: rgba(148, 163, 184, 0.1);
        }

        .toggle-indicator {
          width: 16px;
          height: 10px;
          border-radius: 5px;
          position: relative;
          transition: all 0.3s ease;
        }

        .toggle-indicator.enabled {
          background: rgba(16, 185, 129, 0.3);
        }

        .toggle-indicator.disabled {
          background: rgba(148, 163, 184, 0.3);
        }

        .toggle-indicator::after {
          content: '';
          position: absolute;
          top: 1px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .toggle-indicator.enabled::after {
          right: 1px;
          background: #10b981;
        }

        .toggle-indicator.disabled::after {
          left: 1px;
          background: #64748b;
        }

        .status-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .health-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .health-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .health-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(226, 232, 240, 0.9);
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .agent-stats {
          display: flex;
          gap: 12px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          color: rgba(34, 211, 238, 0.9);
          line-height: 1;
        }

        .stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          color: rgba(148, 163, 184, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .system-status-indicator {
            top: 15px;
            left: 15px;
          }

          .status-expanded {
            padding: 10px 12px;
            min-width: 160px;
          }

          .system-label {
            font-size: 10px;
          }

          .health-label {
            font-size: 9px;
          }
        }

        @media (max-width: 480px) {
          .system-status-indicator {
            top: 10px;
            left: 10px;
          }

          .status-container {
            border-radius: 20px;
          }

          .status-collapsed {
            width: 40px;
            height: 40px;
          }

          .neural-pulse {
            width: 10px;
            height: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default SystemStatusIndicator;