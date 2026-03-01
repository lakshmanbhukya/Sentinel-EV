// Diagnosis Engine for Self-Healing AI Agent
// Determines root causes of detected faults using rule-based decision trees

import { FaultEvent, DiagnosisResult, TelemetryData, FaultType } from './types.js';

export interface DiagnosisEngine {
  diagnose(fault: FaultEvent, telemetryHistory: TelemetryData[]): DiagnosisResult;
  addDiagnosisRule(rule: DiagnosisRule): void;
  explainReasoning(diagnosis: DiagnosisResult): string[];
}

interface DiagnosisRule {
  id: string;
  faultType: FaultType;
  condition: (fault: FaultEvent, history: TelemetryData[]) => boolean;
  rootCause: string;
  confidence: number;
  reasoning: string[];
  recommendedActions: string[];
  estimatedRecoveryTime: number;
}

interface DiagnosisContext {
  fault: FaultEvent;
  telemetryHistory: TelemetryData[];
  currentTelemetry: TelemetryData;
  historicalTrends: {
    voltageStability: number;
    currentStability: number;
    temperatureTrend: number;
    connectionReliability: number;
  };
}

export class DiagnosisEngineImpl implements DiagnosisEngine {
  private rules: Map<FaultType, DiagnosisRule[]> = new Map();
  
  constructor() {
    this.initializeDefaultRules();
  }

  diagnose(fault: FaultEvent, telemetryHistory: TelemetryData[]): DiagnosisResult {
    const context = this.buildDiagnosisContext(fault, telemetryHistory);
    
    // Get applicable rules for this fault type
    const applicableRules = this.rules.get(fault.type) || [];
    
    // Evaluate rules and find matches
    const matchingRules = applicableRules.filter(rule => 
      rule.condition(fault, telemetryHistory)
    );
    
    if (matchingRules.length === 0) {
      // No specific rule matched, use fallback diagnosis
      return this.createFallbackDiagnosis(fault, context);
    }
    
    // Sort by confidence and select the best match
    const bestRule = matchingRules.sort((a, b) => b.confidence - a.confidence)[0];
    
    // Build detailed reasoning
    const reasoning = this.generateReasoning(fault, context, bestRule);
    
    return {
      faultId: fault.id,
      rootCause: bestRule.rootCause,
      confidence: this.calculateConfidence(fault, context, bestRule),
      reasoning,
      recommendedActions: [...bestRule.recommendedActions],
      estimatedRecoveryTime: bestRule.estimatedRecoveryTime
    };
  }

  addDiagnosisRule(rule: DiagnosisRule): void {
    if (!this.rules.has(rule.faultType)) {
      this.rules.set(rule.faultType, []);
    }
    this.rules.get(rule.faultType)!.push(rule);
  }

  explainReasoning(diagnosis: DiagnosisResult): string[] {
    return [
      `Root cause identified: ${diagnosis.rootCause}`,
      `Confidence level: ${(diagnosis.confidence * 100).toFixed(1)}%`,
      `Estimated recovery time: ${diagnosis.estimatedRecoveryTime}ms`,
      ...diagnosis.reasoning,
      `Recommended actions: ${diagnosis.recommendedActions.join(', ')}`
    ];
  }

  private initializeDefaultRules(): void {
    // Overvoltage diagnosis rules
    this.addDiagnosisRule({
      id: 'overvoltage-grid-surge',
      faultType: 'overvoltage',
      condition: (fault, history) => {
        const telemetry = fault.telemetrySnapshot;
        return telemetry.voltage > 270 && this.hasRapidVoltageIncrease(history);
      },
      rootCause: 'Grid voltage surge detected',
      confidence: 0.9,
      reasoning: [
        'Voltage exceeded critical threshold (>270V)',
        'Rapid voltage increase pattern detected in telemetry history',
        'Indicates external grid instability or surge event'
      ],
      recommendedActions: ['Activate voltage regulation', 'Isolate from grid temporarily', 'Monitor grid stability'],
      estimatedRecoveryTime: 2000
    });

    this.addDiagnosisRule({
      id: 'overvoltage-regulator-failure',
      faultType: 'overvoltage',
      condition: (fault, history) => {
        const telemetry = fault.telemetrySnapshot;
        return telemetry.voltage > 250 && telemetry.voltage <= 270 && this.hasGradualVoltageIncrease(history);
      },
      rootCause: 'Voltage regulator malfunction',
      confidence: 0.85,
      reasoning: [
        'Voltage above normal range but below surge levels',
        'Gradual voltage increase suggests internal regulation failure',
        'Voltage regulator unable to maintain proper output'
      ],
      recommendedActions: ['Reset voltage regulator', 'Calibrate voltage control system', 'Switch to backup regulator'],
      estimatedRecoveryTime: 3000
    });

    // Undervoltage diagnosis rules
    this.addDiagnosisRule({
      id: 'undervoltage-grid-sag',
      faultType: 'undervoltage',
      condition: (fault, history) => {
        const telemetry = fault.telemetrySnapshot;
        return telemetry.voltage < 180 && this.hasRapidVoltageDecrease(history);
      },
      rootCause: 'Grid voltage sag or brownout',
      confidence: 0.9,
      reasoning: [
        'Voltage dropped below critical threshold (<180V)',
        'Rapid voltage decrease indicates external grid issue',
        'Grid supply insufficient for charging requirements'
      ],
      recommendedActions: ['Switch to backup power', 'Reduce charging rate', 'Monitor grid recovery'],
      estimatedRecoveryTime: 1500
    });

    this.addDiagnosisRule({
      id: 'undervoltage-connection-resistance',
      faultType: 'undervoltage',
      condition: (fault, history) => {
        const telemetry = fault.telemetrySnapshot;
        return telemetry.voltage >= 180 && telemetry.current > 20 && this.hasVoltageCurrentCorrelation(history);
      },
      rootCause: 'High connection resistance or loose connections',
      confidence: 0.8,
      reasoning: [
        'Voltage drop correlates with high current draw',
        'Indicates resistance in charging circuit',
        'Connection integrity compromised'
      ],
      recommendedActions: ['Check connection integrity', 'Clean charging contacts', 'Tighten connections'],
      estimatedRecoveryTime: 2500
    });

    // Overcurrent diagnosis rules
    this.addDiagnosisRule({
      id: 'overcurrent-short-circuit',
      faultType: 'overcurrent',
      condition: (fault, history) => {
        const telemetry = fault.telemetrySnapshot;
        return telemetry.current > 40 && this.hasRapidCurrentIncrease(history);
      },
      rootCause: 'Short circuit in charging path',
      confidence: 0.95,
      reasoning: [
        'Current exceeded safe limits (>40A)',
        'Rapid current increase indicates short circuit',
        'Immediate isolation required for safety'
      ],
      recommendedActions: ['Immediate circuit isolation', 'Inspect charging cables', 'Reset protection systems'],
      estimatedRecoveryTime: 4000
    });

    this.addDiagnosisRule({
      id: 'overcurrent-vehicle-malfunction',
      faultType: 'overcurrent',
      condition: (fault, history) => {
        const telemetry = fault.telemetrySnapshot;
        return telemetry.current > 32 && telemetry.current <= 40 && this.hasStableVoltage(history);
      },
      rootCause: 'Vehicle charging system malfunction',
      confidence: 0.8,
      reasoning: [
        'Current above normal range but voltage stable',
        'Indicates vehicle-side charging control failure',
        'Vehicle requesting excessive current'
      ],
      recommendedActions: ['Limit charging current', 'Communicate with vehicle BMS', 'Restart charging session'],
      estimatedRecoveryTime: 3000
    });

    // Overtemperature diagnosis rules
    this.addDiagnosisRule({
      id: 'overtemperature-cooling-failure',
      faultType: 'overtemperature',
      condition: (fault, history) => {
        const telemetry = fault.telemetrySnapshot;
        return telemetry.temperature > 70 && this.hasRapidTemperatureIncrease(history);
      },
      rootCause: 'Cooling system failure',
      confidence: 0.9,
      reasoning: [
        'Temperature exceeded critical threshold (>70°C)',
        'Rapid temperature rise indicates cooling system failure',
        'Thermal management system not functioning'
      ],
      recommendedActions: ['Activate emergency cooling', 'Reduce power output', 'Check cooling system'],
      estimatedRecoveryTime: 5000
    });

    this.addDiagnosisRule({
      id: 'overtemperature-ambient-heat',
      faultType: 'overtemperature',
      condition: (fault, history) => {
        const telemetry = fault.telemetrySnapshot;
        return telemetry.temperature > 60 && telemetry.temperature <= 70 && this.hasGradualTemperatureIncrease(history);
      },
      rootCause: 'High ambient temperature or poor ventilation',
      confidence: 0.75,
      reasoning: [
        'Temperature above normal but below critical levels',
        'Gradual temperature increase suggests environmental factors',
        'Ambient conditions affecting thermal performance'
      ],
      recommendedActions: ['Increase cooling fan speed', 'Reduce charging rate', 'Monitor ambient conditions'],
      estimatedRecoveryTime: 3500
    });

    // Connection lost diagnosis rules
    this.addDiagnosisRule({
      id: 'connection-lost-cable-disconnect',
      faultType: 'connection_lost',
      condition: (fault, history) => {
        return this.hasAbruptConnectionLoss(history);
      },
      rootCause: 'Physical cable disconnection',
      confidence: 0.85,
      reasoning: [
        'Abrupt loss of connection signal',
        'No gradual degradation observed',
        'Physical disconnection most likely cause'
      ],
      recommendedActions: ['Check cable connection', 'Verify charging port integrity', 'Reset connection'],
      estimatedRecoveryTime: 2000
    });

    this.addDiagnosisRule({
      id: 'connection-lost-communication-failure',
      faultType: 'connection_lost',
      condition: (fault, history) => {
        return this.hasGradualConnectionDegradation(history);
      },
      rootCause: 'Communication system failure',
      confidence: 0.8,
      reasoning: [
        'Gradual connection degradation observed',
        'Communication protocol failure likely',
        'Control pilot signal issues'
      ],
      recommendedActions: ['Reset communication system', 'Check control pilot circuit', 'Restart charging protocol'],
      estimatedRecoveryTime: 3000
    });

    // Charging stalled diagnosis rules
    this.addDiagnosisRule({
      id: 'charging-stalled-vehicle-full',
      faultType: 'charging_stalled',
      condition: (fault, history) => {
        const telemetry = fault.telemetrySnapshot;
        return telemetry.current === 0 && this.hasGradualCurrentDecrease(history);
      },
      rootCause: 'Vehicle battery fully charged',
      confidence: 0.9,
      reasoning: [
        'Current gradually decreased to zero',
        'Normal charging completion pattern',
        'Vehicle battery management system stopped charging'
      ],
      recommendedActions: ['Confirm charging completion', 'Update session status', 'Prepare for disconnection'],
      estimatedRecoveryTime: 1000
    });

    this.addDiagnosisRule({
      id: 'charging-stalled-system-fault',
      faultType: 'charging_stalled',
      condition: (fault, history) => {
        const telemetry = fault.telemetrySnapshot;
        return telemetry.current === 0 && this.hasAbruptCurrentStop(history);
      },
      rootCause: 'Charging system internal fault',
      confidence: 0.85,
      reasoning: [
        'Abrupt current cessation during active charging',
        'No gradual tapering observed',
        'Internal system fault likely cause'
      ],
      recommendedActions: ['Reset charging system', 'Run system diagnostics', 'Check internal components'],
      estimatedRecoveryTime: 4000
    });
  }

  private buildDiagnosisContext(fault: FaultEvent, telemetryHistory: TelemetryData[]): DiagnosisContext {
    const currentTelemetry = fault.telemetrySnapshot;
    
    return {
      fault,
      telemetryHistory,
      currentTelemetry,
      historicalTrends: {
        voltageStability: this.calculateVoltageStability(telemetryHistory),
        currentStability: this.calculateCurrentStability(telemetryHistory),
        temperatureTrend: this.calculateTemperatureTrend(telemetryHistory),
        connectionReliability: this.calculateConnectionReliability(telemetryHistory)
      }
    };
  }

  private generateReasoning(fault: FaultEvent, context: DiagnosisContext, rule: DiagnosisRule): string[] {
    const reasoning = [...rule.reasoning];
    
    // Add context-specific reasoning
    const telemetry = context.currentTelemetry;
    
    reasoning.push(`Current readings: ${telemetry.voltage.toFixed(1)}V, ${telemetry.current.toFixed(1)}A, ${telemetry.temperature.toFixed(1)}°C`);
    
    if (context.telemetryHistory.length > 0) {
      reasoning.push(`Based on analysis of ${context.telemetryHistory.length} historical data points`);
    }
    
    // Add trend analysis
    if (context.historicalTrends.voltageStability < 0.8) {
      reasoning.push('Voltage instability detected in recent history');
    }
    
    if (context.historicalTrends.temperatureTrend > 0.5) {
      reasoning.push('Rising temperature trend observed');
    }
    
    return reasoning;
  }

  private calculateConfidence(fault: FaultEvent, context: DiagnosisContext, rule: DiagnosisRule): number {
    let confidence = rule.confidence;
    
    // Adjust confidence based on data quality
    if (context.telemetryHistory.length < 5) {
      confidence *= 0.9; // Reduce confidence with limited history
    }
    
    // Adjust based on fault severity
    if (fault.severity === 'critical') {
      confidence *= 1.05; // Slightly increase confidence for critical faults
    }
    
    // Ensure confidence stays within bounds
    return Math.min(1.0, Math.max(0.1, confidence));
  }

  private createFallbackDiagnosis(fault: FaultEvent, context: DiagnosisContext): DiagnosisResult {
    const fallbackDiagnoses = {
      overvoltage: {
        rootCause: 'Voltage regulation issue',
        actions: ['Check voltage regulator', 'Monitor grid stability', 'Reset power systems'],
        time: 3000
      },
      undervoltage: {
        rootCause: 'Power supply insufficiency',
        actions: ['Check power supply', 'Verify grid connection', 'Test backup systems'],
        time: 2500
      },
      overcurrent: {
        rootCause: 'Current control malfunction',
        actions: ['Limit current output', 'Check circuit integrity', 'Reset current controls'],
        time: 3500
      },
      overtemperature: {
        rootCause: 'Thermal management failure',
        actions: ['Activate cooling systems', 'Reduce power output', 'Check thermal sensors'],
        time: 4000
      },
      connection_lost: {
        rootCause: 'Connection system failure',
        actions: ['Check physical connections', 'Reset communication', 'Verify cable integrity'],
        time: 2000
      },
      charging_stalled: {
        rootCause: 'Charging process interruption',
        actions: ['Restart charging sequence', 'Check vehicle communication', 'Reset charging system'],
        time: 3000
      }
    };

    const fallback = fallbackDiagnoses[fault.type];
    
    return {
      faultId: fault.id,
      rootCause: fallback.rootCause,
      confidence: 0.6, // Lower confidence for fallback diagnosis
      reasoning: [
        'No specific diagnosis rule matched the fault pattern',
        'Using general diagnosis based on fault type',
        'Limited telemetry history available for detailed analysis',
        `Fault type: ${fault.type}, Severity: ${fault.severity}`
      ],
      recommendedActions: fallback.actions,
      estimatedRecoveryTime: fallback.time
    };
  }

  // Telemetry analysis helper methods
  private hasRapidVoltageIncrease(history: TelemetryData[]): boolean {
    if (history.length < 3) return false;
    const recent = history.slice(-3);
    return recent[2].voltage - recent[0].voltage > 20; // >20V increase in 3 readings
  }

  private hasGradualVoltageIncrease(history: TelemetryData[]): boolean {
    if (history.length < 5) return false;
    const recent = history.slice(-5);
    let increases = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].voltage > recent[i-1].voltage) increases++;
    }
    return increases >= 3; // Majority of readings show increase
  }

  private hasRapidVoltageDecrease(history: TelemetryData[]): boolean {
    if (history.length < 3) return false;
    const recent = history.slice(-3);
    return recent[0].voltage - recent[2].voltage > 20; // >20V decrease in 3 readings
  }

  private hasVoltageCurrentCorrelation(history: TelemetryData[]): boolean {
    if (history.length < 4) return false;
    const recent = history.slice(-4);
    // Check if voltage drops when current increases
    let correlations = 0;
    for (let i = 1; i < recent.length; i++) {
      const voltageChange = recent[i].voltage - recent[i-1].voltage;
      const currentChange = recent[i].current - recent[i-1].current;
      if (voltageChange < 0 && currentChange > 0) correlations++;
    }
    return correlations >= 2;
  }

  private hasRapidCurrentIncrease(history: TelemetryData[]): boolean {
    if (history.length < 3) return false;
    const recent = history.slice(-3);
    return recent[2].current - recent[0].current > 15; // >15A increase in 3 readings
  }

  private hasStableVoltage(history: TelemetryData[]): boolean {
    if (history.length < 4) return false;
    const recent = history.slice(-4);
    const voltages = recent.map(t => t.voltage);
    const avg = voltages.reduce((sum, v) => sum + v, 0) / voltages.length;
    return voltages.every(v => Math.abs(v - avg) < 5); // Within 5V of average
  }

  private hasRapidTemperatureIncrease(history: TelemetryData[]): boolean {
    if (history.length < 4) return false;
    const recent = history.slice(-4);
    return recent[3].temperature - recent[0].temperature > 15; // >15°C increase in 4 readings
  }

  private hasGradualTemperatureIncrease(history: TelemetryData[]): boolean {
    if (history.length < 5) return false;
    const recent = history.slice(-5);
    let increases = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].temperature > recent[i-1].temperature) increases++;
    }
    return increases >= 3;
  }

  private hasAbruptConnectionLoss(history: TelemetryData[]): boolean {
    if (history.length < 2) return false;
    const recent = history.slice(-2);
    return recent[0].connectionStatus === 'connected' && recent[1].connectionStatus === 'error';
  }

  private hasGradualConnectionDegradation(history: TelemetryData[]): boolean {
    // This would require more sophisticated connection quality metrics
    // For now, assume gradual if we have some history of connection issues
    return history.length > 3 && history.some(t => t.connectionStatus === 'disconnected');
  }

  private hasGradualCurrentDecrease(history: TelemetryData[]): boolean {
    if (history.length < 4) return false;
    const recent = history.slice(-4);
    let decreases = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].current < recent[i-1].current) decreases++;
    }
    return decreases >= 2;
  }

  private hasAbruptCurrentStop(history: TelemetryData[]): boolean {
    if (history.length < 2) return false;
    const recent = history.slice(-2);
    return recent[0].current > 5 && recent[1].current === 0; // Sudden stop from active charging
  }

  // Statistical analysis methods
  private calculateVoltageStability(history: TelemetryData[]): number {
    if (history.length < 3) return 1.0;
    const voltages = history.map(t => t.voltage);
    const avg = voltages.reduce((sum, v) => sum + v, 0) / voltages.length;
    const variance = voltages.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / voltages.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 1 - (stdDev / 50)); // Normalize to 0-1 scale
  }

  private calculateCurrentStability(history: TelemetryData[]): number {
    if (history.length < 3) return 1.0;
    const currents = history.map(t => t.current);
    const avg = currents.reduce((sum, c) => sum + c, 0) / currents.length;
    const variance = currents.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / currents.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 1 - (stdDev / 10)); // Normalize to 0-1 scale
  }

  private calculateTemperatureTrend(history: TelemetryData[]): number {
    if (history.length < 3) return 0;
    const temps = history.map(t => t.temperature);
    const firstHalf = temps.slice(0, Math.floor(temps.length / 2));
    const secondHalf = temps.slice(Math.floor(temps.length / 2));
    const firstAvg = firstHalf.reduce((sum, t) => sum + t, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + t, 0) / secondHalf.length;
    return (secondAvg - firstAvg) / 50; // Normalize trend
  }

  private calculateConnectionReliability(history: TelemetryData[]): number {
    if (history.length === 0) return 1.0;
    const connectedCount = history.filter(t => t.connectionStatus === 'connected').length;
    return connectedCount / history.length;
  }
}

// Export singleton instance for convenience
export const diagnosisEngine = new DiagnosisEngineImpl();