// Integration Tests for Existing UI Compatibility
// Tests that existing station functionality works with agent components present and removed
// Validates: Requirements 7.2, 7.3, 7.4

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { AgentEnabledWrapper, AgentIntegration } from '../integration/AgentEnabledWrapper.js';

// Mock the existing UI store
const mockUseDemoStore = vi.fn();
vi.mock('../../app-demo/src/store/useDemoStore', () => ({
  useDemoStore: mockUseDemoStore
}));

// Mock station data
const mockStation = {
  id: 'station-001',
  name: 'Test Station Alpha',
  status: 'safe' as const,
  temp: 45,
  load: 65,
  lat: 12.9716,
  lng: 77.5946
};

const mockCriticalStation = {
  ...mockStation,
  id: 'station-002',
  name: 'Critical Station Beta',
  status: 'critical' as const,
  temp: 85,
  load: 95
};

// Mock existing UI components
const MockStationSelector: React.FC<{
  stations: any[];
  onStationSelect: (station: any) => void;
  selectedStationId?: string;
}> = ({ stations, onStationSelect, selectedStationId }) => {
  return (
    <div data-testid="station-selector">
      {stations.map(station => (
        <button
          key={station.id}
          data-testid={`station-${station.id}`}
          onClick={() => onStationSelect(station)}
          className={selectedStationId === station.id ? 'selected' : ''}
        >
          {station.name} - {station.status}
        </button>
      ))}
    </div>
  );
};

const MockStationDetails: React.FC<{
  station: any;
  onUpdate: (updates: Partial<any>) => void;
}> = ({ station, onUpdate }) => {
  if (!station) return <div data-testid="no-station">No station selected</div>;

  return (
    <div data-testid="station-details">
      <h2 data-testid="station-name">{station.name}</h2>
      <div data-testid="station-status">{station.status}</div>
      <div data-testid="station-temp">{station.temp}°C</div>
      <div data-testid="station-load">{station.load}%</div>
      
      <button
        data-testid="increase-load"
        onClick={() => onUpdate({ load: Math.min(100, station.load + 10) })}
      >
        Increase Load
      </button>
      
      <button
        data-testid="reset-station"
        onClick={() => onUpdate({ status: 'safe', temp: 45, load: 30 })}
      >
        Reset Station
      </button>
      
      <button
        data-testid="trigger-critical"
        onClick={() => onUpdate({ status: 'critical', temp: 90, load: 95 })}
      >
        Trigger Critical
      </button>
    </div>
  );
};

// Test application that simulates existing UI behavior
const TestExistingUI: React.FC<{
  withAgent?: boolean;
  agentEnabled?: boolean;
}> = ({ withAgent = false, agentEnabled = false }) => {
  const [stations, setStations] = React.useState([mockStation, mockCriticalStation]);
  const [selectedStation, setSelectedStation] = React.useState<any>(null);

  const handleStationSelect = (station: any) => {
    setSelectedStation(station);
  };

  const handleStationUpdate = (updates: Partial<any>) => {
    if (!selectedStation) return;
    
    const updatedStation = { ...selectedStation, ...updates };
    setSelectedStation(updatedStation);
    
    setStations(prev => prev.map(s => 
      s.id === selectedStation.id ? updatedStation : s
    ));
  };

  const content = (
    <div data-testid="existing-app">
      <MockStationSelector
        stations={stations}
        onStationSelect={handleStationSelect}
        selectedStationId={selectedStation?.id}
      />
      <MockStationDetails
        station={selectedStation}
        onUpdate={handleStationUpdate}
      />
    </div>
  );

  if (withAgent) {
    return (
      <AgentEnabledWrapper initialEnabled={agentEnabled}>
        {content}
        <AgentIntegration selectedStation={selectedStation} />
      </AgentEnabledWrapper>
    );
  }

  return content;
};

describe('UI Compatibility Integration Tests', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Existing UI Functionality Without Agent', () => {
    it('should render station selector and allow station selection', async () => {
      const { getByTestId } = render(<TestExistingUI />);
      
      expect(getByTestId('station-selector')).toBeDefined();
      expect(getByTestId('station-station-001')).toBeDefined();
      expect(getByTestId('station-station-002')).toBeDefined();
      expect(getByTestId('no-station')).toBeDefined();

      // Select a station
      fireEvent.click(getByTestId('station-station-001'));
      
      await waitFor(() => {
        expect(getByTestId('station-details')).toBeDefined();
        expect(getByTestId('station-name').textContent).toBe('Test Station Alpha');
        expect(getByTestId('station-status').textContent).toBe('safe');
      });
    });

    it('should allow station updates and maintain state', async () => {
      const { getByTestId } = render(<TestExistingUI />);
      
      // Select station
      fireEvent.click(getByTestId('station-station-001'));
      
      await waitFor(() => {
        expect(getByTestId('station-load').textContent).toBe('65%');
      });

      // Increase load
      fireEvent.click(getByTestId('increase-load'));
      
      await waitFor(() => {
        expect(getByTestId('station-load').textContent).toBe('75%');
      });

      // Trigger critical state
      fireEvent.click(getByTestId('trigger-critical'));
      
      await waitFor(() => {
        expect(getByTestId('station-status').textContent).toBe('critical');
        expect(getByTestId('station-temp').textContent).toBe('90°C');
      });

      // Reset station
      fireEvent.click(getByTestId('reset-station'));
      
      await waitFor(() => {
        expect(getByTestId('station-status').textContent).toBe('safe');
        expect(getByTestId('station-temp').textContent).toBe('45°C');
        expect(getByTestId('station-load').textContent).toBe('30%');
      });
    });
  });

  describe('Existing UI Functionality With Agent (Disabled)', () => {
    it('should maintain all existing functionality when agent is disabled', async () => {
      const { getByTestId } = render(
        <TestExistingUI withAgent={true} agentEnabled={false} />
      );
      
      // All existing functionality should work exactly the same
      expect(getByTestId('station-selector')).toBeDefined();
      expect(getByTestId('no-station')).toBeDefined();

      // Select station
      fireEvent.click(getByTestId('station-station-001'));
      
      await waitFor(() => {
        expect(getByTestId('station-details')).toBeDefined();
        expect(getByTestId('station-name').textContent).toBe('Test Station Alpha');
      });

      // Update station
      fireEvent.click(getByTestId('increase-load'));
      
      await waitFor(() => {
        expect(getByTestId('station-load').textContent).toBe('75%');
      });

      // Switch to critical station
      fireEvent.click(getByTestId('station-station-002'));
      
      await waitFor(() => {
        expect(getByTestId('station-name').textContent).toBe('Critical Station Beta');
        expect(getByTestId('station-status').textContent).toBe('critical');
      });
    });

    it('should not show any agent UI elements when disabled', async () => {
      const { container, getByTestId } = render(
        <TestExistingUI withAgent={true} agentEnabled={false} />
      );
      
      // Select critical station
      fireEvent.click(getByTestId('station-station-002'));
      
      await waitFor(() => {
        expect(getByTestId('station-status').textContent).toBe('critical');
      });

      // Should not have any agent-related elements
      expect(container.querySelector('[data-testid*="agent"]')).toBeNull();
      expect(container.querySelector('[class*="agent"]')).toBeNull();
      expect(container.querySelector('.agent-terminal')).toBeNull();
    });
  });

  describe('Existing UI Functionality With Agent (Enabled)', () => {
    it('should maintain existing functionality when agent is enabled', async () => {
      const { getByTestId } = render(
        <TestExistingUI withAgent={true} agentEnabled={true} />
      );
      
      // Core functionality should remain unchanged
      expect(getByTestId('station-selector')).toBeDefined();
      
      // Select and interact with station
      fireEvent.click(getByTestId('station-station-001'));
      
      await waitFor(() => {
        expect(getByTestId('station-name').textContent).toBe('Test Station Alpha');
      });

      // Station updates should still work
      fireEvent.click(getByTestId('increase-load'));
      
      await waitFor(() => {
        expect(getByTestId('station-load').textContent).toBe('75%');
      });

      // Critical state changes should work
      fireEvent.click(getByTestId('trigger-critical'));
      
      await waitFor(() => {
        expect(getByTestId('station-status').textContent).toBe('critical');
      });
    });

    it('should not interfere with existing event handlers', async () => {
      let stationSelectCount = 0;
      let stationUpdateCount = 0;

      const TestWithEventTracking: React.FC = () => {
        const [selectedStation, setSelectedStation] = React.useState<any>(null);

        const handleStationSelect = (station: any) => {
          stationSelectCount++;
          setSelectedStation(station);
        };

        const handleStationUpdate = (updates: Partial<any>) => {
          stationUpdateCount++;
          if (selectedStation) {
            setSelectedStation({ ...selectedStation, ...updates });
          }
        };

        return (
          <AgentEnabledWrapper initialEnabled={true}>
            <div>
              <MockStationSelector
                stations={[mockStation]}
                onStationSelect={handleStationSelect}
                selectedStationId={selectedStation?.id}
              />
              <MockStationDetails
                station={selectedStation}
                onUpdate={handleStationUpdate}
              />
            </div>
            <AgentIntegration selectedStation={selectedStation} />
          </AgentEnabledWrapper>
        );
      };

      const { getByTestId } = render(<TestWithEventTracking />);
      
      // Select station
      fireEvent.click(getByTestId('station-station-001'));
      expect(stationSelectCount).toBe(1);
      
      await waitFor(() => {
        expect(getByTestId('station-details')).toBeDefined();
      });

      // Update station
      fireEvent.click(getByTestId('increase-load'));
      expect(stationUpdateCount).toBe(1);
    });
  });

  describe('Agent Removal Compatibility', () => {
    it('should work when agent components are completely removed', async () => {
      // Start with agent
      const { rerender, getByTestId } = render(
        <TestExistingUI withAgent={true} agentEnabled={true} />
      );
      
      // Select station and verify it works
      fireEvent.click(getByTestId('station-station-001'));
      
      await waitFor(() => {
        expect(getByTestId('station-name').textContent).toBe('Test Station Alpha');
      });

      // Remove agent completely
      rerender(<TestExistingUI withAgent={false} />);
      
      // Existing functionality should still work
      expect(getByTestId('station-selector')).toBeDefined();
      
      // Should be able to select stations
      fireEvent.click(getByTestId('station-station-002'));
      
      await waitFor(() => {
        expect(getByTestId('station-name').textContent).toBe('Critical Station Beta');
        expect(getByTestId('station-status').textContent).toBe('critical');
      });

      // Should be able to update stations
      fireEvent.click(getByTestId('reset-station'));
      
      await waitFor(() => {
        expect(getByTestId('station-status').textContent).toBe('safe');
      });
    });

    it('should handle rapid agent enable/disable cycles', async () => {
      const { rerender, getByTestId } = render(
        <TestExistingUI withAgent={true} agentEnabled={false} />
      );
      
      // Select station
      fireEvent.click(getByTestId('station-station-001'));
      
      // Rapidly toggle agent state
      for (let i = 0; i < 5; i++) {
        rerender(<TestExistingUI withAgent={true} agentEnabled={true} />);
        rerender(<TestExistingUI withAgent={true} agentEnabled={false} />);
      }
      
      // Existing functionality should still work
      await waitFor(() => {
        expect(getByTestId('station-name').textContent).toBe('Test Station Alpha');
      });

      fireEvent.click(getByTestId('increase-load'));
      
      await waitFor(() => {
        expect(getByTestId('station-load').textContent).toBe('75%');
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle agent initialization errors gracefully', async () => {
      // Mock console.error to catch any errors
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        const { getByTestId } = render(
          <TestExistingUI withAgent={true} agentEnabled={true} />
        );
        
        // Existing UI should work even if agent has issues
        expect(getByTestId('station-selector')).toBeDefined();
        
        fireEvent.click(getByTestId('station-station-001'));
        
        await waitFor(() => {
          expect(getByTestId('station-name').textContent).toBe('Test Station Alpha');
        });

        // Should not have thrown any errors that break existing functionality
        expect(consoleSpy).not.toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should maintain state consistency during agent operations', async () => {
      const { getByTestId } = render(
        <TestExistingUI withAgent={true} agentEnabled={true} />
      );
      
      // Select critical station (might trigger agent)
      fireEvent.click(getByTestId('station-station-002'));
      
      await waitFor(() => {
        expect(getByTestId('station-status').textContent).toBe('critical');
      });

      // Perform multiple rapid updates
      for (let i = 0; i < 3; i++) {
        fireEvent.click(getByTestId('increase-load'));
        fireEvent.click(getByTestId('reset-station'));
      }
      
      // Final state should be consistent
      await waitFor(() => {
        expect(getByTestId('station-status').textContent).toBe('safe');
        expect(getByTestId('station-load').textContent).toBe('30%');
      });
    });
  });
});