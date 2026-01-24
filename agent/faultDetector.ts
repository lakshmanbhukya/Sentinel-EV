// Fault Detector for Self-Healing AI Agent
// Analyzes telemetry streams to identify anomalous conditions using threshold-based rules

import { TelemetryData, FaultEvent, FaultType, FaultThresholds } from './types.js';

export interface FaultDetector {
  analyzeTelemetry(data: TelemetryData): FaultEvent | null;
  setThresholds(stationId: string, thresholds: FaultThresholds): void;
  getActiveFaults(stationId: string): FaultEvent[];
  clearFaults(stationId: string): void;
}

interface FaultHistory {
  stationId: string;
  activeFaults: Map<string, FaultEvent>;
  thresholds: FaultThresholds;
  lastAnalysis: number;
}

export class FaultDetectorImpl implements FaultDetector {
  private stationHistory = new Map<string, FaultHistory>();
  
  // Default thresholds based on requirements
  private readonly DEFAULT_THRESHOLDS: FaultThresholds = {
    voltage: { min: 200, max: 250 },
    current: { max: 32 },
    temperature: { max: 60 }, // Critical temperature threshold
    responseTime: 100 // 100ms fault detection requirement
  };

  // Fault severity classification rules
  private readonly SEVERITY_RULES = {
    overvoltage: (voltage: number) => voltage > 270 ? 'critical' : 'warning',
    undervoltage: (voltage: number) => voltage < 180 ? 'critical' : 'warning',
    overcurrent: (current: number) => current > 40 ? 'critical' : 'warning',
    overtemperature: (temp: number) => temp > 70 ? 'critical' : 'warning',
    connection_lost: () => 'critical' as const,
    charging_stalled: () => 'critical' as const
  };

  analyzeTelemetry(data: TelemetryData): FaultEvent | null {
    const startTime = performance.now();
    
    // Get or create station history
    const history = this.getStationHistory(data.stationId);
    
    // Analyze telemetry for faults
    const detectedFault = this.detectFaults(data, history.thresholds);
    
    if (detectedFault) {
      // Add to active faults if not already present
      const existingFault = history.activeFaults.get(detectedFault.type);
      if (!existingFault) {
        history.activeFaults.set(detectedFault.type, detectedFault);
      }
      
      // Update analysis timestamp
      history.lastAnalysis = performance.now();
      
      // Verify we met the 100ms requirement
      const analysisTime = history.lastAnalysis - startTime;
      if (analysisTime > history.thresholds.responseTime) {
        console.warn(`Fault detection exceeded ${history.thresholds.responseTime}ms: ${analysisTime}ms`);
      }
      
      return detectedFault;
    }
    
    // Clear any resolved faults
    this.clearResolvedFaults(data, history);
    
    history.lastAnalysis = performance.now();
    return null;
  }

  setThresholds(stationId: string, thresholds: FaultThresholds): void {
    const history = this.getStationHistory(stationId);
    history.thresholds = { ...thresholds };
  }

  getActiveFaults(stationId: string): FaultEvent[] {
    const history = this.stationHistory.get(stationId);
    if (!history) {
      return [];
    }
    
    // Return faults sorted by priority (critical first, then by detection time)
    const faults = Array.from(history.activeFaults.values());
    return this.prioritizeFaults(faults);
  }

  clearFaults(stationId: string): void {
    const history = this.stationHistory.get(stationId);
    if (history) {
      history.activeFaults.clear();
    }
  }

  // Get fault count for a specific station
  getFaultCount(stationId: string): number {
    const history = this.stationHistory.get(stationId);
    return history ? history.activeFaults.size : 0;
  }

  // Check if a specific fault type is active
  hasFaultType(stationId: string, faultType: FaultType): boolean {
    const history = this.stationHistory.get(stationId);
    return history ? history.activeFaults.has(faultType) : false;
  }

  private getStationHistory(stationId: string): FaultHistory {
    let history = this.stationHistory.get(stationId);
    if (!history) {
      history = {
        stationId,
        activeFaults: new Map(),
        thresholds: { ...this.DEFAULT_THRESHOLDS },
        lastAnalysis: 0
      };
      this.stationHistory.set(stationId, history);
    }
    return history;
  }

  private detectFaults(data: TelemetryData, thresholds: FaultThresholds): FaultEvent | null {
    const faults: Array<{ type: FaultType; severity: 'warning' | 'critical'; description: string }> = [];

    // Voltage fault detection
    if (data.voltage > thresholds.voltage.max) {
      faults.push({
        type: 'overvoltage',
        severity: this.SEVERITY_RULES.overvoltage(data.voltage),
        description: `Voltage ${data.voltage.toFixed(1)}V exceeds maximum ${thresholds.voltage.max}V`
      });
    } else if (data.voltage < thresholds.voltage.min) {
      faults.push({
        type: 'undervoltage',
        severity: this.SEVERITY_RULES.undervoltage(data.voltage),
        description: `Voltage ${data.voltage.toFixed(1)}V below minimum ${thresholds.voltage.min}V`
      });
    }

    // Current fault detection
    if (data.current > thresholds.current.max) {
      faults.push({
        type: 'overcurrent',
        severity: this.SEVERITY_RULES.overcurrent(data.current),
        description: `Current ${data.current.toFixed(1)}A exceeds maximum ${thresholds.current.max}A`
      });
    }

    // Temperature fault detection
    if (data.temperature > thresholds.temperature.max) {
      faults.push({
        type: 'overtemperature',
        severity: this.SEVERITY_RULES.overtemperature(data.temperature),
        description: `Temperature ${data.temperature.toFixed(1)}°C exceeds maximum ${thresholds.temperature.max}°C`
      });
    }

    // Connection status fault detection
    if (data.connectionStatus === 'error') {
      faults.push({
        type: 'connection_lost',
        severity: this.SEVERITY_RULES.connection_lost(),
        description: 'Connection to charging station lost'
      });
    }

    // Charging state fault detection
    if (data.chargingState === 'fault' || (data.chargingState === 'charging' && data.current === 0)) {
      faults.push({
        type: 'charging_stalled',
        severity: this.SEVERITY_RULES.charging_stalled(),
        description: 'Charging process has stalled or failed'
      });
    }

    // Return the highest priority fault if any detected
    if (faults.length > 0) {
      const prioritizedFaults = this.prioritizeFaultTypes(faults);
      const topFault = prioritizedFaults[0];
      
      return {
        id: this.generateFaultId(data.stationId, topFault.type),
        stationId: data.stationId,
        type: topFault.type,
        severity: topFault.severity,
        detectedAt: data.timestamp,
        telemetrySnapshot: { ...data },
        description: topFault.description
      };
    }

    return null;
  }

  private prioritizeFaults(faults: FaultEvent[]): FaultEvent[] {
    return faults.sort((a, b) => {
      // Critical faults first
      if (a.severity === 'critical' && b.severity === 'warning') return -1;
      if (a.severity === 'warning' && b.severity === 'critical') return 1;
      
      // Then by fault type priority
      const priorityOrder: FaultType[] = [
        'connection_lost',
        'overtemperature', 
        'overcurrent',
        'overvoltage',
        'undervoltage',
        'charging_stalled'
      ];
      
      const aPriority = priorityOrder.indexOf(a.type);
      const bPriority = priorityOrder.indexOf(b.type);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Finally by detection time (earliest first)
      return a.detectedAt - b.detectedAt;
    });
  }

  private prioritizeFaultTypes(faults: Array<{ type: FaultType; severity: 'warning' | 'critical'; description: string }>): Array<{ type: FaultType; severity: 'warning' | 'critical'; description: string }> {
    return faults.sort((a, b) => {
      // Critical faults first
      if (a.severity === 'critical' && b.severity === 'warning') return -1;
      if (a.severity === 'warning' && b.severity === 'critical') return 1;
      
      // Then by fault type priority
      const priorityOrder: FaultType[] = [
        'connection_lost',
        'overtemperature',
        'overcurrent', 
        'overvoltage',
        'undervoltage',
        'charging_stalled'
      ];
      
      const aPriority = priorityOrder.indexOf(a.type);
      const bPriority = priorityOrder.indexOf(b.type);
      
      return aPriority - bPriority;
    });
  }

  private clearResolvedFaults(data: TelemetryData, history: FaultHistory): void {
    const resolvedFaults: FaultType[] = [];
    
    // Check if previously detected faults are now resolved
    for (const [faultType, fault] of history.activeFaults) {
      let isResolved = false;
      
      switch (faultType) {
        case 'overvoltage':
          isResolved = data.voltage <= history.thresholds.voltage.max;
          break;
        case 'undervoltage':
          isResolved = data.voltage >= history.thresholds.voltage.min;
          break;
        case 'overcurrent':
          isResolved = data.current <= history.thresholds.current.max;
          break;
        case 'overtemperature':
          isResolved = data.temperature <= history.thresholds.temperature.max;
          break;
        case 'connection_lost':
          isResolved = data.connectionStatus === 'connected';
          break;
        case 'charging_stalled':
          isResolved = data.chargingState === 'charging' && data.current > 0;
          break;
      }
      
      if (isResolved) {
        resolvedFaults.push(faultType);
      }
    }
    
    // Remove resolved faults
    resolvedFaults.forEach(faultType => {
      history.activeFaults.delete(faultType);
    });
  }

  private generateFaultId(stationId: string, faultType: FaultType): string {
    const timestamp = Date.now();
    return `${stationId}-${faultType}-${timestamp}`;
  }
}

// Export singleton instance for convenience
export const faultDetector = new FaultDetectorImpl();