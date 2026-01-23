import { motion } from 'framer-motion';
import { useDemoStore } from '../../store/useDemoStore';
import { AlertTriangle, CheckCircle, Zap, ArrowRight, RefreshCw, X } from 'lucide-react';
import { useEffect } from 'react';

export default function BookingModal() {
  const { 
    isBookingModalOpen, 
    closeBooking, 
    bookingStatus, 
    selectedStation, 
    simulateBooking,
    acceptOptimization
  } = useDemoStore();

  useEffect(() => {
    if (isBookingModalOpen && selectedStation && bookingStatus === 'idle') {
      simulateBooking(selectedStation.id);
    }
  }, [isBookingModalOpen, selectedStation, bookingStatus]);

  if (!isBookingModalOpen || !selectedStation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={closeBooking}
      />

      {/* Modal Content */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
          {/* Close Button */}
          <button 
                onClick={closeBooking}
                className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white z-20"
              >
            <X className="w-5 h-5" />
          </button>

        <div className="p-8">
            {/* Status Visualization */}
            <div className="flex justify-center mb-8">
                {bookingStatus === 'analyzing' && (
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl animate-pulse opacity-50" />
                        <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
                    </div>
                )}
                {bookingStatus === 'conflict' && (
                     <div className="relative">
                        <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-30 animate-pulse" />
                        <AlertTriangle className="w-16 h-16 text-red-500" />
                     </div>
                )}
                {(bookingStatus === 'confirmed' || bookingStatus === 'optimized') && (
                     <div className="relative">
                        <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30" />
                        <CheckCircle className="w-16 h-16 text-green-500" />
                     </div>
                )}
            </div>

            {/* Text Content */}
            <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-white">
                    {bookingStatus === 'analyzing' && "Analyzing Grid Impact..."}
                    {bookingStatus === 'conflict' && "Grid Stability Alert"}
                    {bookingStatus === 'confirmed' && "Booking Confirmed"}
                    {bookingStatus === 'optimized' && "Optimization Successful"}
                </h3>
                
                <p className="text-slate-400">
                    {bookingStatus === 'analyzing' && `Simulating EV energy physics for ${selectedStation.name} based on IEC 60076-7 standards.`}
                    {bookingStatus === 'conflict' && `Adding this load would push Transformer TX-2049 over 110°C. Sentinel has blocked this request to prevent failure.`}
                    {bookingStatus === 'confirmed' && `Slot reserved. EV energy headroom allocated. Grid health remains stable.`}
                    {bookingStatus === 'optimized' && `Alternative slot found. Transformer temperature calibrated to remain under 95°C.`}
                </p>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-3">
                {bookingStatus === 'conflict' && (
                    <button 
                        onClick={acceptOptimization}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 group"
                    >
                        <Zap className="w-5 h-5 fill-current" />
                        <span>Sentinel Optimization</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                )}
                
                {(bookingStatus === 'confirmed' || bookingStatus === 'optimized') && (
                     <button 
                        onClick={closeBooking}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-green-400 border border-green-900/50 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                     >
                        <span>View Ticket</span>
                     </button>
                )}
            </div>
        </div>

        {/* Footer info */}
        {bookingStatus === 'conflict' && (
            <div className="bg-red-500/10 border-t border-red-500/20 p-4 text-center">
                 <p className="text-xs text-red-400 font-mono">THREAT LEVEL: CRITICAL // LOAD_REJECTION_ACTIVE</p>
            </div>
        )}
      </motion.div>
    </div>
  );
}
