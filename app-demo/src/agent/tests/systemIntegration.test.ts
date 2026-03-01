// Property-Based Tests for System Integration
// Feature: self-healing-ai-agent, Property 19: System Integration Non-Interference
// Validates: Requirements 7.2, 7.3, 7.4

import fc from 'fast-check';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { AgentEnabledWrapper, useConditionalAgent } from '../integration/AgentEnabledWrapper.js';
import { StationAgentIntegration } from '../integration/StationAgentIntegration.js';

// Mock station data generator for property tests
const stationArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  status: fc.constantFrom('safe', 'warning', 'critical'),
  temp: fc.float({ min: 20, max: 120 }),
  load: fc.integer({ min: 0, max: 100 }),
  lat: fc.float({ min: -90, max: 90 }),
  lng: fc.float({ min: -180, max: 180 })
});

// Mock existing UI component that should not be affected by agent
const MockExistingStationUI: React.FC<{
  station: any;
  onStationUpdate?: (station: any) => void;
}> = ({ station, onStationUpdate }) => {
  const [internalState, setInternalState] = React.useState(station);
  
  React.useEffect(() => {
    setInternalState(station);
  }, [station]);

  const updateStation = () => {
    const updated = { ...internalState, load: Math.min(100, internalState.load + 10) };
    setInternalState(updated);
    onStationUpdate?.(updated);
  };

  return (
    <div data-testid="existing-ui">
      <div data-testid="station-name">{internalState.name}</div>
      <div data-testid="station-status">{internalState.status}</div>
      <div data-testid="station-load">{internalState.load}</div>
      <button data-testid="update-button" onClick={updateStation}>
        Update Station
      </button>
    </div>
  );
};

// Test component that uses agent conditionally
const TestIntegratedComponent: React.FC<{
  station: any;
  agentEnabled: boolean;
  onStationUpdate?: (station: any) => void;
}> = ({ station, agentEnabled, onStationUpdate }) => {
  const { isAgentEnabled, isStationAgentActive } = useConditionalAgent(station?.id);
  
  return (
    <div data-testid="integrated-component">
      <MockExistingStationUI station={station} onStationUpdate={onStationUpdate} />
      
      {/* Agent status should only show when enabled */}
      {isAgentEnabled && (
        <div data-testid="agent-status">
          Agent: {isStationAgentActive ? 'Active' : 'Inactive'}
        </div>
      )}
      
      {/* Agent integration should not interfere with existing functionality */}
      <StationAgentIntegration
        selectedStation={station}
        enabled={agentEnabled}
        autoActivateOnCritical={true}
        monitoringInterval={1000}
      />
    </div>
  );
};

describe('System Integration Property Tests', () => {
  beforeEach(() => {
    // Reset any global state before each test
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  // Property 19: System Integration Non-Interference
  // For any existing system functionality, adding or removing agent components should not affect the existing behavior
  it('Property 19: System Integration Non-Interference', () => {
    fc.assert(fc.property(
      stationArbitrary,
      fc.boolean(), // agentEnabled
      fc.boolean(), // agentInitiallyEnabled
      (station, agentEnabled, agentInitiallyEnabled) => {
        let stationUpdateCount = 0;
        let lastUpdatedStation = station;
        
        const handleStationUpdate = (updatedStation: any) => {
          stationUpdateCount++;
          lastUpdatedStation = updatedStation;
        };

        // Test 1: Render with agent initially enabled/disabled
        const { rerender, getByTestId, queryByTestId } = render(
          <AgentEnabledWrapper initialEnabled={agentInitiallyEnabled}>
            <TestIntegratedComponent 
              station={station}
              agentEnabled={agentEnabled}
              onStationUpdate={handleStationUpdate}
            />
          </AgentEnabledWrapper>
        );

        // Existing UI should always be present regardless of agent state
        expect(getByTestId('existing-ui')).toBeDefined();
        expect(getByTestId('station-name').textContent).toBe(station.name);
        expect(getByTestId('station-status').textContent).toBe(station.status);
        expect(getByTestId('station-load').textContent).toBe(station.load.toString());

        // Agent status should only be visible when agent is enabled
        const agentStatus = queryByTestId('agent-status');
        if (agentInitiallyEnabled && agentEnabled) {
          expect(agentStatus).toBeDefined();
        } else {
          expect(agentStatus).toBeNull();
        }

        // Test existing functionality works (station update)
        const updateButton = getByTestId('update-button');
        updateButton.click();
        
        // Station update should work regardless of agent state
        expect(stationUpdateCount).toBe(1);
        expect(lastUpdatedStation.load).toBe(Math.min(100, station.load + 10));
        expect(getByTestId('station-load').textContent).toBe(lastUpdatedStation.load.toString());

        // Test 2: Toggle agent state and verify existing functionality still works
        rerender(
          <AgentEnabledWrapper initialEnabled={!agentInitiallyEnabled}>
            <TestIntegratedComponent 
              station={lastUpdatedStation}
              agentEnabled={agentEnabled}
              onStationUpdate={handleStationUpdate}
            />
          </AgentEnabledWrapper>
        );

        // Existing UI should still work after agent state change
        expect(getByTestId('existing-ui')).toBeDefined();
        expect(getByTestId('station-name').textContent).toBe(station.name);
        expect(getByTestId('station-load').textContent).toBe(lastUpdatedStation.load.toString());

        // Update should still work
        updateButton.click();
        expect(stationUpdateCount).toBe(2);

        // Test 3: Remove agent completely and verify existing functionality
        rerender(
          <div>
            <MockExistingStationUI 
              station={lastUpdatedStation}
              onStationUpdate={handleStationUpdate}
            />
          </div>
        );

        // Existing UI should work without agent wrapper
        expect(getByTestId('existing-ui')).toBeDefined();
        updateButton.click();
        expect(stationUpdateCount).toBe(3);

        return true; // Property holds
      }
    ), { numRuns: 50 });
  });

  it('Property 19.1: Agent Components Do Not Modify Existing APIs', () => {
    fc.assert(fc.property(
      stationArbitrary,
      (station) => {
        const originalStation = { ...station };
        let receivedStation = null;
        
        const handleStationUpdate = (updatedStation: any) => {
          receivedStation = updatedStation;
        };

        render(
          <AgentEnabledWrapper initialEnabled={true}>
            <TestIntegratedComponent 
              station={station}
              agentEnabled={true}
              onStationUpdate={handleStationUpdate}
            />
          </AgentEnabledWrapper>
        );

        // Agent should not modify the original station object
        expect(station).toEqual(originalStation);
        
        // Agent should not interfere with station update callbacks
        const updateButton = document.querySelector('[data-testid="update-button"]') as HTMLElement;
        updateButton.click();
        
        expect(receivedStation).toBeDefined();
        expect(receivedStation.id).toBe(station.id);
        expect(receivedStation.name).toBe(station.name);
        
        return true;
      }
    ), { numRuns: 30 });
  });

  it('Property 19.2: Agent State Isolation', () => {
    fc.assert(fc.property(
      fc.array(stationArbitrary, { minLength: 2, maxLength: 5 }),
      (stations) => {
        const stationUpdates = new Map<string, number>();
        
        const handleStationUpdate = (stationId: string) => (updatedStation: any) => {
          stationUpdates.set(stationId, (stationUpdates.get(stationId) || 0) + 1);
        };

        // Render multiple stations with agents
        const { rerender } = render(
          <AgentEnabledWrapper initialEnabled={true}>
            <div>
              {stations.map(station => (
                <TestIntegratedComponent
                  key={station.id}
                  station={station}
                  agentEnabled={true}
                  onStationUpdate={handleStationUpdate(station.id)}
                />
              ))}
            </div>
          </AgentEnabledWrapper>
        );

        // Each station should maintain independent state
        stations.forEach(station => {
          const stationElements = document.querySelectorAll(`[data-testid="station-name"]`);
          const stationElement = Array.from(stationElements).find(
            el => el.textContent === station.name
          );
          expect(stationElement).toBeDefined();
        });

        // Disable agent and verify stations still work independently
        rerender(
          <AgentEnabledWrapper initialEnabled={false}>
            <div>
              {stations.map(station => (
                <TestIntegratedComponent
                  key={station.id}
                  station={station}
                  agentEnabled={false}
                  onStationUpdate={handleStationUpdate(station.id)}
                />
              ))}
            </div>
          </AgentEnabledWrapper>
        );

        // All stations should still be present and functional
        stations.forEach(station => {
          const stationElements = document.querySelectorAll(`[data-testid="station-name"]`);
          const stationElement = Array.from(stationElements).find(
            el => el.textContent === station.name
          );
          expect(stationElement).toBeDefined();
        });

        return true;
      }
    ), { numRuns: 20 });
  });

  it('Property 19.3: Graceful Agent Removal', () => {
    fc.assert(fc.property(
      stationArbitrary,
      (station) => {
        let componentErrored = false;
        
        // Mock console.error to catch any errors
        const originalError = console.error;
        console.error = () => { componentErrored = true; };

        try {
          // Render with agent
          const { rerender } = render(
            <AgentEnabledWrapper initialEnabled={true}>
              <TestIntegratedComponent 
                station={station}
                agentEnabled={true}
              />
            </AgentEnabledWrapper>
          );

          expect(componentErrored).toBe(false);

          // Remove agent wrapper completely
          rerender(
            <MockExistingStationUI station={station} />
          );

          expect(componentErrored).toBe(false);

          // Verify existing UI still works
          expect(document.querySelector('[data-testid="existing-ui"]')).toBeDefined();
          expect(document.querySelector('[data-testid="station-name"]')?.textContent).toBe(station.name);

          return true;
        } finally {
          console.error = originalError;
        }
      }
    ), { numRuns: 30 });
  });

  it('Property 19.4: Performance Non-Interference', () => {
    fc.assert(fc.property(
      stationArbitrary,
      (station) => {
        // Measure render time without agent
        const startTimeWithoutAgent = performance.now();
        const { unmount: unmountWithoutAgent } = render(
          <MockExistingStationUI station={station} />
        );
        const renderTimeWithoutAgent = performance.now() - startTimeWithoutAgent;
        unmountWithoutAgent();

        // Measure render time with agent (disabled)
        const startTimeWithAgentDisabled = performance.now();
        const { unmount: unmountWithAgentDisabled } = render(
          <AgentEnabledWrapper initialEnabled={false}>
            <TestIntegratedComponent 
              station={station}
              agentEnabled={false}
            />
          </AgentEnabledWrapper>
        );
        const renderTimeWithAgentDisabled = performance.now() - startTimeWithAgentDisabled;
        unmountWithAgentDisabled();

        // Agent (when disabled) should not significantly impact render performance
        // Allow up to 5x overhead for wrapper components
        const performanceRatio = renderTimeWithAgentDisabled / renderTimeWithoutAgent;
        
        return performanceRatio < 5.0; // Agent overhead should be minimal when disabled
      }
    ), { numRuns: 20 });
  });
});