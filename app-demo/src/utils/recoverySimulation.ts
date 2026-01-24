// Recovery simulation system for transitioning stations from critical → warning → safe
// Simulates gradual improvement of station metrics during recovery

import type { Station } from '../data/mockData';
import { getMetricsByStatus } from '../data/statusBasedMockData';

export interface RecoveryProgress {
  phase: 'critical' | 'warning' | 'safe';
  progress: number; // 0-100
  currentTemp: number;
  currentLoad: number;
  currentEfficiency: number;
  currentUptime: number;
  message: string;
}

export type RecoveryCallback = (progress: RecoveryProgress) => void;

// Recovery phases with durations (in seconds)
const RECOVERY_PHASES = {
  criticalToWarning: 10, // 10 seconds to go from critical to warning
  warningToSafe: 10,     // 10 seconds to go from warning to safe
};

// Interpolate between two values
function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

// Get interpolated metrics between two status levels
function getInterpolatedMetrics(
  fromStatus: 'critical' | 'warning' | 'safe',
  toStatus: 'critical' | 'warning' | 'safe',
  progress: number // 0-1
) {
  const fromMetrics = getMetricsByStatus(fromStatus);
  const toMetrics = getMetricsByStatus(toStatus);
  
  return {
    oilTemp: lerp(fromMetrics.oilTemp, toMetrics.oilTemp, progress),
    load: lerp(fromMetrics.load, toMetrics.load, progress),
    efficiency: lerp(fromMetrics.efficiency, toMetrics.efficiency, progress),
    uptime: lerp(fromMetrics.uptime, toMetrics.uptime, progress),
    powerFactor: lerp(fromMetrics.powerFactor, toMetrics.powerFactor, progress),
  };
}

// Recovery messages for each phase
const RECOVERY_MESSAGES = {
  critical: {
    0: 'Initiating emergency recovery protocol...',
    20: 'Reducing load distribution...',
    40: 'Activating cooling systems...',
    60: 'Temperature stabilizing...',
    80: 'Load balancing in progress...',
    100: 'Transitioning to warning state...'
  },
  warning: {
    0: 'Continuing recovery process...',
    20: 'Optimizing power distribution...',
    40: 'System efficiency improving...',
    60: 'Temperature within safe range...',
    80: 'Final system checks...',
    100: 'Recovery complete - System optimal!'
  }
};

function getRecoveryMessage(phase: 'critical' | 'warning', progress: number): string {
  const messages = RECOVERY_MESSAGES[phase];
  const thresholds = Object.keys(messages).map(Number).sort((a, b) => a - b);
  
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (progress >= thresholds[i]) {
      return messages[thresholds[i] as keyof typeof messages];
    }
  }
  
  return messages[0];
}

/**
 * Simulate recovery process for a critical station
 * Transitions: critical (red) → warning (yellow) → safe (green)
 * 
 * @param station - The station to recover
 * @param onProgress - Callback for progress updates
 * @param onComplete - Callback when recovery is complete
 * @returns Cleanup function to cancel recovery
 */
export function simulateRecovery(
  station: Station,
  onProgress: RecoveryCallback,
  onComplete: () => void
): () => void {
  if (station.status !== 'critical') {
    console.warn('Recovery simulation only works for critical stations');
    return () => {};
  }

  let cancelled = false;
  let currentPhase: 'critical' | 'warning' = 'critical';
  let phaseProgress = 0;
  
  const updateInterval = 100; // Update every 100ms for smooth animation
  const totalPhases = 2; // critical→warning, warning→safe
  
  const interval = setInterval(() => {
    if (cancelled) {
      clearInterval(interval);
      return;
    }

    // Calculate progress within current phase
    const phaseDuration = currentPhase === 'critical' 
      ? RECOVERY_PHASES.criticalToWarning 
      : RECOVERY_PHASES.warningToSafe;
    
    phaseProgress += (updateInterval / 1000) / phaseDuration; // Increment based on time
    
    if (phaseProgress >= 1) {
      // Phase complete, move to next phase
      if (currentPhase === 'critical') {
        currentPhase = 'warning';
        phaseProgress = 0;
      } else {
        // Recovery complete!
        clearInterval(interval);
        
        // Final update with safe status
        const safeMetrics = getMetricsByStatus('safe');
        onProgress({
          phase: 'safe',
          progress: 100,
          currentTemp: safeMetrics.oilTemp,
          currentLoad: safeMetrics.load,
          currentEfficiency: safeMetrics.efficiency,
          currentUptime: safeMetrics.uptime,
          message: 'Recovery complete - System optimal!'
        });
        
        onComplete();
        return;
      }
    }

    // Calculate interpolated metrics
    const fromStatus = currentPhase;
    const toStatus = currentPhase === 'critical' ? 'warning' : 'safe';
    const metrics = getInterpolatedMetrics(fromStatus, toStatus, phaseProgress);
    
    // Calculate overall progress (0-100)
    const overallProgress = currentPhase === 'critical'
      ? phaseProgress * 50 // First 50% is critical→warning
      : 50 + (phaseProgress * 50); // Last 50% is warning→safe
    
    // Send progress update
    onProgress({
      phase: currentPhase,
      progress: Math.round(overallProgress),
      currentTemp: Math.round(metrics.oilTemp),
      currentLoad: Math.round(metrics.load),
      currentEfficiency: Math.round(metrics.efficiency),
      currentUptime: Math.round(metrics.uptime),
      message: getRecoveryMessage(currentPhase, phaseProgress * 100)
    });
    
  }, updateInterval);

  // Return cleanup function
  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

/**
 * Quick recovery simulation (for testing)
 * Completes in 6 seconds instead of 20
 */
export function simulateQuickRecovery(
  station: Station,
  onProgress: RecoveryCallback,
  onComplete: () => void
): () => void {
  // Temporarily override phase durations
  const originalPhases = { ...RECOVERY_PHASES };
  RECOVERY_PHASES.criticalToWarning = 3;
  RECOVERY_PHASES.warningToSafe = 3;
  
  const cleanup = simulateRecovery(station, onProgress, onComplete);
  
  // Restore original durations when done
  return () => {
    cleanup();
    RECOVERY_PHASES.criticalToWarning = originalPhases.criticalToWarning;
    RECOVERY_PHASES.warningToSafe = originalPhases.warningToSafe;
  };
}
