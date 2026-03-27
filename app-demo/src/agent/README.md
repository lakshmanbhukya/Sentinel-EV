# Frontend Agent Module

This folder contains the self-healing agent implementation used directly inside the frontend app.

It powers simulation-first agent workflows for terminal UI, diagnostics, and recovery visualization.

## Frontend-Only Scope

- Runs in the frontend runtime for demos and interactions.
- Uses local simulation logic and mock-driven state transitions.
- Does not depend on backend/ML services in this repository.

## Module Contents

```text
src/agent/
	types.ts                  # Shared data types and contracts
	telemetrySimulator.ts     # Telemetry sample generation
	faultDetector.ts          # Fault detection rules
	diagnosisEngine.ts        # Root-cause diagnosis logic
	recoveryActions.ts        # Recovery strategy/action logic
	agentState.ts             # Agent state machine helpers
	AgentController.ts        # Agent flow orchestration
	AgentTerminal.tsx         # Terminal presentation component
	AgentTerminalManager.tsx  # Terminal session coordination
	useAgentTerminal.ts       # React hook for terminal integration
	tests/                    # Agent-focused tests
```

## Typical Flow

1. Generate or receive telemetry.
2. Detect fault candidates from telemetry patterns.
3. Diagnose likely root causes.
4. Select and execute recovery actions.
5. Emit logs/state for terminal and UI components.

## Testing

Run from the app root:

```bash
npm test
npm run test:watch
npm run test:ui
```
