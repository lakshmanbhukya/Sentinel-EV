import { useDemoStore } from './store/useDemoStore';
import IntroOverlay from './components/ui/IntroOverlay';
import SentinelMap from './components/map/SentinelMap';
import EVEnergyTwinSidebar from './components/twin/EVStationSidebar';
import BookingModal from './components/ui/BookingModal';
import { AnimatePresence } from 'framer-motion';
import { AgentEnabledWrapper, AgentIntegration, AgentControlPanel } from './agent/integration/AgentEnabledWrapper';

function App() {
  const { view, selectedStation, stations, updateStationStatus } = useDemoStore();

  return (
    <AgentEnabledWrapper 
      initialEnabled={false}
      initialConfig={{
        autoActivateOnCritical: true,
        monitoringInterval: 2000,
        enableTerminalUI: true
      }}
    >
      <div className="w-screen h-screen bg-black text-white overflow-hidden font-sans select-none">
        
        {/* View Orchestration */}
        <AnimatePresence mode="wait">
          {view === 'intro' && (
              <IntroOverlay key="intro" />
          )}
          
          {view === 'map' && (
              <div key="map" className="relative w-full h-full">
                  <SentinelMap />
                  <EVEnergyTwinSidebar />
                  <BookingModal />
                  
                  {/* Agent Integration - Only renders when agent is enabled */}
                  <AgentIntegration 
                    selectedStation={selectedStation} 
                    allStations={stations}
                    onStationStatusChange={updateStationStatus}
                  />
              </div>
          )}
        </AnimatePresence>

        {/* Agent Control Panel - Fixed position, only shows when on map view */}
        {view === 'map' && (
          <div className="fixed top-6 left-6 z-[600]">
            <AgentControlPanel showConfig={false} />
          </div>
        )}

        {/* Global Watermark/Status */}
        <div className="fixed bottom-4 left-4 z-50 pointer-events-none opacity-50">
           <p className="text-[10px] text-slate-500 font-mono">
              TRANSFORMER SENTINEL PROTOCOL v1.0.4-rc // CONNECTED
           </p>
        </div>
      </div>
    </AgentEnabledWrapper>
  );
}

export default App;
