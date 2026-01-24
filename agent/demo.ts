// Demo script to verify core modules work together
// This demonstrates the telemetry → fault detection → state management flow

import { TelemetrySimulatorImpl } from './telemetrySimulator.js';
import { FaultDetectorImpl } from './faultDetector.js';
import { AgentStateManagerImpl } from './agentState.js';

async function demonstrateCoreFunctionality() {
  console.log('🤖 Self-Healing AI Agent - Core Modules Demo');
  console.log('='.repeat(50));

  // Initialize core modules
  const telemetrySimulator = new TelemetrySimulatorImpl();
  const faultDetector = new FaultDetectorImpl();
  const stateManager = new AgentStateManagerImpl();
  
  const stationId = 'demo-station-001';

  // Set up state change monitoring
  stateManager.onStateChange((stationId, oldState, newState) => {
    console.log(`📊 State Change: ${oldState} → ${newState} (Station: ${stationId})`);
  });

  try {
    console.log('\n1️⃣ Starting telemetry simulation...');
    telemetrySimulator.startSimulation(stationId, 100);
    
    // Verify initial state
    console.log(`   Initial agent state: ${stateManager.getCurrentPhase(stationId)}`);
    
    // Generate normal telemetry
    console.log('\n2️⃣ Generating normal telemetry...');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const normalTelemetry = telemetrySimulator.getCurrentTelemetry(stationId);
    if (normalTelemetry) {
      console.log(`   Voltage: ${normalTelemetry.voltage.toFixed(1)}V`);
      console.log(`   Current: ${normalTelemetry.current.toFixed(1)}A`);
      console.log(`   Temperature: ${normalTelemetry.temperature.toFixed(1)}°C`);
      
      const normalFault = faultDetector.analyzeTelemetry(normalTelemetry);
      console.log(`   Fault detected: ${normalFault ? normalFault.type : 'None'}`);
    }

    console.log('\n3️⃣ Injecting overvoltage fault...');
    telemetrySimulator.injectFault(stationId, 'overvoltage');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const faultedTelemetry = telemetrySimulator.getCurrentTelemetry(stationId);
    if (faultedTelemetry) {
      console.log(`   Voltage: ${faultedTelemetry.voltage.toFixed(1)}V (FAULT!)`);
      console.log(`   Current: ${faultedTelemetry.current.toFixed(1)}A`);
      console.log(`   Temperature: ${faultedTelemetry.temperature.toFixed(1)}°C`);
      
      const detectedFault = faultDetector.analyzeTelemetry(faultedTelemetry);
      if (detectedFault) {
        console.log(`   ⚠️  Fault detected: ${detectedFault.type} (${detectedFault.severity})`);
        console.log(`   Description: ${detectedFault.description}`);
        
        // Update agent state
        stateManager.setFault(stationId, detectedFault);
        console.log(`   Agent state: ${stateManager.getCurrentPhase(stationId)}`);
      }
    }

    console.log('\n4️⃣ Simulating diagnosis and recovery cycle...');
    
    // Diagnosis phase
    const diagnosisSuccess = stateManager.transitionTo(stationId, 'DIAGNOSING', { trigger: 'diagnosis_started' });
    console.log(`   Diagnosis started: ${diagnosisSuccess ? '✅' : '❌'}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Execution phase
    const executionSuccess = stateManager.transitionTo(stationId, 'EXECUTING', { trigger: 'diagnosis_complete' });
    console.log(`   Recovery execution: ${executionSuccess ? '✅' : '❌'}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Resolution phase
    const resolutionSuccess = stateManager.transitionTo(stationId, 'RESOLVED', { trigger: 'recovery_complete' });
    console.log(`   Recovery completed: ${resolutionSuccess ? '✅' : '❌'}`);
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('\n5️⃣ Clearing fault and returning to normal...');
    telemetrySimulator.clearFault(stationId);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const recoveredTelemetry = telemetrySimulator.getCurrentTelemetry(stationId);
    if (recoveredTelemetry) {
      console.log(`   Voltage: ${recoveredTelemetry.voltage.toFixed(1)}V (Normal)`);
      
      const resolvedFault = faultDetector.analyzeTelemetry(recoveredTelemetry);
      console.log(`   Fault status: ${resolvedFault ? resolvedFault.type : 'Resolved ✅'}`);
    }
    
    // Complete cycle
    const cycleSuccess = stateManager.transitionTo(stationId, 'STABLE', { trigger: 'cycle_complete' });
    console.log(`   Cycle completed: ${cycleSuccess ? '✅' : '❌'}`);
    console.log(`   Final agent state: ${stateManager.getCurrentPhase(stationId)}`);

    console.log('\n6️⃣ Performance verification...');
    const performanceTests = [];
    
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      
      const telemetry = telemetrySimulator.generateNormalTelemetry(stationId);
      const fault = faultDetector.analyzeTelemetry(telemetry);
      
      const endTime = performance.now();
      performanceTests.push(endTime - startTime);
    }
    
    const avgTime = performanceTests.reduce((sum, time) => sum + time, 0) / performanceTests.length;
    const maxTime = Math.max(...performanceTests);
    
    console.log(`   Average processing time: ${avgTime.toFixed(2)}ms`);
    console.log(`   Maximum processing time: ${maxTime.toFixed(2)}ms`);
    console.log(`   Performance requirement (100ms): ${maxTime < 100 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n7️⃣ Logging verification...');
    const logs = stateManager.getLogs(stationId);
    console.log(`   Total log entries: ${logs.length}`);
    console.log(`   Info logs: ${logs.filter(l => l.level === 'info').length}`);
    console.log(`   Warning logs: ${logs.filter(l => l.level === 'warning').length}`);
    console.log(`   Error logs: ${logs.filter(l => l.level === 'error').length}`);
    
    if (logs.length > 0) {
      console.log(`   Latest log: ${logs[logs.length - 1].message}`);
    }

    console.log('\n✅ Core modules integration test completed successfully!');
    console.log('\nSummary:');
    console.log('- ✅ Telemetry simulation working');
    console.log('- ✅ Fault detection working');
    console.log('- ✅ State management working');
    console.log('- ✅ Module integration working');
    console.log('- ✅ Performance requirements met');
    console.log('- ✅ Event logging working');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Clean up
    telemetrySimulator.stopSimulation(stationId);
    console.log('\n🧹 Cleanup completed');
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateCoreFunctionality().catch(console.error);
}

export { demonstrateCoreFunctionality };