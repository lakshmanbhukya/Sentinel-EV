import { useState } from 'react';
import { useDemoStore } from '../../store/useDemoStore';
import { useScheduleBooking } from '../../hooks/useScheduling'; // New Hook
import { AlertTriangle, CheckCircle2, Car, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function BookingPanel({ stationId }: { stationId: string }) {
  const { slotStates, bookSlot } = useDemoStore();
  const { scheduleBooking, isSubmitting } = useScheduleBooking();
  const slots = slotStates[stationId];
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<'normal' | 'emergency' | null>(null);

  if (!slots) return null;

  const handleBooking = async (isEmergency: boolean) => {
    if (!vehicleNumber.trim()) return;
    
    // 1. Call API / Simulation
    const success = await scheduleBooking(stationId, vehicleNumber);
    
    if (success) {
      // 2. Update Local Store (Optimistic / Confirmed)
      const storeUpdated = bookSlot(stationId, vehicleNumber, isEmergency);
      
      if (storeUpdated) {
          setBookingSuccess(isEmergency ? 'emergency' : 'normal');
          setVehicleNumber('');
          setTimeout(() => setBookingSuccess(null), 3000);
      }
    }
  };

  const isFull = slots.availableSlots === 0;

  return (
    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm mt-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Car className="w-3 h-3" />
        Charging Slots
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-800/50 p-2 rounded-lg text-center border border-slate-700">
          <div className="text-[10px] text-slate-400 uppercase">Total</div>
          <div className="text-xl font-mono font-bold text-white">{slots.totalSlots}</div>
        </div>
        <div className="bg-slate-800/50 p-2 rounded-lg text-center border border-slate-700">
          <div className="text-[10px] text-slate-400 uppercase">Available</div>
          <div className={cn("text-xl font-mono font-bold", isFull ? "text-slate-500" : "text-neon-lime")}>
            {slots.availableSlots}
          </div>
        </div>
        <div className="bg-slate-800/50 p-2 rounded-lg text-center border border-slate-700">
          <div className="text-[10px] text-slate-400 uppercase">Emergency</div>
          <div className="text-xl font-mono font-bold text-plasma">{slots.emergencySlots}</div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="space-y-3">
        {bookingSuccess ? (
             <div className={cn("p-3 rounded-lg border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2", bookingSuccess === 'emergency' ? "bg-plasma/10 border-plasma/30 text-plasma" : "bg-neon-lime/10 border-neon-lime/30 text-neon-lime")}>
                <CheckCircle2 className="w-5 h-5" />
                <div>
                   <div className="font-bold text-sm">Booking Confirmed</div>
                   <div className="text-xs opacity-80">{bookingSuccess === 'emergency' ? 'Emergency Priority Activated' : 'Slot Reserved Successfully'}</div>
                </div>
             </div>
        ) : (
            <>
                <input 
                    type="text" 
                    placeholder="Enter EV Vehicle Number" 
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-neon-cyan/50 font-mono"
                />
                <div className="flex gap-2">
                    <button 
                        disabled={isFull || !vehicleNumber || isSubmitting}
                        onClick={() => handleBooking(false)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Book Slot"}
                    </button>
                    <button 
                         disabled={slots.emergencySlots === 0 || !vehicleNumber || isSubmitting}
                         onClick={() => handleBooking(true)}
                         className="px-3 bg-slate-800 hover:bg-red-900/30 disabled:opacity-50 border border-red-900/50 text-plasma text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                         title="Emergency Priority Booking"
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        SOS
                    </button>
                </div>
                {isFull && <div className="text-xs text-center text-amber-500 mt-1">Regular slots full. Use SOS if critical.</div>}
            </>
        )}
      </div>
    </div>
  );
}
