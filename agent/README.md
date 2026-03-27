# Sentinel EV Agent Module (Frontend Simulation)

This module implements the self-healing agent logic used by the Sentinel EV frontend experience.

It is designed for simulation and UI interaction, not as a backend microservice.

## Scope

- Telemetry simulation for EV charging station behavior
- Fault detection from incoming telemetry snapshots
- Diagnosis pipeline for probable fault causes
- Recovery action planning/execution models
- Agent state lifecycle and terminal-friendly event output

## Frontend-Only Note

This module is part of the frontend project scope. It is consumed by React UI flows and tests. It does not require a standalone backend runtime in this repository.

## Directory Overview

```text
agent/
	types.ts                  # Shared interfaces and enums
	telemetrySimulator.ts     # Synthetic telemetry generation
	faultDetector.ts          # Fault detection rules/logic
	diagnosisEngine.ts        # Fault diagnosis logic
	recoveryActions.ts        # Recovery action generation/execution results
	agentState.ts             # Agent finite-state lifecycle helpers
	AgentController.ts        # Controller abstraction for agent orchestration
	AgentTerminal.tsx         # Terminal-style UI rendering
	performanceMonitor.ts     # Runtime/perf tracking helpers
	securityMonitor.ts        # Safety/security checks for simulation
	tests/                    # Unit/integration/property tests
```

## How It Is Used

- Imported by UI components to visualize monitoring and recovery events.
- Used by test suites to validate invariants and scenario behavior.
- Wired into demo flows for end-to-end frontend simulation.

## Testing

Run tests from the frontend app workspace:

```bash
cd app-demo
npm test
```

For watch/UI modes, use:

```bash
npm run test:watch
npm run test:ui
```
