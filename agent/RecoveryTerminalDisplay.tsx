// Recovery Terminal Display - Shows recovery progress in Agent Terminal
import React, { useEffect, useState } from 'react';

export interface RecoveryProgress {
  phase: 'critical' | 'warning' | 'safe';
  progress: number;
  currentTemp: number;
  currentLoad: number;
  currentEfficiency: number;
  currentUptime: number;
  message: string;
}

interface RecoveryTerminalDisplayProps {
  stationId: string;
  recoveryProgress: RecoveryProgress | null;
}

export const RecoveryTerminalDisplay: React.FC<RecoveryTerminalDisplayProps> = ({
  stationId,
  recoveryProgress
}) => {
  const [messages, setMessages] = useState<Array<{ text: string; timestamp: number }>>([]);
  const [lastProgress, setLastProgress] = useState(0);

  useEffect(() => {
    if (!recoveryProgress) return;

    // Add message when progress milestones are reached
    const currentProgress = recoveryProgress.progress;
    const milestones = [0, 10, 25, 50, 75, 90, 100];
    
    for (const milestone of milestones) {
      if (lastProgress < milestone && currentProgress >= milestone) {
        setMessages(prev => [...prev, {
          text: recoveryProgress.message,
          timestamp: Date.now()
        }]);
        break;
      }
    }
    
    setLastProgress(currentProgress);
  }, [recoveryProgress, lastProgress]);

  if (!recoveryProgress) return null;

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'critical': return '#ff4444';
      case 'warning': return '#ffaa00';
      case 'safe': return '#00ff88';
      default: return '#00ff41';
    }
  };

  const getMetricColor = (value: number, type: 'temp' | 'load' | 'efficiency') => {
    if (type === 'temp') {
      if (value > 100) return '#ff4444';
      if (value > 80) return '#ffaa00';
      return '#00ff88';
    } else if (type === 'load') {
      if (value > 90) return '#ff4444';
      if (value > 75) return '#ffaa00';
      return '#00ff88';
    } else { // efficiency
      if (value < 80) return '#ff4444';
      if (value < 90) return '#ffaa00';
      return '#00ff88';
    }
  };

  return (
    <div style={{
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
      fontSize: '11px',
      color: '#00ff41',
      padding: '12px',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '4px',
      marginTop: '8px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: `1px solid ${getPhaseColor(recoveryProgress.phase)}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>🔄</span>
          <span style={{ color: getPhaseColor(recoveryProgress.phase), fontWeight: 'bold' }}>
            RECOVERY IN PROGRESS
          </span>
        </div>
        <span style={{ 
          fontSize: '16px', 
          fontWeight: 'bold',
          color: getPhaseColor(recoveryProgress.phase)
        }}>
          {recoveryProgress.progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#1a1a1a',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '12px',
        border: '1px solid #333'
      }}>
        <div style={{
          width: `${recoveryProgress.progress}%`,
          height: '100%',
          backgroundColor: getPhaseColor(recoveryProgress.phase),
          transition: 'width 0.3s ease',
          boxShadow: `0 0 10px ${getPhaseColor(recoveryProgress.phase)}`
        }} />
      </div>

      {/* Current Status */}
      <div style={{
        marginBottom: '12px',
        padding: '8px',
        backgroundColor: 'rgba(0, 255, 65, 0.05)',
        borderLeft: `3px solid ${getPhaseColor(recoveryProgress.phase)}`,
        fontSize: '10px'
      }}>
        <div style={{ color: '#888', marginBottom: '4px' }}>STATUS:</div>
        <div style={{ color: getPhaseColor(recoveryProgress.phase) }}>
          {recoveryProgress.message}
        </div>
      </div>

      {/* Live Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <div style={{
          padding: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '3px',
          border: '1px solid #333'
        }}>
          <div style={{ color: '#666', fontSize: '9px', marginBottom: '2px' }}>TEMPERATURE</div>
          <div style={{ 
            color: getMetricColor(recoveryProgress.currentTemp, 'temp'),
            fontWeight: 'bold',
            fontSize: '13px'
          }}>
            {recoveryProgress.currentTemp}°C
          </div>
        </div>

        <div style={{
          padding: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '3px',
          border: '1px solid #333'
        }}>
          <div style={{ color: '#666', fontSize: '9px', marginBottom: '2px' }}>LOAD</div>
          <div style={{ 
            color: getMetricColor(recoveryProgress.currentLoad, 'load'),
            fontWeight: 'bold',
            fontSize: '13px'
          }}>
            {recoveryProgress.currentLoad}%
          </div>
        </div>

        <div style={{
          padding: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '3px',
          border: '1px solid #333'
        }}>
          <div style={{ color: '#666', fontSize: '9px', marginBottom: '2px' }}>EFFICIENCY</div>
          <div style={{ 
            color: getMetricColor(recoveryProgress.currentEfficiency, 'efficiency'),
            fontWeight: 'bold',
            fontSize: '13px'
          }}>
            {recoveryProgress.currentEfficiency}%
          </div>
        </div>

        <div style={{
          padding: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '3px',
          border: '1px solid #333'
        }}>
          <div style={{ color: '#666', fontSize: '9px', marginBottom: '2px' }}>PHASE</div>
          <div style={{ 
            color: getPhaseColor(recoveryProgress.phase),
            fontWeight: 'bold',
            fontSize: '11px',
            textTransform: 'uppercase'
          }}>
            {recoveryProgress.phase}
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      {messages.length > 0 && (
        <div style={{
          maxHeight: '100px',
          overflowY: 'auto',
          fontSize: '9px',
          color: '#666',
          padding: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '3px'
        }}>
          <div style={{ marginBottom: '4px', color: '#888' }}>RECOVERY LOG:</div>
          {messages.slice(-5).map((msg, idx) => (
            <div key={idx} style={{ marginBottom: '2px', color: '#00ff41' }}>
              <span style={{ color: '#666' }}>
                [{new Date(msg.timestamp).toLocaleTimeString()}]
              </span> {msg.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecoveryTerminalDisplay;
