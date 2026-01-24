import { useState, useEffect } from 'react';
import { useDemoStore } from '../../store/useDemoStore';
import { AlertTriangle, CheckCircle2, Car, Loader2, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getStationAvailability } from '../../api/bookingApi';
import BookingForm from './BookingForm';
import { AnimatePresence } from 'framer-motion';

export default function BookingPanel({ stationId }: { stationId: string }) {
  const { selectedStation } = useDemoStore();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [availability, setAvailability] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fetch station availability
  useEffect(() => {
    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        const data = await getStationAvailability(stationId);
        setAvailability(data);
      } catch (error) {
        console.error('Failed to fetch availability:', error);
        // Use fallback data if API fails
        setAvailability({
          totalPorts: 10,
          availablePorts: 6,
          occupiedPorts: 4,
          emergencyPorts: 2,
          utilizationRate: 40
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [stationId, bookingSuccess]);

  if (!availability) return null;

  const isFull = availability.availablePorts === 0;

  const handleBookingSuccess = (bookingData: any) => {
    setShowBookingForm(false);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 5000);
    console.log('Booking successful:', bookingData);
  };

  return (
    <>
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm mt-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Car className="w-3 h-3" />
          Charging Slots
        </h3>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-800/50 p-2 rounded-lg text-center border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase">Total</div>
                <div className="text-xl font-mono font-bold text-white">{availability.totalPorts}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase">Available</div>
                <div className={cn("text-xl font-mono font-bold", isFull ? "text-slate-500" : "text-neon-lime")}>
                  {availability.availablePorts}
                </div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase">Emergency</div>
                <div className="text-xl font-mono font-bold text-plasma">{availability.emergencyPorts}</div>
              </div>
            </div>

            {/* Utilization Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Utilization</span>
                <span className="font-mono">{availability.utilizationRate}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    availability.utilizationRate >= 90 ? "bg-red-500" :
                    availability.utilizationRate >= 70 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${availability.utilizationRate}%` }}
                />
              </div>
            </div>

            {/* Success Message */}
            {bookingSuccess && (
              <div className="mb-4 p-3 rounded-lg border bg-emerald-900/20 border-emerald-700/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-bold text-sm text-emerald-400">Booking Confirmed!</div>
                  <div className="text-xs text-emerald-300/80">Check your email for details</div>
                </div>
              </div>
            )}

            {/* Booking Button */}
            <button 
              disabled={isFull}
              onClick={() => setShowBookingForm(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white text-sm font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
            >
              <Zap className="w-4 h-4" />
              {isFull ? 'No Slots Available' : 'Book Charging Slot'}
            </button>
            
            {isFull && (
              <div className="mt-2 text-xs text-center text-amber-500 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                All slots occupied. Try another station.
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Form Modal */}
      <AnimatePresence>
        {showBookingForm && selectedStation && (
          <BookingForm
            station={selectedStation}
            onClose={() => setShowBookingForm(false)}
            onSuccess={handleBookingSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
}
