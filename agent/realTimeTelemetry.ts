// Real-time Telemetry Integration for AI Agent
// Bridges station data with agent telemetry monitoring

import { TelemetryData, FaultEvent } from './types.js';
import { faultDetector } from './faultDetector.js';
import { telemetrySimulator } from './telemetrySimulator.js';

export interface RealTimeTelemetryManager {
  startMonitoring(stationId: string, stationData: any): void;
  stopMonitoring(stationId: string): void;
  getCurrentTelemetry(stationId: string): TelemetryData | null;
  onFaultDetected(callback: (fault: FaultEvent) => void): void;
  getMonitoredStations(): string[];
}

interface MonitoringSession {
  stationId: string;
  intervalId: NodeJS.Timeout;
  lastTelemetry: TelemetryData;
  faultCallbacks: ((fault: FaultEvent) => void)[];
}

export class RealTimeTelemetryManagerImpl implements RealTimeTelemetryManager {
  private sessions = new Map<string, MonitoringSession>();
  private globalFaultCallbacks: ((fault: FaultEvent) => void)[] = [];

  startMonitoring(stationId: string, stationData: any): void {
    // Stop existing monitoring if running
    this.stopMonitoring(stationId);

    // Convert station data to initial telemetry
    const initialTelemetry = this.convertStationToTelemetry(stationData);
    
    // Create monitoring session
    const session: MonitoringSession = {
      stationId,
      intervalId: setInterval(() => {
        this.updateTelemetry(session, stationData);
      }, 2000), // Update every 2 seconds
      lastTelemetry: initialTelemetry,
      faultCallbacks: []
    };

    this.sessions.set(stationId, session);
    
    console.log(`📡 Started telemetry monitoring for station ${stationId}`);
  }

  stopMonitoring(stationId: string): void {
    const session = this.sessions.get(stationId);
    if (session) {
      clearInterval(session.intervalId);
      this.sessions.delete(stationId);
      console.log(`📡 Stopped telemetry monitoring for station ${stationId}`);
    }
  }

  getCurrentTelemetry(stationId: string): TelemetryData | null {
    const session = this.sessions.get(stationId);
    return session ? { ...session.lastTelemetry } : null;
  }

  onFaultDetected(callback: (fault: FaultEvent) => void): void {
    this.globalFaultCallbacks.push(callback);
  }

  getMonitoredStations(): string[] {
    return Array.from(this.sessions.keys());
  }

  private updateTelemetry(session: MonitoringSession, stationData: any): void {
    // Generate realistic telemetry with variations
    const newTelemetry = this.convertStationToTelemetry(stationData);
    
    // Add realistic fluctuations
    newTelemetry.voltage += (Math.random() - 0.5) * 8; // ±4V variation
    newTelemetry.current += (Math.random() - 0.5) * 3; // ±1.5A variation
    newTelemetry.temperature += (Math.random() - 0.5) * 2; // ±1°C variation
    
    // Ensure values stay within reasonable bounds
    newTelemetry.voltage = Math.max(180, Math.min(270, newTelemetry.voltage));
    newTelemetry.current = Math.max(0, Math.min(50, newTelemetry.current));
    newTelemetry.temperature = Math.max(15, Math.min(120, newTelemetry.temperature));
    
    // Update power output
    newTelemetry.powerOutput = (newTelemetry.voltage * newTelemetry.current) / 1000;
    
    // Update timestamp
    newTelemetry.timestamp = Date.now();
    
    // Store updated telemetry
    session.lastTelemetry = newTelemetry;
    
    // Check for faults
    const detectedFault = faultDetector.analyzeTelemetry(newTelemetry);
    if (detectedFault) {
      // Notify all callbacks
      [...this.globalFaultCallbacks, ...session.faultCallbacks].forEach(callback => {
        try {
          callback(detectedFault);
        } catch (error) {
          console.error('Error in fault callback:', error);
        }
      });
    }
  }

  private convertStationToTelemetry(stationData: any): TelemetryData {
    // Enhanced conversion with more realistic mapping
    const baseVoltage = 230;
    const baseCurrent = (stationData.load || 50) / 100 * 32; // Scale load to current
    const baseTemp = stationData.temp || 25;
    
    // Add status-based variations
    let voltageOffset = 0;
    let currentOffset = 0;
    let tempOffset = 0;
    
    switch (stationData.status) {
      case 'critical':
        voltageOffset = Math.random() > 0.5 ? 25 : -25; // Over/under voltage
        currentOffset = Math.random() * 15; // Overcurrent tendency
        tempOffset = Math.random() * 30 + 20; // Overheating
        break;
      case 'warning':
        voltageOffset = (Math.random() - 0.5) * 15; // Moderate voltage variation
        currentOffset = Math.random() * 8; // Moderate current variation
        tempOffset = Math.random() * 15 + 5; // Moderate heating
        break;
      case 'safe':
      default:
        voltageOffset = (Math.random() - 0.5) * 10; // Normal variation
        currentOffset = (Math.random() - 0.5) * 4; // Normal variation
        tempOffset = (Math.random() - 0.5) * 8; // Normal variation
        break;
    }
    
    const voltage = baseVoltage + voltageOffset;
    const current = Math.max(0, baseCurrent + currentOffset);
    const temperature = baseTemp + tempOffset;
    
    return {
      stationId: stationData.id,
      timestamp: Date.now(),
      voltage,
      current,
      temperature,
      powerOutput: (voltage * current) / 1000,
      connectionStatus: stationData.status === 'critical' && Math.random() > 0.7 ? 'error' : 'connected',
      chargingState: stationData.status === 'critical' && Math.random() > 0.8 ? 'fault' : 
                    current > 1 ? 'charging' : 'idle'
    };
  }

  // Add station-specific fault callback
  addStationFaultCallback(stationId: string, callback: (fault: FaultEvent) => void): void {
    const session = this.sessions.get(stationId);
    if (session) {
      session.faultCallbacks.push(callback);
    }
  }

  // Remove station-specific fault callback
  removeStationFaultCallback(stationId: string, callback: (fault: FaultEvent) => void): void {
    const session = this.sessions.get(stationId);
    if (session) {
      const index = session.faultCallbacks.indexOf(callback);
      if (index > -1) {
        session.faultCallbacks.splice(index, 1);
      }
    }
  }

  // Get telemetry history for a station (last N readings)
  getTelemetryHistory(stationId: string, count: number = 10): TelemetryData[] {
    // For now, return simulated history based on current telemetry
    const current = this.getCurrentTelemetry(stationId);
    if (!current) return [];
    
    const history: TelemetryData[] = [];
    const now = Date.now();
    
    for (let i = count - 1; i >= 0; i--) {
      const timestamp = now - (i * 2000); // 2-second intervals
      const variation = (Math.random() - 0.5) * 0.1; // Small historical variation
      
      history.push({
        ...current,
        timestamp,
        voltage: current.voltage + (current.voltage * variation),
        current: Math.max(0, current.current + (current.current * variation)),
        temperature: current.temperature + (current.temperature * variation * 0.5)
      });
    }
    
    return history;
  }

  // Cleanup all monitoring sessions
  cleanup(): void {
    for (const stationId of this.sessions.keys()) {
      this.stopMonitoring(stationId);
    }
    this.globalFaultCallbacks.length = 0;
  }
}

// Export singleton instance
export const realTimeTelemetry = new RealTimeTelemetryManagerImpl();