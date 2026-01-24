# Recovery Simulation System ✅

## Overview
Implemented an automated recovery simulation system that transitions critical (red) stations through warning (yellow) to safe (green) status, with real-time data updates and animated progress visualization.

## Features

### 🔄 Recovery Process Flow

```
CRITICAL (Red) Station
    ↓ [10 seconds]
    ├─ Temperature: 108°C → 85°C
    ├─ Load: 96% → 78%
    ├─ Efficiency: 72% → 88%
    └─ Status: CRITICAL → WARNING
    ↓
WARNING (Yellow) Station  
    ↓ [10 seconds]
    ├─ Temperature: 85°C → 62°C
    ├─ Load: 78% → 45%
    ├─ Efficiency: 88% → 96%
    └─ Status: WARNING → SAFE
    ↓
SAFE (Green) Station ✅
```

### 📊 Real-Time Data Updates

During recovery, all metrics smoothly transition:

#### Phase 1: Critical → Warning (0-50%)
- **Temperature**: 108°C gradually decreases to 85°C
- **Load**: 96% gradually decreases to 78%
- **Efficiency**: 72% gradually increases to 88%
- **Uptime**: 87% gradually increases to 94%
- **Color**: Red → Amber
- **Messages**:
  - "Initiating emergency recovery protocol..."
  - "Reducing load distribution..."
  - "Activating cooling systems..."
  - "Temperature stabilizing..."
  - "Load balancing in progress..."
  - "Transitioning to warning state..."

#### Phase 2: Warning → Safe (50-100%)
- **Temperature**: 85°C gradually decreases to 62°C
- **Load**: 78% gradually decreases to 45%
- **Efficiency**: 88% gradually increases to 96%
- **Uptime**: 94% gradually increases to 99%
- **Color**: Amber → Green
- **Messages**:
  - "Continuing recovery process..."
  - "Optimizing power distribution..."
  - "System efficiency improving..."
  - "Temperature within safe range..."
  - "Final system checks..."
  - "Recovery complete - System optimal!"

### 🎨 Visual Features

#### Recovery Button (Critical Stations Only)
- Appears only when station is in critical state
- Red background with hover effect
- Clear call-to-action: "Start Recovery Process"
- Icon: Rotating refresh icon

#### Recovery Progress Panel
- **Color-coded by phase**:
  - Red background during critical phase
  - Amber background during warning phase
  - Green background when approaching safe
  
- **Animated Progress Bar**:
  - Smooth 0-100% animation
  - Color matches current phase
  - Updates every 100ms

- **Live Metrics Display**:
  - Temperature (color-coded)
  - Load percentage (color-coded)
  - Efficiency (color-coded)
  - Current phase indicator

- **Status Messages**:
  - Context-aware messages
  - Updates based on progress
  - Monospace font for technical feel

### 🔧 Technical Implementation

#### Recovery Simulation (`src/utils/recoverySimulation.ts`)

**Key Functions**:

1. **`simulateRecovery()`**
   - Main recovery simulation function
   - Takes station, progress callback, completion callback
   - Returns cleanup function
   - Updates every 100ms for smooth animation
   - Total duration: 20 seconds (10s per phase)

2. **`getInterpolatedMetrics()`**
   - Smoothly interpolates between status metrics
   - Uses linear interpolation (lerp)
   - Ensures realistic transitions

3. **`getRecoveryMessage()`**
   - Returns contextual messages based on progress
   - Different messages for each phase
   - Updates at specific progress thresholds

#### Component Integration (`EVStationSidebar.tsx`)

**State Management**:
```typescript
const [isRecovering, setIsRecovering] = useState(false);
const [recoveryProgress, setRecoveryProgress] = useState<RecoveryProgress | null>(null);
const recoveryCleanupRef = useRef<(() => void) | null>(null);
```

**Recovery Handler**:
```typescript
const handleStartRecovery = () => {
  const cleanup = simulateRecovery(
    selectedStation,
    (progress) => {
      setRecoveryProgress(progress);
      // Update station status when phase changes
      if (progress.phase === 'warning') {
        updateStationStatus(selectedStation.id, 'warning');
      } else if (progress.phase === 'safe') {
        updateStationStatus(selectedStation.id, 'safe');
      }
    },
    () => {
      // Recovery complete
      setIsRecovering(false);
      updateStationStatus(selectedStation.id, 'safe');
    }
  );
  recoveryCleanupRef.current = cleanup;
};
```

**Cleanup on Unmount**:
```typescript
useEffect(() => {
  return () => {
    if (recoveryCleanupRef.current) {
      recoveryCleanupRef.current();
    }
  };
}, [selectedStation?.id]);
```

### 📈 Data Synchronization

**During Recovery**:
1. Progress updates every 100ms
2. Metrics interpolate smoothly between status levels
3. Station status updates in store when phase changes
4. All UI elements reflect current recovery state
5. Charts and graphs show transitioning data

**After Recovery**:
1. Station status set to 'safe' in store
2. All metrics show safe values
3. Recovery UI hidden
4. Normal station display restored

## Files Created/Modified

### Created:
- ✅ `app-demo/src/utils/recoverySimulation.ts` - Recovery simulation engine

### Modified:
- ✅ `app-demo/src/components/twin/EVStationSidebar.tsx` - Added recovery UI and logic
- ✅ `app-demo/src/store/useDemoStore.ts` - Already had `updateStationStatus` method

## Usage

### For Users:

1. **Select a critical (red) station** on the map
2. **Open the sidebar** - See station details
3. **Click "Start Recovery Process"** button
4. **Watch the recovery**:
   - Progress bar animates 0-100%
   - Temperature decreases in real-time
   - Load reduces gradually
   - Efficiency improves
   - Status changes: Red → Yellow → Green
5. **Recovery completes** - Station is now safe!

### For Developers:

```typescript
import { simulateRecovery } from './utils/recoverySimulation';

// Start recovery
const cleanup = simulateRecovery(
  station,
  (progress) => {
    console.log(`Progress: ${progress.progress}%`);
    console.log(`Phase: ${progress.phase}`);
    console.log(`Temp: ${progress.currentTemp}°C`);
  },
  () => {
    console.log('Recovery complete!');
  }
);

// Cancel recovery if needed
cleanup();
```

## Configuration

### Recovery Duration
Edit `RECOVERY_PHASES` in `recoverySimulation.ts`:
```typescript
const RECOVERY_PHASES = {
  criticalToWarning: 10, // seconds
  warningToSafe: 10,     // seconds
};
```

### Update Frequency
Edit `updateInterval` in `simulateRecovery()`:
```typescript
const updateInterval = 100; // milliseconds (100ms = smooth)
```

### Recovery Messages
Edit `RECOVERY_MESSAGES` in `recoverySimulation.ts`:
```typescript
const RECOVERY_MESSAGES = {
  critical: {
    0: 'Your custom message...',
    // ...
  }
};
```

## Benefits

✅ **Realistic Simulation** - Smooth transitions with interpolated data
✅ **Visual Feedback** - Clear progress indication
✅ **Real-Time Updates** - All metrics update during recovery
✅ **Status Synchronization** - Store updates when phase changes
✅ **Cancellable** - Can be stopped if station changes
✅ **Reusable** - Works for any critical station
✅ **Performant** - Efficient 100ms update cycle
✅ **Type-Safe** - Full TypeScript support

## Testing

- ✅ No TypeScript errors
- ✅ Smooth animations
- ✅ Proper cleanup on unmount
- ✅ Status updates in store
- ✅ All metrics interpolate correctly
- ✅ Messages update appropriately

## Demo Flow

1. **Initial State**: Station is critical (red)
   - Temp: 108°C, Load: 96%, Efficiency: 72%
   - Red colors throughout UI
   - "Start Recovery Process" button visible

2. **Recovery Started**: Progress 0-50%
   - Button disappears
   - Progress panel appears (red)
   - Metrics start decreasing
   - Messages update: "Initiating...", "Reducing load...", etc.

3. **Phase Transition**: Progress 50%
   - Status changes to WARNING
   - Colors change to amber
   - Metrics continue improving
   - Messages: "Continuing recovery...", "Optimizing..."

4. **Final Phase**: Progress 50-100%
   - Amber colors throughout
   - Temp approaching 62°C
   - Load approaching 45%
   - Messages: "Final checks...", "Recovery complete!"

5. **Complete**: Progress 100%
   - Status changes to SAFE
   - Colors change to green
   - Recovery panel disappears
   - Station shows optimal metrics

## Future Enhancements (Optional)

1. **Manual Control** - Allow users to pause/resume recovery
2. **Speed Control** - Adjust recovery speed
3. **Recovery History** - Log all recovery events
4. **Failure Simulation** - Simulate recovery failures
5. **Cost Calculation** - Show recovery cost/time
6. **Notifications** - Alert when recovery completes
7. **Multi-Station** - Recover multiple stations simultaneously
8. **Recovery Strategies** - Different recovery approaches
