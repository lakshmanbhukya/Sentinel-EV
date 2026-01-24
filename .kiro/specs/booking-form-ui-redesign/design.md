# Design Document: Booking Form UI Redesign

## Overview

This design document outlines the technical approach for redesigning the EV charging station booking form UI to deliver a world-class, modern interface. The redesign transforms the existing functional form into a premium, delightful experience that matches the quality standards of leading EV and technology brands.

### Design Philosophy

The redesign follows these core principles:

1. **Progressive Disclosure**: Break the form into digestible steps to reduce cognitive load
2. **Immediate Feedback**: Provide real-time validation and visual feedback for all user actions
3. **Delightful Interactions**: Use subtle animations and micro-interactions to create an engaging experience
4. **Accessibility First**: Ensure the interface works for all users, including those using assistive technologies
5. **Performance**: Optimize animations and API calls to maintain smooth 60fps interactions

### Technology Stack

- **React 18+**: Component framework with hooks for state management
- **TypeScript**: Type safety for props, state, and API contracts
- **Framer Motion**: Animation library for smooth transitions and micro-interactions
- **Tailwind CSS**: Utility-first CSS for styling with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form** (optional): Form state management with validation
- **Zod** (optional): Schema validation for form inputs

## Architecture

### Component Structure

The redesigned booking form follows a modular architecture with clear separation of concerns:

```
BookingForm (Container)
├── BookingFormHeader (Station info, close button)
├── ProgressIndicator (Step tracker)
├── FormStepContainer (Step content wrapper with animations)
│   ├── VehicleDetailsStep
│   │   └── FloatingLabelInput
│   ├── ContactInformationStep
│   │   ├── FloatingLabelInput (Name)
│   │   ├── FloatingLabelInput (Email)
│   │   └── FloatingLabelInput (Phone)
│   ├── ScheduleStep
│   │   ├── DatePicker (Custom styled)
│   │   ├── TimeSlotSelector (Grid or List view)
│   │   ├── DurationSelector (Card-based)
│   │   └── BookingTypeToggle
│   └── ConfirmationStep
│       ├── BookingSummary
│       ├── CostBreakdown
│       └── TermsCheckbox
├── StationPreviewCard (Sticky sidebar)
├── FormNavigation (Back/Next/Submit buttons)
└── SuccessModal (Booking confirmation)
```

### State Management

The form uses React hooks for state management with the following structure:

```typescript
interface BookingFormState {
  currentStep: number; // 1-4
  formData: {
    vehicleNumber: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    bookingDate: string;
    timeSlot: string;
    duration: number;
    bookingType: 'normal' | 'emergency';
    notes: string;
  };
  validation: {
    errors: Record<string, string>;
    touched: Set<string>;
  };
  availability: {
    loading: boolean;
    data: TimeSlotAvailability[] | null;
    error: string | null;
  };
  costEstimate: {
    baseRate: number;
    durationCost: number;
    emergencyFee: number;
    total: number;
  };
  isSubmitting: boolean;
  autoSaveEnabled: boolean;
}
```

### Data Flow

1. **Form Initialization**: Load station data, check for auto-saved data in localStorage
2. **Step Navigation**: Validate current step before allowing navigation to next step
3. **Real-time Validation**: Validate fields on blur and show inline errors
4. **Availability Fetching**: Fetch available time slots when date is selected
5. **Cost Calculation**: Calculate estimated cost when duration or booking type changes
6. **Auto-save**: Debounce form data changes and save to localStorage
7. **Submission**: Validate all steps, submit to API, show success modal
8. **Cleanup**: Clear auto-saved data on successful submission

## Components and Interfaces

### 1. FloatingLabelInput Component

A reusable input component with floating label animation and validation feedback.

```typescript
interface FloatingLabelInputProps {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  icon?: React.ComponentType;
  autoComplete?: string;
}
```

**Behavior**:
- Label floats above input when focused or when value is not empty
- Shows success checkmark when valid and touched
- Shows error icon and message when invalid and touched
- Applies smooth transitions for all state changes (200ms ease-in-out)
- Focus state includes border glow effect using box-shadow

**Implementation Notes**:
- Use `transform: translateY()` for label animation (better performance than `top`)
- Use CSS transitions for smooth animations
- Apply `will-change: transform` only during animation to optimize performance

### 2. ProgressIndicator Component

Visual step tracker showing current progress through the booking flow.

```typescript
interface ProgressIndicatorProps {
  currentStep: number;
  steps: Array<{
    number: number;
    label: string;
    icon: React.ComponentType;
  }>;
  onStepClick?: (step: number) => void; // Optional: allow clicking completed steps
}
```

**Behavior**:
- Completed steps show checkmark icon with green gradient background
- Current step shows step icon with blue gradient background and scale animation
- Future steps show step icon with gray background
- Progress line between steps fills with gradient as steps are completed
- Smooth transitions when moving between steps (300ms spring animation)

### 3. TimeSlotSelector Component

Interactive time slot selection with grid and list view options.

```typescript
interface TimeSlotSelectorProps {
  selectedDate: string;
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
  availability: TimeSlotAvailability[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

interface TimeSlotAvailability {
  time: string; // "09:00"
  available: boolean;
  availablePorts: number;
  totalPorts: number;
}
```

**Behavior**:
- Grid view displays time slots as cards in a 3-4 column grid
- List view displays time slots as rows with availability bars
- Unavailable slots are grayed out and non-interactive
- Selected slot has blue gradient border and background
- Hover effect on available slots (scale 1.02, border glow)
- Shows loading skeleton while fetching availability

### 4. DurationSelector Component

Visual duration selection using interactive cards.

```typescript
interface DurationSelectorProps {
  selectedDuration: number;
  onDurationSelect: (duration: number) => void;
  options: Array<{
    value: number; // hours
    label: string; // "2 hours"
    recommended?: boolean;
  }>;
}
```

**Behavior**:
- Displays duration options as cards in a horizontal row
- Selected card has blue gradient background and white text
- Unselected cards have dark background with border
- Recommended option shows a small "Recommended" badge
- Hover effect includes scale and border glow
- Shows estimated end time below selected duration

### 5. BookingTypeToggle Component

Segmented control for selecting normal vs emergency booking.

```typescript
interface BookingTypeToggleProps {
  selectedType: 'normal' | 'emergency';
  onTypeChange: (type: 'normal' | 'emergency') => void;
}
```

**Behavior**:
- Displays as a segmented control with two options
- Selected option has sliding background indicator (animated)
- Normal booking uses blue/green accent colors
- Emergency booking uses red/orange accent colors
- Shows brief explanation text below toggle based on selection
- Smooth sliding animation for background indicator (300ms ease-out)

### 6. StationPreviewCard Component

Sticky sidebar showing station information and availability.

```typescript
interface StationPreviewCardProps {
  station: Station;
  availability: StationAvailability;
  refreshing: boolean;
}
```

**Behavior**:
- Displays station name, address, and key metrics
- Shows available chargers with visual indicator (green if >3, yellow if 1-3, red if 0)
- Displays power rating and connector types
- Updates in real-time when availability changes
- Shows pulsing indicator when refreshing data
- Uses glassmorphism effect for background

### 7. CostBreakdown Component

Displays estimated charging cost with breakdown.

```typescript
interface CostBreakdownProps {
  baseRate: number;
  duration: number;
  bookingType: 'normal' | 'emergency';
  emergencyFeePercentage: number;
}
```

**Behavior**:
- Calculates and displays total estimated cost
- Shows breakdown: base rate × duration + emergency fee (if applicable)
- Highlights emergency fee in orange/red if present
- Updates in real-time as duration or booking type changes
- Uses smooth number transitions for cost updates (count-up animation)

### 8. SuccessModal Component

Celebration modal shown after successful booking.

```typescript
interface SuccessModalProps {
  booking: BookingResponse;
  onClose: () => void;
  onDownload: () => void;
  onAddToCalendar: () => void;
  onShare: () => void;
}
```

**Behavior**:
- Displays success animation (confetti or checkmark animation)
- Shows booking confirmation details (ID, station, date, time, port)
- Provides action buttons: Download, Add to Calendar, Share
- Auto-closes after 10 seconds or on user action
- Uses spring animation for entrance (scale + fade)

### 9. FormStepContainer Component

Wrapper component that handles step transitions with animations.

```typescript
interface FormStepContainerProps {
  currentStep: number;
  children: React.ReactNode;
  direction: 'forward' | 'backward';
}
```

**Behavior**:
- Animates step content when changing steps
- Forward navigation: slide left + fade out old, slide in from right + fade in new
- Backward navigation: slide right + fade out old, slide in from left + fade in new
- Uses Framer Motion's AnimatePresence for exit animations
- Maintains consistent height during transitions to prevent layout shift

## Data Models

### Form Data Model

```typescript
interface BookingFormData {
  // Step 1: Vehicle Details
  vehicleNumber: string; // Format: XX00XX0000 (uppercase)
  
  // Step 2: Contact Information
  userName: string; // Min 2 characters
  userEmail: string; // Valid email format
  userPhone: string; // Valid phone format
  
  // Step 3: Schedule
  bookingDate: string; // ISO date string, must be future date
  timeSlot: string; // Format: "HH:MM" (24-hour)
  duration: number; // 0.5, 1, 2, 3, or 4 hours
  bookingType: 'normal' | 'emergency';
  notes: string; // Optional, max 500 characters
}
```

### Validation Rules

```typescript
interface ValidationRules {
  vehicleNumber: {
    required: true;
    pattern: /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    message: "Enter valid vehicle number (e.g., KA01AB1234)";
  };
  userName: {
    required: true;
    minLength: 2;
    maxLength: 100;
    message: "Name must be 2-100 characters";
  };
  userEmail: {
    required: true;
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    message: "Enter a valid email address";
  };
  userPhone: {
    required: true;
    pattern: /^[+]?[0-9]{10,15}$/;
    message: "Enter a valid phone number";
  };
  bookingDate: {
    required: true;
    validate: (date: string) => new Date(date) > new Date();
    message: "Select a future date";
  };
  timeSlot: {
    required: true;
    validate: (slot: string, date: string) => {
      const selectedDateTime = new Date(`${date}T${slot}`);
      return selectedDateTime > new Date();
    };
    message: "Select a future time";
  };
  duration: {
    required: true;
    enum: [0.5, 1, 2, 3, 4];
    message: "Select a valid duration";
  };
  notes: {
    maxLength: 500;
    message: "Notes cannot exceed 500 characters";
  };
}
```

### Auto-Save Data Model

```typescript
interface AutoSaveData {
  stationId: string;
  formData: BookingFormData;
  timestamp: number; // Unix timestamp
  expiresAt: number; // Unix timestamp (24 hours from save)
}

// LocalStorage key format: `booking_autosave_${stationId}`
```

### Time Slot Availability Model

```typescript
interface TimeSlotAvailability {
  time: string; // "09:00"
  available: boolean;
  availablePorts: number;
  totalPorts: number;
  estimatedWaitTime?: number; // minutes, if fully booked
}

interface AvailabilityResponse {
  stationId: string;
  date: string;
  slots: TimeSlotAvailability[];
  lastUpdated: string; // ISO timestamp
}
```

### Cost Estimation Model

```typescript
interface CostEstimate {
  baseRatePerHour: number; // ₹/hour
  duration: number; // hours
  durationCost: number; // baseRate × duration
  emergencyFeePercentage: number; // 0 for normal, 20 for emergency
  emergencyFee: number; // durationCost × (emergencyFeePercentage / 100)
  subtotal: number; // durationCost + emergencyFee
  tax: number; // subtotal × 0.18 (18% GST)
  total: number; // subtotal + tax
  currency: string; // "INR"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

