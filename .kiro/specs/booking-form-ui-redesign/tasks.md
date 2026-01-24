# Implementation Plan: Booking Form UI Redesign

## Overview

This implementation plan breaks down the booking form UI redesign into incremental, manageable tasks. The approach follows a bottom-up strategy: building reusable components first, then composing them into the complete booking form, and finally adding polish and testing. Each task builds on previous work to ensure continuous integration and validation.

## Tasks

- [ ] 1. Set up component structure and shared utilities
  - Create directory structure for new components under `src/components/booking/redesign/`
  - Create shared TypeScript interfaces and types in `types.ts`
  - Set up custom hooks directory structure
  - Install and configure `@fast-check/jest` for property-based testing
  - _Requirements: All (foundation)_

- [ ] 2. Implement FloatingLabelInput component
  - [ ] 2.1 Create FloatingLabelInput component with label animation
    - Implement component with floating label using CSS transforms
    - Add focus, blur, and change event handlers
    - Support text, email, tel, and date input types
    - _Requirements: 2.1, 2.7_
  
  - [ ] 2.2 Add validation state rendering
    - Implement error state with inline error message display
    - Implement success state with checkmark indicator
    - Add visual indicators (border colors, icons)
    - _Requirements: 2.2, 2.3_
  
  - [ ] 2.3 Write property test for validation state rendering
    - **Property 5: Validation Feedback Display**
    - **Validates: Requirements 2.2, 2.3**
  
  - [ ] 2.4 Write unit tests for FloatingLabelInput
    - Test label animation on focus/blur
    - Test validation state rendering
    - Test keyboard interaction
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3. Implement ProgressIndicator component
  - [ ] 3.1 Create ProgressIndicator with step visualization
    - Implement step circles with icons
    - Add progress line between steps
    - Implement step state logic (completed, current, upcoming)
    - Add smooth transitions for state changes
    - _Requirements: 1.5_
  
  - [ ] 3.2 Write property test for progress indicator state consistency
    - **Property 3: Progress Indicator State Consistency**
    - **Validates: Requirements 1.5**
  
  - [ ] 3.3 Write unit tests for ProgressIndicator
    - Test step state rendering
    - Test transitions between steps
    - Test responsive layout
    - _Requirements: 1.5, 14.2_

- [ ] 4. Implement DurationSelector component
  - [ ] 4.1 Create DurationSelector with card-based UI
    - Implement duration option cards
    - Add selection state and hover effects
    - Calculate and display estimated end time
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  
  - [ ] 4.2 Write property test for end time calculation
    - **Property 9: End Time Calculation**
    - **Validates: Requirements 3.5**
  
  - [ ] 4.3 Write property test for duration selection state
    - **Property 8: Duration Selection State**
    - **Validates: Requirements 3.2**
  
  - [ ] 4.4 Write unit tests for DurationSelector
    - Test card rendering
    - Test selection behavior
    - Test end time display
    - _Requirements: 3.1, 3.2, 3.5_

- [ ] 5. Implement BookingTypeToggle component
  - [ ] 5.1 Create BookingTypeToggle with segmented control
    - Implement toggle with sliding background indicator
    - Add visual distinction for normal vs emergency
    - Display explanation text based on selection
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 5.2 Write unit tests for BookingTypeToggle
    - Test toggle behavior
    - Test visual treatment for each type
    - Test explanation text display
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Implement TimeSlotSelector component
  - [ ] 6.1 Create TimeSlotSelector with grid and list views
    - Implement grid view with time slot cards
    - Implement list view with time slot rows
    - Add view toggle functionality
    - Handle slot selection and disabled states
    - _Requirements: 2.5, 19.1, 19.2, 19.5_
  
  - [ ] 6.2 Add availability-based rendering
    - Render fully booked slots as disabled
    - Display available port count for partially available slots
    - Add loading skeleton for availability fetch
    - _Requirements: 6.2, 19.3, 19.4, 10.1_
  
  - [ ] 6.3 Write property test for time slot availability rendering
    - **Property 6: Time Slot Availability Rendering**
    - **Validates: Requirements 2.5, 6.2, 19.3, 19.4**
  
  - [ ] 6.4 Write property test for view toggle functionality
    - **Property 35: View Toggle Functionality**
    - **Validates: Requirements 19.5**
  
  - [ ] 6.5 Write unit tests for TimeSlotSelector
    - Test grid and list view rendering
    - Test slot selection
    - Test disabled state rendering
    - Test view toggle
    - _Requirements: 2.5, 6.2, 19.1, 19.2, 19.5_

- [ ] 7. Implement StationPreviewCard component
  - [ ] 7.1 Create StationPreviewCard with station information
    - Display station name, address, available chargers
    - Display power rating and connector types
    - Add glassmorphism styling
    - _Requirements: 5.1, 5.3_
  
  - [ ] 7.2 Add low availability warning
    - Implement warning indicator for low availability (< 3 chargers)
    - Add visual distinction for warning state
    - _Requirements: 5.2_
  
  - [ ] 7.3 Write property test for station preview completeness
    - **Property 10: Station Preview Completeness**
    - **Validates: Requirements 5.1**
  
  - [ ] 7.4 Write property test for low availability warning
    - **Property 11: Low Availability Warning**
    - **Validates: Requirements 5.2**
  
  - [ ] 7.5 Write unit tests for StationPreviewCard
    - Test data display
    - Test warning indicator
    - Test responsive layout
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 8. Implement CostBreakdown component
  - [ ] 8.1 Create CostBreakdown with cost calculation
    - Calculate total cost based on duration and booking type
    - Display cost breakdown (base rate, duration, emergency fee, tax)
    - Add smooth number transitions for cost updates
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 8.2 Write property test for cost calculation correctness
    - **Property 13: Cost Calculation Correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
  
  - [ ] 8.3 Write unit tests for CostBreakdown
    - Test cost calculation
    - Test breakdown display
    - Test emergency fee display
    - Test cost updates
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 9. Checkpoint - Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement form step components
  - [ ] 10.1 Create VehicleDetailsStep component
    - Use FloatingLabelInput for vehicle number
    - Add vehicle number validation (pattern matching)
    - _Requirements: 1.1, 2.2, 2.3_
  
  - [ ] 10.2 Create ContactInformationStep component
    - Use FloatingLabelInput for name, email, phone
    - Add validation for each field
    - _Requirements: 1.1, 2.2, 2.3_
  
  - [ ] 10.3 Create ScheduleStep component
    - Integrate DatePicker (custom styled or library)
    - Integrate TimeSlotSelector
    - Integrate DurationSelector
    - Integrate BookingTypeToggle
    - _Requirements: 1.1, 3.1, 4.1, 19.1_
  
  - [ ] 10.4 Create ConfirmationStep component
    - Display booking summary with all form data
    - Integrate CostBreakdown
    - Add edit buttons for each section
    - Add terms and conditions checkbox
    - _Requirements: 20.1, 20.2, 20.3, 20.5_
  
  - [ ] 10.5 Write property test for booking confirmation completeness
    - **Property 14: Booking Confirmation Completeness**
    - **Validates: Requirements 9.2, 20.1, 20.2**
  
  - [ ] 10.6 Write unit tests for step components
    - Test VehicleDetailsStep rendering and validation
    - Test ContactInformationStep rendering and validation
    - Test ScheduleStep integration
    - Test ConfirmationStep summary display
    - _Requirements: 1.1, 2.2, 2.3, 20.1, 20.2_

- [ ] 11. Implement FormStepContainer with animations
  - [ ] 11.1 Create FormStepContainer wrapper component
    - Implement step transition animations using Framer Motion
    - Handle forward and backward navigation animations
    - Maintain consistent height during transitions
    - _Requirements: 1.3, 8.6_
  
  - [ ] 11.2 Write unit tests for FormStepContainer
    - Test animation direction
    - Test content rendering
    - Test reduced motion support
    - _Requirements: 1.3, 16.1, 16.2_

- [ ] 12. Implement custom hooks for form logic
  - [ ] 12.1 Create useBookingForm hook
    - Manage form state (currentStep, formData, validation)
    - Implement step navigation logic
    - Implement form data updates
    - _Requirements: 1.2, 1.6_
  
  - [ ] 12.2 Create useFormValidation hook
    - Implement validation rules for all fields
    - Track touched fields
    - Return validation errors
    - _Requirements: 2.2, 2.3, 17.3_
  
  - [ ] 12.3 Create useAutoSave hook
    - Implement debounced auto-save to localStorage
    - Implement auto-restore on form open
    - Implement cleanup on submit/cancel
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 12.4 Create useAvailability hook
    - Fetch time slot availability when date changes
    - Implement polling for real-time updates
    - Handle loading and error states
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  
  - [ ] 12.5 Create useCostEstimate hook
    - Calculate cost based on duration and booking type
    - Update cost in real-time as inputs change
    - _Requirements: 7.1, 7.4_
  
  - [ ] 12.6 Create useKeyboardNavigation hook
    - Handle Tab and Shift+Tab navigation
    - Handle Enter key on buttons
    - Handle Escape key to close form
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ]* 12.7 Write property test for form data preservation invariant
    - **Property 2: Form Data Preservation Invariant**
    - **Validates: Requirements 1.6, 17.2, 20.4**
  
  - [ ]* 12.8 Write property test for step validation before navigation
    - **Property 1: Step Validation Before Navigation**
    - **Validates: Requirements 1.2**
  
  - [ ]* 12.9 Write property test for auto-save round trip
    - **Property 15: Auto-Save Round Trip**
    - **Validates: Requirements 11.2**
  
  - [ ]* 12.10 Write property test for availability fetch trigger
    - **Property 12: Availability Fetch Trigger**
    - **Validates: Requirements 6.1**
  
  - [ ]* 12.11 Write unit tests for custom hooks
    - Test useBookingForm state management
    - Test useFormValidation validation logic
    - Test useAutoSave save/restore/cleanup
    - Test useAvailability fetch and polling
    - Test useCostEstimate calculations
    - Test useKeyboardNavigation event handling
    - _Requirements: 1.2, 1.6, 2.2, 6.1, 7.1, 11.1, 12.1_

- [ ] 13. Checkpoint - Ensure all hook tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement main BookingForm container
  - [ ] 14.1 Create BookingForm container component
    - Integrate all custom hooks
    - Render BookingFormHeader with station info
    - Render ProgressIndicator
    - Render FormStepContainer with current step content
    - Render StationPreviewCard in sidebar
    - Render FormNavigation (back/next/submit buttons)
    - _Requirements: 1.1, 1.4, 1.5, 5.1_
  
  - [ ] 14.2 Implement step navigation logic
    - Handle next button click with validation
    - Handle back button click
    - Handle step click from progress indicator (optional)
    - Update focus on step change
    - _Requirements: 1.2, 1.4, 12.6_
  
  - [ ] 14.3 Implement form submission
    - Validate all steps before submission
    - Call createBooking API
    - Handle loading state during submission
    - Handle success and error responses
    - _Requirements: 10.2, 17.1, 17.2_
  
  - [ ]* 14.4 Write property test for back button visibility
    - **Property 4: Back Button Visibility**
    - **Validates: Requirements 1.4**
  
  - [ ]* 14.5 Write property test for step transition focus management
    - **Property 19: Step Transition Focus Management**
    - **Validates: Requirements 12.6**
  
  - [ ]* 14.6 Write unit tests for BookingForm
    - Test initial render
    - Test step navigation
    - Test form submission
    - Test error handling
    - _Requirements: 1.1, 1.2, 1.4, 10.2, 17.1_

- [ ] 15. Implement SuccessModal component
  - [ ] 15.1 Create SuccessModal with confirmation display
    - Display success animation (confetti or checkmark)
    - Show booking confirmation details
    - Add action buttons (download, add to calendar, share)
    - Implement auto-close after 10 seconds
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ]* 15.2 Write unit tests for SuccessModal
    - Test confirmation display
    - Test action buttons
    - Test auto-close behavior
    - _Requirements: 9.2, 9.3_

- [ ] 16. Implement accessibility features
  - [ ] 16.1 Add ARIA labels and roles to all components
    - Add aria-label to all form inputs
    - Add role attributes to interactive components
    - Add aria-describedby for error messages
    - _Requirements: 13.1, 13.2_
  
  - [ ] 16.2 Implement ARIA live regions
    - Add live region for step change announcements
    - Add live region for error announcements
    - Add live region for loading state announcements
    - _Requirements: 13.3, 13.4_
  
  - [ ] 16.3 Implement focus management
    - Trap focus within modal
    - Move focus to first error on validation failure
    - Restore focus on modal close
    - _Requirements: 13.6_
  
  - [ ] 16.4 Ensure heading hierarchy
    - Review and fix heading levels throughout form
    - Ensure no skipped heading levels
    - _Requirements: 13.5_
  
  - [ ]* 16.5 Write property test for ARIA label completeness
    - **Property 20: ARIA Label Completeness**
    - **Validates: Requirements 13.1, 13.2**
  
  - [ ]* 16.6 Write property test for ARIA live region announcements
    - **Property 21: ARIA Live Region Announcements**
    - **Validates: Requirements 13.3, 13.4**
  
  - [ ]* 16.7 Write property test for heading hierarchy validity
    - **Property 22: Heading Hierarchy Validity**
    - **Validates: Requirements 13.5**
  
  - [ ]* 16.8 Write property test for error focus management
    - **Property 23: Error Focus Management**
    - **Validates: Requirements 13.6**
  
  - [ ]* 16.9 Write property test for focus indicator presence
    - **Property 18: Focus Indicator Presence**
    - **Validates: Requirements 12.5**
  
  - [ ]* 16.10 Write accessibility tests using jest-axe
    - Test all components for accessibility violations
    - Test keyboard navigation
    - Test screen reader compatibility
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 17. Implement responsive design
  - [ ] 17.1 Add responsive styles for mobile devices
    - Implement single column layout for mobile
    - Adjust progress indicator for mobile
    - Ensure touch target sizes meet minimum (44x44px)
    - Use native date/time pickers on mobile
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [ ] 17.2 Test responsive behavior at different breakpoints
    - Test at 320px (small mobile)
    - Test at 768px (tablet)
    - Test at 1024px (desktop)
    - _Requirements: 14.1, 14.2, 14.5_
  
  - [ ]* 17.3 Write property test for responsive layout adaptation
    - **Property 24: Responsive Layout Adaptation**
    - **Validates: Requirements 14.1, 14.2**
  
  - [ ]* 17.4 Write property test for touch target sizing
    - **Property 25: Touch Target Sizing**
    - **Validates: Requirements 14.3**
  
  - [ ]* 17.5 Write property test for mobile native inputs
    - **Property 26: Mobile Native Inputs**
    - **Validates: Requirements 14.4**
  
  - [ ]* 17.6 Write property test for content accessibility on small screens
    - **Property 27: Content Accessibility on Small Screens**
    - **Validates: Requirements 14.5**
  
  - [ ]* 17.7 Write responsive design tests
    - Test layout at different viewport sizes
    - Test touch interactions on mobile
    - Test scrolling behavior
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 18. Implement dark mode optimization
  - [ ] 18.1 Review and optimize colors for dark mode
    - Ensure sufficient contrast ratios (WCAG AA)
    - Use lighter text colors on dark backgrounds
    - Adjust gradient accents for visibility
    - _Requirements: 15.1, 15.2, 15.4_
  
  - [ ]* 18.2 Write property test for color contrast compliance
    - **Property 28: Color Contrast Compliance**
    - **Validates: Requirements 15.1**
  
  - [ ]* 18.3 Write property test for text color on dark backgrounds
    - **Property 29: Text Color on Dark Backgrounds**
    - **Validates: Requirements 15.2**
  
  - [ ]* 18.4 Write color contrast tests
    - Test contrast ratios for all text elements
    - Test visibility of interactive elements
    - _Requirements: 15.1, 15.2_

- [ ] 19. Implement reduced motion support
  - [ ] 19.1 Add prefers-reduced-motion media query support
    - Detect prefers-reduced-motion setting
    - Disable animations when enabled
    - Use instant transitions instead of animated ones
    - Maintain all functionality without animations
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ]* 19.2 Write property test for reduced motion compliance
    - **Property 30: Reduced Motion Compliance**
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4**
  
  - [ ]* 19.3 Write reduced motion tests
    - Test animation behavior with reduced motion enabled
    - Test functionality with animations disabled
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 20. Checkpoint - Ensure all accessibility and responsive tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Implement smart defaults and suggestions
  - [ ] 21.1 Add smart default time slot suggestion
    - Suggest next available time slot on form open
    - Pre-select earliest available slot when date changes
    - _Requirements: 18.1, 18.2_
  
  - [ ] 21.2 Add low availability station suggestion
    - Display suggestion when station has < 3 available chargers
    - Suggest nearby stations with better availability
    - _Requirements: 18.4_
  
  - [ ] 21.3 Add contact information pre-fill (optional)
    - Check for previous bookings in localStorage
    - Pre-fill contact info if found
    - _Requirements: 18.5_
  
  - [ ]* 21.4 Write property test for smart default time slot
    - **Property 33: Smart Default Time Slot**
    - **Validates: Requirements 18.1, 18.2**
  
  - [ ]* 21.5 Write property test for low availability station suggestion
    - **Property 34: Low Availability Station Suggestion**
    - **Validates: Requirements 18.4**
  
  - [ ]* 21.6 Write unit tests for smart defaults
    - Test time slot suggestion logic
    - Test station suggestion logic
    - Test contact info pre-fill
    - _Requirements: 18.1, 18.2, 18.4, 18.5_

- [ ] 22. Implement advanced error handling
  - [ ] 22.1 Add time slot conflict handling
    - Detect when selected slot becomes unavailable
    - Notify user and suggest alternatives
    - _Requirements: 17.4_
  
  - [ ] 22.2 Add offline detection and handling
    - Detect offline state
    - Display offline indicator
    - Disable submit when offline
    - _Requirements: 17.5_
  
  - [ ]* 22.3 Write property test for error message display
    - **Property 31: Error Message Display**
    - **Validates: Requirements 17.1, 17.3**
  
  - [ ]* 22.4 Write property test for time slot conflict handling
    - **Property 32: Time Slot Conflict Handling**
    - **Validates: Requirements 17.4**
  
  - [ ]* 22.5 Write error handling tests
    - Test API error handling
    - Test validation error display
    - Test conflict resolution
    - Test offline handling
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 23. Implement keyboard navigation
  - [ ] 23.1 Test and refine keyboard navigation
    - Verify Tab/Shift+Tab order
    - Verify Enter key on buttons
    - Verify Escape key to close
    - Verify focus indicators
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 23.2 Write property test for keyboard navigation order
    - **Property 16: Keyboard Navigation Order**
    - **Validates: Requirements 12.1, 12.2**
  
  - [ ]* 23.3 Write property test for Enter key navigation
    - **Property 17: Enter Key Navigation**
    - **Validates: Requirements 12.3**
  
  - [ ]* 23.4 Write keyboard navigation tests
    - Test Tab navigation through form
    - Test Enter key on buttons
    - Test Escape key
    - Test focus indicators
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 24. Add character counter to notes field
  - [ ] 24.1 Implement character counter for notes field
    - Display remaining character count
    - Update counter in real-time
    - Show warning when approaching limit
    - _Requirements: 2.6_
  
  - [ ]* 24.2 Write property test for character counter accuracy
    - **Property 7: Character Counter Accuracy**
    - **Validates: Requirements 2.6**
  
  - [ ]* 24.3 Write unit tests for character counter
    - Test counter display
    - Test counter updates
    - Test limit enforcement
    - _Requirements: 2.6_

- [ ] 25. Integration testing
  - [ ]* 25.1 Write end-to-end integration tests
    - Test complete booking flow from start to finish
    - Test step navigation with validation
    - Test form auto-save and restore
    - Test error handling and recovery
    - Test success modal display
    - _Requirements: All_
  
  - [ ]* 25.2 Write property-based integration tests
    - Test form behavior with random user input sequences
    - Test data integrity across random navigation patterns
    - Test validation with randomly generated valid/invalid data
    - _Requirements: All_

- [ ] 26. Performance optimization
  - [ ] 26.1 Optimize component re-renders
    - Add React.memo to expensive components
    - Optimize useCallback and useMemo usage
    - Profile and fix unnecessary re-renders
    - _Requirements: Performance (non-functional)_
  
  - [ ] 26.2 Optimize animations
    - Ensure 60fps during transitions
    - Use GPU-accelerated properties (transform, opacity)
    - Remove will-change after animations
    - _Requirements: 8.1, 8.2, 8.5, 8.6_
  
  - [ ] 26.3 Optimize bundle size
    - Lazy load SuccessModal
    - Tree-shake unused Framer Motion features
    - Analyze and reduce bundle size
    - _Requirements: Performance (non-functional)_

- [ ] 27. Final checkpoint - Ensure all tests pass
  - Run full test suite (unit + property + integration)
  - Fix any failing tests
  - Ensure code coverage meets targets
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 28. Replace old BookingForm with redesigned version
  - [ ] 28.1 Update imports in parent components
    - Update SentinelMap.tsx to use new BookingForm
    - Remove old BookingForm component
    - Test integration with map component
    - _Requirements: All_
  
  - [ ] 28.2 Final manual testing
    - Test complete booking flow manually
    - Test on different devices and browsers
    - Test accessibility with screen reader
    - Test keyboard navigation
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples, edge cases, and integration points
- The implementation follows a bottom-up approach: components → hooks → container → integration
- All components should be built with accessibility in mind from the start
- Performance optimization is done after functionality is complete
- The final task replaces the old form with the new redesigned version
