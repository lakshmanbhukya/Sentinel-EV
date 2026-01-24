import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, User, Mail, Car, Calendar, Clock, AlertCircle, MapPin, Battery, CheckCircle2 } from 'lucide-react';
import { createBooking, type CreateBookingRequest } from '../../api/bookingApi';
import type { Station } from '../../data/mockData';

interface BookingFormProps {
  station: Station;
  onClose: () => void;
  onSuccess: (bookingData: any) => void;
}

export default function BookingForm({ station, onClose, onSuccess }: BookingFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    userName: '',
    userEmail: '',
    userPhone: '',
    bookingDate: '',
    timeSlot: '09:00',
    duration: 2,
    bookingType: 'normal' as 'normal' | 'emergency',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate date is in future
      const selectedDate = new Date(formData.bookingDate + 'T' + formData.timeSlot);
      if (selectedDate <= new Date()) {
        setError('Please select a future date and time');
        setIsSubmitting(false);
        return;
      }

      const bookingRequest: CreateBookingRequest = {
        stationId: station.id,
        stationName: station.name,
        vehicleNumber: formData.vehicleNumber.toUpperCase(),
        userName: formData.userName,
        userEmail: formData.userEmail,
        userPhone: formData.userPhone,
        bookingDate: selectedDate.toISOString(),
        timeSlot: formData.timeSlot,
        duration: formData.duration,
        bookingType: formData.bookingType,
        notes: formData.notes
      };

      const result = await createBooking(bookingRequest);
      onSuccess(result);
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(null);
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  };

  const isFieldValid = (fieldName: string): boolean => {
    if (!touchedFields.has(fieldName)) return true;
    const value = formData[fieldName as keyof typeof formData];
    return value !== '';
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.vehicleNumber.length > 0;
      case 2:
        return formData.userName.length > 0 && 
               formData.userEmail.length > 0 && 
               formData.userPhone.length > 0;
      case 3:
        return formData.bookingDate.length > 0 && formData.timeSlot.length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (isStepValid(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 backdrop-blur-xl border-b border-slate-700/50 p-8">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2.5 hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-white transition-all hover:rotate-90 duration-300"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-6">
            {/* Station Icon */}
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>

            {/* Station Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Reserve Your Charging Slot
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">{station.name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Battery className="w-4 h-4 text-green-400" />
                  <span>{station.availableChargers} available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-8 flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Vehicle', icon: Car },
              { num: 2, label: 'Contact', icon: User },
              { num: 3, label: 'Schedule', icon: Calendar }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      currentStep > step.num 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                        : currentStep === step.num
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                    animate={{ 
                      scale: currentStep === step.num ? 1.1 : 1,
                    }}
                  >
                    {currentStep > step.num ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </motion.div>
                  <span className={`mt-2 text-xs font-medium transition-colors ${
                    currentStep >= step.num ? 'text-white' : 'text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`h-0.5 flex-1 mx-2 transition-all duration-300 ${
                    currentStep > step.num 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                      : 'bg-slate-800'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Vehicle Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4" />
              Vehicle Details
            </h3>
            
            <div>
              <label className="block text-sm text-slate-300 mb-2">Vehicle Number *</label>
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                placeholder="e.g., KA01AB1234"
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors uppercase"
              />
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="userPhone"
                  value={formData.userPhone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address *
              </label>
              <input
                type="email"
                name="userEmail"
                value={formData.userEmail}
                onChange={handleChange}
                placeholder="john.doe@example.com"
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Booking Schedule
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Date *</label>
                <input
                  type="date"
                  name="bookingDate"
                  value={formData.bookingDate}
                  onChange={handleChange}
                  min={minDate}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Slot *
                </label>
                <select
                  name="timeSlot"
                  value={formData.timeSlot}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="06:00">06:00 AM</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="18:00">06:00 PM</option>
                  <option value="21:00">09:00 PM</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Duration (hours) *</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="0.5">30 minutes</option>
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                  <option value="4">4 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Booking Type *</label>
                <select
                  name="bookingType"
                  value={formData.bookingType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="normal">Normal</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Additional Notes (Optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special requirements or notes..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Confirm Booking</span>
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </motion.div>
    </div>
  );
}
