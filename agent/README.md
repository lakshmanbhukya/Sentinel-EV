# Self-Healing AI Agent

This module contains the core implementation of the Self-Healing AI Agent system for EV charging stations.

## Directory Structure

```
agent/
├── types.ts                 # Core TypeScript interfaces and types
├── telemetrySimulator.ts    # Telemetry data generation and simulation
├── faultDetector.ts         # Fault detection and analysis
├── diagnosisEngine.ts       # Root cause diagnosis logic
├── recoveryActions.ts       # Automated recovery procedures
├── agentState.ts           # Finite state machine management
├── index.ts                # Main module exports
├── tests/                  # Test files
│   └── setup.test.ts       # Basic setup and integration tests
└── README.md               # This file
```

## Core Interfaces

### AgentState
Represents the current state of an agent instance, including phase, fault information, and logs.

### TelemetryData
Defines the structure of telemetry data from charging stations, including voltage, current, temperature, and status information.

### FaultEvent
Represents a detected fault with type, severity, and associated telemetry snapshot.

### DiagnosisResult
Contains the result of fault diagnosis including root cause, confidence level, and recommended actions.

### RecoveryResult
Represents the outcome of a recovery action execution.

## Testing

The module uses Vitest and fast-check for comprehensive testing:

- **Unit Tests**: Specific scenarios and edge cases
- **Property-Based Tests**: Universal properties validated across random inputs

Run tests with:
```bash
npm test                # Run all tests once
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Run tests with UI
```

## Implementation Status

- ✅ Task 1: Project structure and core interfaces
- ⏳ Task 2: Telemetry Simulator implementation
- ⏳ Task 3: Fault Detector implementation
- ⏳ Task 4: Agent State Manager implementation
- ⏳ Task 6: Diagnosis Engine implementation
- ⏳ Task 7: Recovery Actions implementation
- ⏳ Task 8: Agent Terminal UI implementation
- ⏳ Task 9: System integration
- ⏳ Task 10: End-to-end coordination
- ⏳ Task 11: Demo scenarios
- ⏳ Task 12: Final integration and polish

Each module currently contains placeholder implementations that will be completed in their respective tasks.