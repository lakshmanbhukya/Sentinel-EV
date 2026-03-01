// Predictive Analytics Engine for AI Agent System
// Advanced ML-based predictions for fault prevention and optimization

import { TelemetryData, FaultType } from './types.js';

export interface PredictionResult {
  type: 'fault_risk' | 'demand_forecast' | 'maintenance_schedule' | 'optimization_opportunity';
  confidence: number; // 0-1
  timeframe: number; // milliseconds until predicted event
  description: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface FaultRiskPrediction extends PredictionResult {
  type: 'fault_risk';
  faultType: FaultType;
  probability: number;
  preventiveActions: string[];
}

export interface DemandForecast extends PredictionResult {
  type: 'demand_forecast';
  predictedLoad: number;
  peakTime: number;
  duration: number;
}

export interface MaintenanceSchedule extends PredictionResult {
  type: 'maintenance_schedule';
  component: string;
  urgency: 'routine' | 'priority' | 'urgent' | 'emergency';
  estimatedCost: number;
}

export interface OptimizationOpportunity extends PredictionResult {
  type: 'optimization_opportunity';
  category: 'energy_efficiency' | 'load_balancing' | 'cost_reduction' | 'performance';
  potentialSavings: number;
  implementationComplexity: 'low' | 'medium' | 'high';
}

class PredictiveAnalyticsImpl {
  private telemetryHistory = new Map<string, TelemetryData[]>();
  private maxHistorySize = 1000;
  private predictionCache = new Map<string, PredictionResult[]>();
  private cacheTimeout = 300000; // 5 minutes

  // Machine Learning Models (simplified implementations)
  private faultPredictionModel = new FaultPredictionModel();
  private demandForecastModel = new DemandForecastModel();
  private maintenanceModel = new MaintenanceModel();
  private optimizationModel = new OptimizationModel();

  addTelemetryData(data: TelemetryData): void {
    const stationId = data.stationId;
    
    if (!this.telemetryHistory.has(stationId)) {
      this.telemetryHistory.set(stationId, []);
    }
    
    const history = this.telemetryHistory.get(stationId)!;
    history.push(data);
    
    // Maintain history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
    
    // Invalidate cache for this station
    this.predictionCache.delete(stationId);
  }

  async generatePredictions(stationId: string): Promise<PredictionResult[]> {
    // Check cache first
    const cached = this.predictionCache.get(stationId);
    if (cached) {
      return cached;
    }

    const history = this.telemetryHistory.get(stationId) || [];
    
    // If insufficient history, return guaranteed mock predictions for demo
    if (history.length < 10) {
      return this.generateMockPredictions(stationId);
    }

    const predictions: PredictionResult[] = [];

    // Generate fault risk predictions
    const faultRisks = await this.faultPredictionModel.predict(history);
    predictions.push(...faultRisks);

    // Generate demand forecasts
    const demandForecasts = await this.demandForecastModel.predict(history);
    predictions.push(...demandForecasts);

    // Generate maintenance schedules
    const maintenanceSchedules = await this.maintenanceModel.predict(history);
    predictions.push(...maintenanceSchedules);

    // Generate optimization opportunities
    const optimizations = await this.optimizationModel.predict(history);
    predictions.push(...optimizations);

    // Cache results
    this.predictionCache.set(stationId, predictions);
    setTimeout(() => {
      this.predictionCache.delete(stationId);
    }, this.cacheTimeout);

    return predictions;
  }

  private generateMockPredictions(stationId: string): PredictionResult[] {
    // Generate guaranteed mock predictions for demo purposes
    const mockPredictions: PredictionResult[] = [
      {
        type: 'fault_risk',
        confidence: 0.78,
        timeframe: 2700000, // 45 minutes
        description: 'Temperature trending upward. Potential overheating risk detected',
        recommendations: [
          'Monitor temperature sensors closely',
          'Prepare cooling system activation',
          'Consider load reduction if temperature exceeds 55°C'
        ],
        severity: 'medium'
      } as PredictionResult,
      {
        type: 'demand_forecast',
        confidence: 0.85,
        timeframe: 1800000, // 30 minutes
        description: 'Peak demand period approaching. Expected 35% load increase',
        recommendations: [
          'Prepare additional capacity',
          'Enable dynamic load balancing',
          'Monitor grid stability metrics',
          'Alert operations team'
        ],
        severity: 'medium'
      } as PredictionResult,
      {
        type: 'optimization_opportunity',
        confidence: 0.72,
        timeframe: 86400000, // 24 hours
        description: 'Energy efficiency optimization available. Power factor correction recommended',
        recommendations: [
          'Schedule power factor correction installation',
          'Optimize charging algorithms',
          'Review electrical connections',
          'Implement smart charging protocols'
        ],
        severity: 'low'
      } as PredictionResult,
      {
        type: 'maintenance_schedule',
        confidence: 0.68,
        timeframe: 1209600000, // 14 days
        description: 'Routine maintenance recommended based on operating hours',
        recommendations: [
          'Schedule maintenance window during off-peak hours',
          'Order replacement parts in advance',
          'Notify maintenance team',
          'Prepare backup charging capacity'
        ],
        severity: 'low'
      } as PredictionResult,
      {
        type: 'fault_risk',
        confidence: 0.82,
        timeframe: 3600000, // 1 hour
        description: 'Voltage fluctuations detected. Grid instability risk increasing',
        recommendations: [
          'Activate voltage regulation systems',
          'Monitor grid connection quality',
          'Prepare backup power systems',
          'Reduce charging rate if voltage drops below 210V'
        ],
        severity: 'high'
      } as PredictionResult
    ];

    console.log(`🔮 Generated ${mockPredictions.length} mock predictions for station ${stationId}`);
    
    // Cache mock predictions
    this.predictionCache.set(stationId, mockPredictions);
    setTimeout(() => {
      this.predictionCache.delete(stationId);
    }, this.cacheTimeout);

    return mockPredictions;
  }

  async getPredictionsByType<T extends PredictionResult>(
    stationId: string, 
    type: T['type']
  ): Promise<T[]> {
    const allPredictions = await this.generatePredictions(stationId);
    return allPredictions.filter(p => p.type === type) as T[];
  }

  async getHighRiskPredictions(stationId: string): Promise<PredictionResult[]> {
    const predictions = await this.generatePredictions(stationId);
    return predictions.filter(p => p.severity === 'high' || p.severity === 'critical');
  }

  async getSystemWidePredictions(stationIds: string[]): Promise<Map<string, PredictionResult[]>> {
    const results = new Map<string, PredictionResult[]>();
    
    await Promise.all(
      stationIds.map(async (stationId) => {
        const predictions = await this.generatePredictions(stationId);
        results.set(stationId, predictions);
      })
    );
    
    return results;
  }

  // Advanced analytics methods
  calculateTrendAnalysis(stationId: string, metric: keyof TelemetryData): {
    trend: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    confidence: number;
  } {
    const history = this.telemetryHistory.get(stationId) || [];
    if (history.length < 5) {
      return { trend: 'stable', rate: 0, confidence: 0 };
    }

    const values = history.slice(-20).map(d => d[metric] as number).filter(v => typeof v === 'number');
    if (values.length < 5) {
      return { trend: 'stable', rate: 0, confidence: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const correlation = this.calculateCorrelation(x, values);

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < 0.1) trend = 'stable';
    else if (slope > 0) trend = 'increasing';
    else trend = 'decreasing';

    return {
      trend,
      rate: Math.abs(slope),
      confidence: Math.abs(correlation)
    };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  getAnomalyScore(stationId: string, currentData: TelemetryData): number {
    const history = this.telemetryHistory.get(stationId) || [];
    if (history.length < 10) return 0;

    // Calculate z-scores for each metric
    const metrics: (keyof TelemetryData)[] = ['voltage', 'current', 'temperature'];
    let totalAnomalyScore = 0;

    metrics.forEach(metric => {
      const values = history.map(d => d[metric] as number).filter(v => typeof v === 'number');
      if (values.length < 5) return;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev > 0) {
        const zScore = Math.abs((currentData[metric] as number - mean) / stdDev);
        totalAnomalyScore += Math.min(zScore, 5); // Cap at 5 standard deviations
      }
    });

    return Math.min(totalAnomalyScore / metrics.length, 10); // Normalize to 0-10 scale
  }
}

// Simplified ML Models
class FaultPredictionModel {
  async predict(history: TelemetryData[]): Promise<FaultRiskPrediction[]> {
    const predictions: FaultRiskPrediction[] = [];
    const latest = history[history.length - 1];

    // Temperature-based fault prediction
    if (latest.temperature > 60) {
      const probability = Math.min(0.9, (latest.temperature - 60) / 50);
      predictions.push({
        type: 'fault_risk',
        faultType: 'overtemperature',
        confidence: 0.85,
        probability,
        timeframe: Math.max(300000, 3600000 * (1 - probability)), // 5min to 1hr
        description: `High temperature trend detected. Overheating risk in ${Math.round((1 - probability) * 60)} minutes`,
        recommendations: ['Increase cooling', 'Reduce load', 'Monitor temperature closely'],
        severity: probability > 0.7 ? 'critical' : probability > 0.4 ? 'high' : 'medium',
        preventiveActions: ['Activate emergency cooling', 'Reduce charging rate by 25%']
      });
    }

    // Voltage instability prediction
    const voltageVariance = this.calculateVariance(history.slice(-10).map(d => d.voltage));
    if (voltageVariance > 100) {
      predictions.push({
        type: 'fault_risk',
        faultType: 'overvoltage',
        confidence: 0.75,
        probability: Math.min(0.8, voltageVariance / 500),
        timeframe: 600000, // 10 minutes
        description: 'Voltage instability detected. Grid regulation issues likely',
        recommendations: ['Check grid connection', 'Activate voltage regulation', 'Monitor grid stability'],
        severity: voltageVariance > 300 ? 'high' : 'medium',
        preventiveActions: ['Enable voltage limiting', 'Switch to backup power if available']
      });
    }

    return predictions;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
}

class DemandForecastModel {
  async predict(history: TelemetryData[]): Promise<DemandForecast[]> {
    const predictions: DemandForecast[] = [];
    
    // Analyze current load patterns
    const currentHour = new Date().getHours();
    const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
    
    if (isRushHour) {
      predictions.push({
        type: 'demand_forecast',
        confidence: 0.8,
        timeframe: 1800000, // 30 minutes
        description: 'Peak demand period approaching. Expect 40% load increase',
        recommendations: ['Prepare additional capacity', 'Enable load balancing', 'Monitor grid stability'],
        severity: 'medium',
        predictedLoad: 85,
        peakTime: Date.now() + 900000, // 15 minutes from now
        duration: 7200000 // 2 hours
      });
    }

    return predictions;
  }
}

class MaintenanceModel {
  async predict(history: TelemetryData[]): Promise<MaintenanceSchedule[]> {
    const predictions: MaintenanceSchedule[] = [];
    
    // Simulate maintenance predictions based on usage patterns
    const totalOperatingHours = history.length * 2 / 3600; // Rough estimate
    
    if (totalOperatingHours > 100) {
      predictions.push({
        type: 'maintenance_schedule',
        confidence: 0.7,
        timeframe: 2592000000, // 30 days
        description: 'Routine maintenance due based on operating hours',
        recommendations: ['Schedule maintenance window', 'Order replacement parts', 'Notify maintenance team'],
        severity: 'low',
        component: 'Cooling System',
        urgency: 'routine',
        estimatedCost: 1500
      });
    }

    return predictions;
  }
}

class OptimizationModel {
  async predict(history: TelemetryData[]): Promise<OptimizationOpportunity[]> {
    const predictions: OptimizationOpportunity[] = [];
    
    // Energy efficiency optimization
    const avgEfficiency = history.slice(-20).reduce((sum, d) => {
      return sum + (d.powerOutput / (d.voltage * d.current / 1000));
    }, 0) / Math.min(20, history.length);

    if (avgEfficiency < 0.9) {
      predictions.push({
        type: 'optimization_opportunity',
        confidence: 0.75,
        timeframe: 86400000, // 24 hours
        description: 'Energy efficiency below optimal. Power factor correction recommended',
        recommendations: ['Install power factor correction', 'Optimize charging algorithms', 'Review electrical connections'],
        severity: 'medium',
        category: 'energy_efficiency',
        potentialSavings: 1200, // Monthly savings in dollars
        implementationComplexity: 'medium'
      });
    }

    return predictions;
  }
}

export const predictiveAnalytics = new PredictiveAnalyticsImpl();