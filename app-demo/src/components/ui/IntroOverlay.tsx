import { motion } from 'framer-motion';
import { useDemoStore } from '../../store/useDemoStore';
import { Zap } from 'lucide-react';

export default function IntroOverlay() {
  const setView = useDemoStore((state) => state.setView);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80" />
      
      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse" />
              <Zap className="w-16 h-16 text-yellow-500 relative z-10" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
            GRID <span className="text-red-500">CRITICAL</span>
          </h1>
          
          <p className="text-xl text-slate-400 font-light leading-relaxed">
            Unmanaged EV charging is pushing distribution transformers to the breaking point. 
            The grid needs a <span className="text-white font-medium">Sentinel EV</span>.
          </p>
        </motion.div>
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 1 }}
          onClick={() => setView('map')}
          className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          ACTIVATE SENTINEL
        </motion.button>
      </div>
    </motion.div>
  );
}
