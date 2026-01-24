import { apiPost, apiGet, apiPut } from './apiClient';

export interface CreateBookingRequest {
  stationId: string;
  stationName: string;
  vehicleNumber: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  bookingDate: string; // ISO date string
  timeSlot: string;
  duration: number; // in hours
  bookingType?: 'normal' | 'emergency';
  notes?: string;
}

export interface BookingResponse {
  bookingId: string;
  stationId: string;
  stationName: string;
  vehicleNumber: string;
  userName: string;
  bookingDate: string;
  timeSlot: string;
  duration: number;
  portNumber: number;
  status: string;
  bookingType: string;
  estimatedCost: number;
  availablePortsRemaining: number;
  emergencyPortsRemaining: number;
}

export interface StationAvailability {
  stationId: string;
  stationName: string;
  totalPorts: number;
  availablePorts: number;
  occupiedPorts: number;
  emergencyPorts: number;
  utilizationRate: number;
  portDetails: Array<{
    portNumber: number;
    status: 'available' | 'occupied' | 'maintenance' | 'reserved';
    connectorType: string;
    powerRating: number;
  }>;
  lastUpdated: string;
}

/**
 * Create a new booking
 */
export async function createBooking(data: CreateBookingRequest): Promise<BookingResponse> {
  const response = await apiPost<BookingResponse>('/bookings/create', data);
  if (!response || !response.data) {
    throw new Error('Failed to create booking');
  }
  return response.data;
}

/**
 * Get station availability
 */
export async function getStationAvailability(stationId: string): Promise<StationAvailability> {
  const response = await apiGet<StationAvailability>(`/bookings/availability/${stationId}`);
  if (!response || !response.data) {
    throw new Error('Failed to fetch station availability');
  }
  return response.data;
}

/**
 * Get all bookings for a station
 */
export async function getStationBookings(
  stationId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const params: Record<string, string> = {};
  if (filters?.status) params.status = filters.status;
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;

  const response = await apiGet(`/bookings/station/${stationId}`, params);
  return response;
}

/**
 * Get booking details
 */
export async function getBookingDetails(bookingId: string) {
  const response = await apiGet(`/bookings/${bookingId}`);
  if (!response || !response.data) {
    throw new Error('Failed to fetch booking details');
  }
  return response.data;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string) {
  const response = await apiPut(`/bookings/${bookingId}/cancel`, {});
  return response;
}

/**
 * Complete a booking
 */
export async function completeBooking(
  bookingId: string,
  data: {
    energyDelivered?: number;
    actualCost?: number;
  }
) {
  const response = await apiPut(`/bookings/${bookingId}/complete`, data);
  return response;
}

/**
 * Get user's bookings
 */
export async function getUserBookings(userEmail: string) {
  const response = await apiGet(`/bookings/user/${userEmail}`);
  return response;
}
