import { useDemoStore } from './store/useDemoStore';
import IntroOverlay from './components/ui/IntroOverlay';
import SentinelMap from './components/map/SentinelMap';
import EVEnergyTwinSidebar from './components/twin/EVStationSidebar';
import BookingModal from './components/ui/BookingModal';
import { AnimatePresence } from 'framer-motion';

function App() {
  const { view } = useDemoStore();

  return (
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
            </div>
        )}
      </AnimatePresence>

      {/* Global Watermark/Status */}
      <div className="fixed bottom-4 left-4 z-50 pointer-events-none opacity-50">
         <p className="text-[10px] text-slate-500 font-mono">
            TRANSFORMER SENTINEL PROTOCOL v1.0.4-rc // CONNECTED
         </p>
      </div>
    </div>
  );
}

export default App;
