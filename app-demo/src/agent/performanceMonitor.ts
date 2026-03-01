// Performance Monitor for AI Agent System
// Tracks system performance, memory usage, and optimization metrics

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  activeConnections: number;
}

export interface SystemHealth {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  metrics: PerformanceMetrics;
  recommendations: string[];
  alerts: string[];
}

class PerformanceMonitorImpl {
  private metrics: PerformanceMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    responseTime: 0,
    throughput: 0,
    errorRate: 0,
    activeConnections: 0
  };

  private history: PerformanceMetrics[] = [];
  private maxHistorySize = 100;
  private monitoringInterval?: ReturnType<typeof setInterval>;
  private callbacks: ((health: SystemHealth) => void)[] = [];

  startMonitoring(intervalMs: number = 5000): void {
    this.stopMonitoring();
    
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.notifyCallbacks();
    }, intervalMs);
    
    console.log('📊 Performance monitoring started');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getSystemHealth(): SystemHealth {
    const health = this.calculateSystemHealth();
    return {
      overall: health.level,
      metrics: this.getCurrentMetrics(),
      recommendations: health.recommendations,
      alerts: health.alerts
    };
  }

  onHealthUpdate(callback: (health: SystemHealth) => void): void {
    this.callbacks.push(callback);
  }

  private updateMetrics(): void {
    // Simulate realistic performance metrics
    const now = performance.now();
    
    // CPU usage simulation (based on active agents and operations)
    const baseLoad = 15 + Math.random() * 10; // 15-25% base
    const agentLoad = this.getActiveAgentCount() * 5; // 5% per active agent
    this.metrics.cpuUsage = Math.min(100, baseLoad + agentLoad + (Math.random() - 0.5) * 8);

    // Memory usage simulation
    const baseMemory = 45 + Math.random() * 5; // 45-50% base
    const agentMemory = this.getActiveAgentCount() * 2; // 2% per agent
    this.metrics.memoryUsage = Math.min(95, baseMemory + agentMemory + (Math.random() - 0.5) * 6);

    // Response time simulation (ms)
    const baseResponse = 50 + Math.random() * 30; // 50-80ms base
    const loadPenalty = this.metrics.cpuUsage > 80 ? 20 : 0;
    this.metrics.responseTime = baseResponse + loadPenalty + (Math.random() - 0.5) * 15;

    // Throughput (operations per second)
    const maxThroughput = 1000;
    const efficiencyFactor = Math.max(0.3, 1 - (this.metrics.cpuUsage / 100));
    this.metrics.throughput = Math.floor(maxThroughput * efficiencyFactor * (0.8 + Math.random() * 0.4));

    // Error rate (percentage)
    const baseErrorRate = 0.1;
    const stressFactor = this.metrics.cpuUsage > 90 ? 2 : 1;
    this.metrics.errorRate = baseErrorRate * stressFactor + Math.random() * 0.3;

    // Active connections
    this.metrics.activeConnections = this.getActiveConnectionCount();

    // Store in history
    this.history.push({ ...this.metrics });
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  private calculateSystemHealth(): { level: SystemHealth['overall'], recommendations: string[], alerts: string[] } {
    const recommendations: string[] = [];
    const alerts: string[] = [];
    
    let score = 100;

    // CPU usage assessment
    if (this.metrics.cpuUsage > 90) {
      score -= 30;
      alerts.push('Critical CPU usage detected');
      recommendations.push('Reduce active monitoring frequency');
    } else if (this.metrics.cpuUsage > 75) {
      score -= 15;
      recommendations.push('Consider optimizing agent algorithms');
    }

    // Memory usage assessment
    if (this.metrics.memoryUsage > 85) {
      score -= 25;
      alerts.push('High memory usage detected');
      recommendations.push('Clear telemetry history cache');
    } else if (this.metrics.memoryUsage > 70) {
      score -= 10;
      recommendations.push('Monitor memory usage trends');
    }

    // Response time assessment
    if (this.metrics.responseTime > 200) {
      score -= 20;
      alerts.push('Slow response times detected');
      recommendations.push('Optimize database queries');
    } else if (this.metrics.responseTime > 100) {
      score -= 8;
      recommendations.push('Consider caching frequently accessed data');
    }

    // Error rate assessment
    if (this.metrics.errorRate > 2) {
      score -= 25;
      alerts.push('High error rate detected');
      recommendations.push('Review error logs and fix critical issues');
    } else if (this.metrics.errorRate > 1) {
      score -= 10;
      recommendations.push('Monitor error patterns');
    }

    // Determine overall health level
    let level: SystemHealth['overall'];
    if (score >= 90) level = 'excellent';
    else if (score >= 75) level = 'good';
    else if (score >= 60) level = 'fair';
    else if (score >= 40) level = 'poor';
    else level = 'critical';

    return { level, recommendations, alerts };
  }

  private notifyCallbacks(): void {
    const health = this.getSystemHealth();
    this.callbacks.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Error in performance callback:', error);
      }
    });
  }

  private getActiveAgentCount(): number {
    // This would be injected from the agent system
    return Math.floor(Math.random() * 8) + 2; // Simulate 2-10 active agents
  }

  private getActiveConnectionCount(): number {
    // Simulate active telemetry connections
    return Math.floor(Math.random() * 20) + 15; // 15-35 connections
  }

  getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.history];
  }

  // Optimization suggestions based on current state
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    if (this.metrics.cpuUsage > 70) {
      suggestions.push('Increase telemetry update interval to reduce CPU load');
      suggestions.push('Implement agent hibernation for stable stations');
    }
    
    if (this.metrics.memoryUsage > 60) {
      suggestions.push('Enable automatic telemetry history cleanup');
      suggestions.push('Compress historical data older than 1 hour');
    }
    
    if (this.metrics.responseTime > 80) {
      suggestions.push('Enable response caching for frequent queries');
      suggestions.push('Optimize fault detection algorithms');
    }
    
    if (this.metrics.errorRate > 0.5) {
      suggestions.push('Review and fix recurring error patterns');
      suggestions.push('Implement better error handling and retry logic');
    }

    return suggestions;
  }

  // Resource usage prediction
  predictResourceUsage(additionalAgents: number): PerformanceMetrics {
    const predicted = { ...this.metrics };
    
    predicted.cpuUsage = Math.min(100, predicted.cpuUsage + (additionalAgents * 5));
    predicted.memoryUsage = Math.min(100, predicted.memoryUsage + (additionalAgents * 2));
    predicted.responseTime = predicted.responseTime + (additionalAgents * 3);
    predicted.throughput = Math.max(100, predicted.throughput - (additionalAgents * 50));
    
    return predicted;
  }
}

export const performanceMonitor = new PerformanceMonitorImpl();