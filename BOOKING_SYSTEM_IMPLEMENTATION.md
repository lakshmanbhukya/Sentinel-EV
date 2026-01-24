# EV Station Booking System Implementation

## Overview
Implemented a complete backend-driven booking system that stores booking data in MongoDB and manages port availability in real-time.

---

## Backend Implementation

### 1. Database Models

#### **Booking Model** (`Backend/models/Booking.js`)
Stores all booking information:
- Station details (ID, name)
- User information (name, email, phone, vehicle number)
- Booking schedule (date, time slot, duration)
- Port assignment
- Status tracking (pending, confirmed, in-progress, completed, cancelled)
- Booking type (normal, emergency)
- Cost tracking (estimated and actual)
- Energy delivered

#### **StationAvailability Model** (`Backend/models/StationAvailability.js`)
Manages port availability:
- Total ports, available ports, occupied ports
- Emergency ports (reserved for critical situations)
- Port details array with individual port status
- Methods for booking and releasing ports
- Automatic port assignment

### 2. API Endpoints

#### **POST /api/bookings/create**
Creates a new booking and decreases available ports
- Validates all required fields
- Checks station availability
- Assigns port number automatically
- Handles emergency bookings separately
- Returns booking confirmation with port details

#### **GET /api/bookings/availability/:stationId**
Gets current port availability for a station
- Total, available, occupied, and emergency ports
- Utilization rate
- Individual port status
- Last updated timestamp

#### **GET /api/bookings/station/:stationId**
Gets all bookings for a specific station
- Supports filtering by status, date range
- Sorted by booking date

#### **GET /api/bookings/:bookingId**
Gets details of a specific booking

#### **PUT /api/bookings/:bookingId/cancel**
Cancels a booking and releases the port
- Updates booking status to cancelled
- Increases available ports
- Returns updated availability

#### **PUT /api/bookings/:bookingId/complete**
Marks booking as completed and releases port
- Records actual energy delivered and cost
- Releases port for next booking

#### **GET /api/bookings/user/:userEmail**
Gets all bookings for a specific user

### 3. Controller Logic (`Backend/controllers/bookingController.js`)

**Key Features:**
- Automatic station availability initialization if not exists
- Port assignment algorithm
- Emergency vs normal booking handling
- Optimistic locking for concurrent bookings
- Rollback mechanism if port assignment fails
- Real-time availability updates

---

## Frontend Implementation

### 1. API Client (`app-demo/src/api/bookingApi.ts`)

TypeScript API client with full type safety:
- `createBooking()` - Create new booking
- `getStationAvailability()` - Fetch port availability
- `getStationBookings()` - Get station bookings
- `cancelBooking()` - Cancel a booking
- `completeBooking()` - Complete a booking
- `getUserBookings()` - Get user's booking history

### 2. Booking Form Component (`app-demo/src/components/booking/BookingForm.tsx`)

Full-featured booking form with:
- **Vehicle Details**: Vehicle number input
- **Contact Information**: Name, email, phone
- **Booking Schedule**: Date picker, time slot selector, duration
- **Booking Type**: Normal or Emergency
- **Additional Notes**: Optional notes field
- **Validation**: Client-side validation before submission
- **Error Handling**: Displays API errors to user
- **Loading States**: Shows spinner during submission
- **Success Feedback**: Confirmation message on success

### 3. Updated Booking Panel (`app-demo/src/components/booking/BookingPanel.tsx`)

Enhanced panel that:
- Fetches real-time availability from backend
- Displays total, available, and emergency ports
- Shows utilization rate with color-coded progress bar
- Opens booking form modal on button click
- Displays success message after booking
- Handles loading and error states
- Disables booking when no ports available

---

## How It Works

### Booking Flow:

1. **User clicks "Book Charging Slot"**
   - BookingPanel opens BookingForm modal

2. **User fills booking form**
   - Vehicle number, contact info, schedule, duration
   - Selects normal or emergency booking

3. **Form submission**
   - Frontend validates data
   - Sends POST request to `/api/bookings/create`

4. **Backend processing**
   - Validates booking data
   - Checks station availability
   - Creates booking record in MongoDB
   - Calls `stationAvailability.bookPort()` method
   - Decreases available ports count
   - Assigns specific port number
   - Updates port status to 'occupied'

5. **Response to frontend**
   - Returns booking confirmation with:
     - Booking ID
     - Assigned port number
     - Estimated cost
     - Remaining available ports

6. **UI updates**
   - Closes booking form
   - Shows success message
   - Refreshes availability data
   - Updates port counts

### Port Management:

**Normal Booking:**
- Checks `availablePorts > 0`
- Decreases `availablePorts` by 1
- Increases `occupiedPorts` by 1

**Emergency Booking:**
- Checks `emergencyPorts > 0`
- Decreases `emergencyPorts` by 1
- Uses reserved emergency slots

**Port Release (on cancel/complete):**
- Increases `availablePorts` by 1
- Decreases `occupiedPorts` by 1
- Updates port status to 'available'
- Clears `currentBookingId` reference

---

## Database Schema

### Booking Collection
```javascript
{
  _id: ObjectId,
  stationId: String,
  stationName: String,
  vehicleNumber: String,
  userName: String,
  userEmail: String,
  userPhone: String,
  bookingDate: Date,
  timeSlot: String,
  duration: Number,
  portNumber: Number,
  status: String, // pending, confirmed, in-progress, completed, cancelled
  bookingType: String, // normal, emergency
  estimatedCost: Number,
  actualCost: Number,
  energyDelivered: Number,
  paymentStatus: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### StationAvailability Collection
```javascript
{
  _id: ObjectId,
  stationId: String,
  stationName: String,
  totalPorts: Number,
  availablePorts: Number,
  occupiedPorts: Number,
  emergencyPorts: Number,
  portDetails: [{
    portNumber: Number,
    status: String, // available, occupied, maintenance, reserved
    connectorType: String,
    powerRating: Number,
    currentBookingId: ObjectId
  }],
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Integration with Existing System

### No Breaking Changes:
- ✅ All existing routes remain functional
- ✅ Existing models untouched
- ✅ New routes added to `server.js` without conflicts
- ✅ Frontend components use new API alongside existing features
- ✅ Backward compatible with mock data fallback

### Server.js Updates:
```javascript
// Added new import
const bookingRoutes = require('./routes/bookingRoutes');

// Added new route
app.use('/api/bookings', bookingRoutes);
```

---

## Testing the System

### 1. Start Backend
```bash
cd Backend
npm start
```

### 2. Test Booking Creation
```bash
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "ST001",
    "stationName": "Downtown Charging Hub",
    "vehicleNumber": "KA01AB1234",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "userPhone": "+91 9876543210",
    "bookingDate": "2026-01-26T10:00:00Z",
    "timeSlot": "10:00",
    "duration": 2,
    "bookingType": "normal"
  }'
```

### 3. Check Availability
```bash
curl http://localhost:3000/api/bookings/availability/ST001
```

### 4. Get Station Bookings
```bash
curl http://localhost:3000/api/bookings/station/ST001
```

---

## Features Implemented

✅ **Real-time Port Management**
- Automatic port assignment
- Concurrent booking handling
- Emergency port reservation

✅ **Complete Booking Lifecycle**
- Create → Confirm → In-Progress → Complete
- Cancel with port release
- Status tracking

✅ **User-Friendly Frontend**
- Modal booking form
- Real-time availability display
- Success/error feedback
- Loading states

✅ **Data Persistence**
- MongoDB storage
- Booking history
- Availability tracking

✅ **Type Safety**
- TypeScript interfaces
- API client types
- Form validation

✅ **Error Handling**
- Validation errors
- Availability conflicts
- Network errors
- Rollback on failure

---

## Future Enhancements

- [ ] Payment integration
- [ ] Email/SMS notifications
- [ ] Booking modification
- [ ] Recurring bookings
- [ ] Waitlist for full stations
- [ ] Real-time WebSocket updates
- [ ] Booking analytics dashboard
- [ ] QR code for booking confirmation

---

## Files Created/Modified

### Backend:
- ✅ `Backend/models/Booking.js` (NEW)
- ✅ `Backend/models/StationAvailability.js` (NEW)
- ✅ `Backend/controllers/bookingController.js` (NEW)
- ✅ `Backend/routes/bookingRoutes.js` (NEW)
- ✅ `Backend/server.js` (MODIFIED - added booking routes)

### Frontend:
- ✅ `app-demo/src/api/bookingApi.ts` (NEW)
- ✅ `app-demo/src/components/booking/BookingForm.tsx` (NEW)
- ✅ `app-demo/src/components/booking/BookingPanel.tsx` (MODIFIED)

---

**Status**: ✅ Fully Implemented and Integrated
**Breaking Changes**: ❌ None
**Backward Compatible**: ✅ Yes
