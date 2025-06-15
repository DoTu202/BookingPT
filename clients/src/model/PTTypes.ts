export interface PTProfile {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    phoneNumber: string;
    photoUrl?: string;
    role: string;
  };
  bio?: string;
  specializations: string[];
  experienceYears: number;
  hourlyRate: number;
  totalSessions: number;
  rating: number;
  location: {
    city: string;
    district: string;
  };
  isAcceptingClients: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  _id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isRecurring: boolean;
}

export interface Availability {
  _id: string;
  pt: string;
  date: string;
  slots: AvailabilitySlot[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  client: string;
  pt: string;
  availabilitySlot: string;
  bookingTime: {
    startTime: string;
    endTime: string;
  };
  status: 'pending_confirmation' | 'confirmed' | 'cancelled_by_client' | 'cancelled_by_pt' | 'completed' | 'rejected_by_pt' | 'rejected_by_system';
  notesFromClient?: string;
  priceAtBooking: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequest {
  ptId: string;
  availabilitySlotId: string;
  date: string;
  startTime: string;
  endTime: string;
  notesFromClient?: string;
}
