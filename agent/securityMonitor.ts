// Security Monitor for AI Agent System
// Detects cybersecurity threats, unauthorized access, and system anomalies

export interface SecurityThreat {
  id: string;
  type: 'unauthorized_access' | 'data_breach' | 'system_intrusion' | 'anomalous_behavior' | 'ddos_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  source: string;
  description: string;
  indicators: string[];
  mitigationActions: string[];
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved';
}

export interface SecurityMetrics {
  threatLevel: 'green' | 'yellow' | 'orange' | 'red';
  activeThreats: number;
  blockedAttempts: number;
  systemIntegrity: number; // 0-100%
  encryptionStatus: 'active' | 'degraded' | 'compromised';
  lastSecurityScan: number;
}

class SecurityMonitorImpl {
  private threats = new Map<string, SecurityThreat>();
  private securityLogs: Array<{ timestamp: number; event: string; severity: string }> = [];
  private blockedIPs = new Set<string>();
  private suspiciousActivity = new Map<string, number>();
  private callbacks: ((threat: SecurityThreat) => void)[] = [];

  private readonly THREAT_PATTERNS = {
    unauthorized_access: [
      'Multiple failed login attempts',
      'Access from unusual location',
      'Privilege escalation attempt',
      'Unauthorized API calls'
    ],
    data_breach: [
      'Unusual data access patterns',
      'Large data transfers',
      'Unauthorized database queries',
      'Sensitive data exposure'
    ],
    system_intrusion: [
      'Malware signatures detected',
      'Unauthorized process execution',
      'System file modifications',
      'Network backdoor activity'
    ],
    anomalous_behavior: [
      'Unusual telemetry patterns',
      'Unexpected system responses',
      'Abnormal resource usage',
      'Irregular communication patterns'
    ],
    ddos_attack: [
      'High request volume',
      'Resource exhaustion',
      'Service degradation',
      'Network congestion'
    ]
  };

  startMonitoring(): void {
    console.log('🔒 Security monitoring activated');
    
    // Add initial mock threats for demo purposes
    this.initializeMockThreats();
    
    // Simulate security monitoring
    setInterval(() => {
      this.performSecurityScan();
    }, 30000); // Every 30 seconds

    // Monitor for suspicious patterns
    setInterval(() => {
      this.analyzeSecurityPatterns();
    }, 10000); // Every 10 seconds
  }

  private initializeMockThreats(): void {
    // Add guaranteed initial threats for demo visibility
    const initialThreats: SecurityThreat[] = [
      {
        id: `threat-init-${Date.now()}-1`,
        type: 'unauthorized_access',
        severity: 'medium',
        timestamp: Date.now() - 120000, // 2 minutes ago
        source: '192.168.45.127',
        description: 'Multiple failed authentication attempts detected from external IP',
        indicators: [
          'Failed login attempts: 12 in 3 minutes',
          'Source IP not in whitelist',
          'Unusual access patterns detected',
          'Brute force attack signature'
        ],
        mitigationActions: [
          'Block source IP address',
          'Increase authentication requirements',
          'Alert security team',
          'Monitor for additional attempts'
        ],
        status: 'detected'
      },
      {
        id: `threat-init-${Date.now()}-2`,
        type: 'anomalous_behavior',
        severity: 'low',
        timestamp: Date.now() - 300000, // 5 minutes ago
        source: 'Station Telemetry Monitor',
        description: 'Unusual telemetry patterns detected in charging station network',
        indicators: [
          'Irregular communication patterns',
          'Unexpected data transmission spikes',
          'Non-standard protocol usage detected'
        ],
        mitigationActions: [
          'Increase monitoring sensitivity',
          'Review system logs',
          'Check for system anomalies',
          'Validate telemetry data integrity'
        ],
        status: 'investigating'
      },
      {
        id: `threat-init-${Date.now()}-3`,
        type: 'ddos_attack',
        severity: 'high',
        timestamp: Date.now() - 60000, // 1 minute ago
        source: 'Multiple IPs (47 sources)',
        description: 'Distributed denial of service attack detected on API endpoints',
        indicators: [
          'Request rate: 15,000+ per minute',
          'Multiple source IPs from same subnet',
          'Service response degradation: 23%',
          'Resource exhaustion warning'
        ],
        mitigationActions: [
          'Enable DDoS protection',
          'Rate limit requests',
          'Block malicious IP ranges',
          'Scale infrastructure automatically'
        ],
        status: 'detected'
      }
    ];

    // Add initial threats to the system
    initialThreats.forEach(threat => {
      this.threats.set(threat.id, threat);
      this.logSecurityEvent(`Initial threat loaded: ${threat.description}`, 'info');
      
      // Notify callbacks for UI updates
      this.callbacks.forEach(callback => {
        try {
          callback(threat);
        } catch (error) {
          console.error('Error in security callback:', error);
        }
      });
    });

    console.log(`🔒 Initialized ${initialThreats.length} mock security threats for demo`);
  }

  onThreatDetected(callback: (threat: SecurityThreat) => void): void {
    this.callbacks.push(callback);
  }

  getCurrentSecurityMetrics(): SecurityMetrics {
    const activeThreats = Array.from(this.threats.values()).filter(
      t => t.status === 'detected' || t.status === 'investigating'
    ).length;

    const criticalThreats = Array.from(this.threats.values()).filter(
      t => t.severity === 'critical' && (t.status === 'detected' || t.status === 'investigating')
    ).length;

    let threatLevel: SecurityMetrics['threatLevel'] = 'green';
    if (criticalThreats > 0) threatLevel = 'red';
    else if (activeThreats > 2) threatLevel = 'orange';
    else if (activeThreats > 0) threatLevel = 'yellow';

    return {
      threatLevel,
      activeThreats,
      blockedAttempts: this.blockedIPs.size,
      systemIntegrity: this.calculateSystemIntegrity(),
      encryptionStatus: this.getEncryptionStatus(),
      lastSecurityScan: Date.now()
    };
  }

  getActiveThreats(): SecurityThreat[] {
    return Array.from(this.threats.values()).filter(
      t => t.status === 'detected' || t.status === 'investigating'
    );
  }

  mitigateThreat(threatId: string): boolean {
    const threat = this.threats.get(threatId);
    if (!threat) return false;

    threat.status = 'mitigated';
    this.logSecurityEvent(`Threat ${threatId} mitigated`, 'info');
    
    // Apply automatic mitigation actions
    this.applyMitigationActions(threat);
    
    return true;
  }

  private performSecurityScan(): void {
    // Simulate various security checks
    this.checkUnauthorizedAccess();
    this.checkSystemIntegrity();
    this.checkNetworkSecurity();
    this.checkDataIntegrity();
  }

  private checkUnauthorizedAccess(): void {
    // Simulate detection of unauthorized access attempts
    if (Math.random() < 0.05) { // 5% chance
      const threat: SecurityThreat = {
        id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: 'unauthorized_access',
        severity: Math.random() > 0.7 ? 'high' : 'medium',
        timestamp: Date.now(),
        source: this.generateRandomIP(),
        description: 'Multiple failed authentication attempts detected',
        indicators: [
          'Failed login attempts: 15 in 2 minutes',
          'Source IP not in whitelist',
          'Unusual access patterns detected'
        ],
        mitigationActions: [
          'Block source IP address',
          'Increase authentication requirements',
          'Alert security team',
          'Monitor for additional attempts'
        ],
        status: 'detected'
      };

      this.addThreat(threat);
    }
  }

  private checkSystemIntegrity(): void {
    // Simulate system integrity checks
    if (Math.random() < 0.02) { // 2% chance
      const threat: SecurityThreat = {
        id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: 'system_intrusion',
        severity: 'critical',
        timestamp: Date.now(),
        source: 'Internal System',
        description: 'Unauthorized system modifications detected',
        indicators: [
          'Critical system files modified',
          'Unexpected process execution',
          'Registry changes detected'
        ],
        mitigationActions: [
          'Isolate affected systems',
          'Restore from backup',
          'Perform malware scan',
          'Update security patches'
        ],
        status: 'detected'
      };

      this.addThreat(threat);
    }
  }

  private checkNetworkSecurity(): void {
    // Simulate network security monitoring
    if (Math.random() < 0.03) { // 3% chance
      const threat: SecurityThreat = {
        id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: 'ddos_attack',
        severity: Math.random() > 0.5 ? 'high' : 'medium',
        timestamp: Date.now(),
        source: 'Multiple IPs',
        description: 'Distributed denial of service attack detected',
        indicators: [
          'Request rate: 10,000+ per minute',
          'Multiple source IPs',
          'Service response degradation',
          'Resource exhaustion detected'
        ],
        mitigationActions: [
          'Enable DDoS protection',
          'Rate limit requests',
          'Block malicious IPs',
          'Scale infrastructure'
        ],
        status: 'detected'
      };

      this.addThreat(threat);
    }
  }

  private checkDataIntegrity(): void {
    // Simulate data integrity monitoring
    if (Math.random() < 0.01) { // 1% chance
      const threat: SecurityThreat = {
        id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: 'data_breach',
        severity: 'critical',
        timestamp: Date.now(),
        source: 'Database Server',
        description: 'Unauthorized data access detected',
        indicators: [
          'Unusual database queries',
          'Large data export detected',
          'Access outside business hours',
          'Sensitive data accessed'
        ],
        mitigationActions: [
          'Revoke database access',
          'Audit data access logs',
          'Encrypt sensitive data',
          'Notify compliance team'
        ],
        status: 'detected'
      };

      this.addThreat(threat);
    }
  }

  private analyzeSecurityPatterns(): void {
    // Analyze patterns for anomalous behavior
    const currentTime = Date.now();
    const recentLogs = this.securityLogs.filter(
      log => currentTime - log.timestamp < 300000 // Last 5 minutes
    );

    if (recentLogs.length > 50) { // High activity threshold
      const threat: SecurityThreat = {
        id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: 'anomalous_behavior',
        severity: 'medium',
        timestamp: Date.now(),
        source: 'System Monitor',
        description: 'Unusual system activity patterns detected',
        indicators: [
          `High security event rate: ${recentLogs.length} events in 5 minutes`,
          'Pattern analysis indicates potential threat',
          'Automated systems showing irregular behavior'
        ],
        mitigationActions: [
          'Increase monitoring sensitivity',
          'Review system logs',
          'Check for system anomalies',
          'Validate system integrity'
        ],
        status: 'detected'
      };

      this.addThreat(threat);
    }
  }

  private addThreat(threat: SecurityThreat): void {
    this.threats.set(threat.id, threat);
    this.logSecurityEvent(`Security threat detected: ${threat.description}`, 'warning');
    
    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(threat);
      } catch (error) {
        console.error('Error in security callback:', error);
      }
    });

    console.log(`🚨 Security threat detected: ${threat.type} - ${threat.severity}`);
  }

  private applyMitigationActions(threat: SecurityThreat): void {
    switch (threat.type) {
      case 'unauthorized_access':
        this.blockedIPs.add(threat.source);
        break;
      case 'ddos_attack':
        // Simulate DDoS mitigation
        this.logSecurityEvent('DDoS protection activated', 'info');
        break;
      case 'system_intrusion':
        // Simulate system isolation
        this.logSecurityEvent('System isolation protocols activated', 'warning');
        break;
      case 'data_breach':
        // Simulate data protection measures
        this.logSecurityEvent('Data protection measures activated', 'critical');
        break;
    }
  }

  private logSecurityEvent(event: string, severity: string): void {
    this.securityLogs.push({
      timestamp: Date.now(),
      event,
      severity
    });

    // Keep only last 1000 logs
    if (this.securityLogs.length > 1000) {
      this.securityLogs.shift();
    }
  }

  private calculateSystemIntegrity(): number {
    const criticalThreats = Array.from(this.threats.values()).filter(
      t => t.severity === 'critical' && t.status !== 'resolved'
    ).length;

    const highThreats = Array.from(this.threats.values()).filter(
      t => t.severity === 'high' && t.status !== 'resolved'
    ).length;

    let integrity = 100;
    integrity -= criticalThreats * 20;
    integrity -= highThreats * 10;

    return Math.max(0, integrity);
  }

  private getEncryptionStatus(): SecurityMetrics['encryptionStatus'] {
    const systemIntegrity = this.calculateSystemIntegrity();
    
    if (systemIntegrity < 50) return 'compromised';
    if (systemIntegrity < 80) return 'degraded';
    return 'active';
  }

  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  // Security reporting methods
  generateSecurityReport(): {
    summary: SecurityMetrics;
    threats: SecurityThreat[];
    recommendations: string[];
  } {
    const metrics = this.getCurrentSecurityMetrics();
    const activeThreats = this.getActiveThreats();
    
    const recommendations: string[] = [];
    
    if (metrics.threatLevel === 'red') {
      recommendations.push('Immediate security response required');
      recommendations.push('Isolate critical systems');
      recommendations.push('Contact security incident response team');
    } else if (metrics.threatLevel === 'orange') {
      recommendations.push('Increase security monitoring');
      recommendations.push('Review and update security policies');
      recommendations.push('Conduct security audit');
    } else if (metrics.threatLevel === 'yellow') {
      recommendations.push('Monitor security events closely');
      recommendations.push('Review access logs');
      recommendations.push('Update security configurations');
    }

    if (metrics.systemIntegrity < 90) {
      recommendations.push('Perform system integrity check');
      recommendations.push('Update security patches');
      recommendations.push('Review system configurations');
    }

    return {
      summary: metrics,
      threats: activeThreats,
      recommendations
    };
  }

  getSecurityLogs(limit: number = 100): Array<{ timestamp: number; event: string; severity: string }> {
    return this.securityLogs.slice(-limit);
  }
}

export const securityMonitor = new SecurityMonitorImpl();