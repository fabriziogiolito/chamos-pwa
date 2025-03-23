# Social Workout PWA - Technical Specifications

## Overview
A Next.js Progressive Web Application that enables friends to track fitness activities, share progress, and motivate each other through social features and statistics.

## Core Features
1. **User Authentication & Social Connections**
   - Email/password and social login options
   - User profiles with structured fitness goals
   - Friend/connection management with group creation
   - Privacy controls for sharing data

2. **Activity Tracking**
   - Daily gym attendance check-in
   - Weekly weight logging with history
   - Body measurements tracking
   - Progress photo uploads with privacy options
   - Workout logging (optional feature)

3. **Social Feed & Engagement**
   - Activity feed of friends' fitness updates
   - Comment and reaction system
   - Achievement badges and milestones
   - Challenges and group goals
   - Push notifications for friend activities

4. **Statistics & Visualization**
   - Personal progress charts (weight, attendance)
   - Group comparison statistics
   - Streak tracking
   - Weekly/monthly reports
   - Exportable data

## Technical Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **State Management**: 
  - React Context API for UI state
  - Redux for global state management
- **Styling**: 
  - Tailwind CSS
  - shadcn/ui for component library (built on Radix UI)
- **PWA Implementation**:
  - next-pwa package
  - Web manifest configuration
  - Service worker for offline functionality

### Data Visualization
- **Charting Library**: Recharts
  - Responsive charts
  - Support for line, bar, and area charts
  - Customizable styling
  - Touch-friendly interactions

### Backend & Data
- **Platform**: Firebase
  - **Authentication**: Firebase Authentication
  - **Database**: Cloud Firestore
  - **Storage**: Firebase Storage (for images)
  - **Push Notifications**: Firebase Cloud Messaging with web push
- **Analytics**: Firebase Analytics or Vercel Analytics

### Additional Libraries
- **Form Management**: React Hook Form + Zod
- **Image Handling**:
  - next/image for optimization
  - react-dropzone for uploads
- **Date & Time**: date-fns
- **Testing**: Jest, React Testing Library, and Cypress
- **Authentication**: NextAuth.js (integrated with Firebase)

## Data Models

### User
```
{
  id: string,
  username: string,
  email: string,
  profilePicture: string,
  fitnessGoals: [
    {
      id: string,
      type: string, // "weight_loss", "muscle_gain", "endurance", "strength", "consistency", etc.
      title: string,
      description: string,
      targetValue: number,
      currentValue: number,
      metric: string, // "kg", "steps", "days_per_week", etc.
      startDate: timestamp,
      targetDate: timestamp,
      isCompleted: boolean,
      progress: number // percentage or current value
    }
  ],
  startingWeight: number,
  currentWeight: number,
  friendIds: string[],
  groupIds: string[],
  privacySettings: {
    shareWeight: boolean,
    sharePhotos: boolean,
    shareAttendance: boolean
  },
  createdAt: timestamp,
  lastActive: timestamp,
  pushNotificationEnabled: boolean,
  pushSubscription: object
}
```

### WeightLog
```
{
  id: string,
  userId: string,
  date: timestamp,
  weight: number,
  notes: string,
  isPrivate: boolean
}
```

### GymAttendance
```
{
  id: string,
  userId: string,
  date: timestamp,
  attended: boolean,
  workoutType: string,
  duration: number,
  isPrivate: boolean
}
```

### ProgressPhoto
```
{
  id: string,
  userId: string,
  imageUrl: string,
  date: timestamp,
  caption: string,
  visibleTo: string[] // 'public', 'friends', or specific groupIds
}
```

### Group
```
{
  id: string,
  name: string,
  description: string,
  memberIds: string[],
  adminIds: string[],
  createdAt: timestamp,
  groupGoals: [
    {
      id: string,
      title: string,
      description: string,
      type: string,
      targetValue: number,
      currentValue: number,
      metric: string,
      startDate: timestamp,
      endDate: timestamp,
      participantIds: string[],
      status: string // "active", "completed", "failed"
    }
  ],
  groupChallenges: [
    {
      id: string,
      title: string,
      description: string,
      type: string,
      rules: string,
      startDate: timestamp,
      endDate: timestamp,
      participantIds: string[],
      leaderboard: [
        {
          userId: string,
          progress: number,
          rank: number
        }
      ],
      status: string // "upcoming", "active", "completed"
    }
  ]
}
```

## Pages & UI Structure

### Main Pages
1. **Authentication**
   - `/signin` - Login page
   - `/signup` - Registration page
   - `/forgot-password` - Password recovery

2. **Core App Pages**
   - `/` - Dashboard/Feed
   - `/track` - Activity logging
   - `/stats` - Statistics and charts
   - `/groups` - Group management
   - `/profile` - User profile
   - `/settings` - App settings

3. **Dynamic Routes**
   - `/profile/[userId]` - View other user profiles
   - `/groups/[groupId]` - Group details
   - `/photo/[photoId]` - Individual photo view
   - `/goals/[goalId]` - Goal details and tracking

4. **Goal Management**
   - `/goals` - Goals overview
   - `/goals/new` - Create new goal
   - `/goals/[goalId]/edit` - Edit existing goal

### Layout Components
- `RootLayout` - Base layout with authentication check
- `AppShell` - Main authenticated layout with navigation
- `MobileNavBar` - Bottom navigation for mobile
- `DesktopSidebar` - Side navigation for desktop

## API Routes
- `/api/auth/*` - Authentication endpoints
- `/api/users` - User management
- `/api/logs` - Activity logging
- `/api/photos` - Progress photo handling
- `/api/groups` - Group operations
- `/api/goals` - Goal management
- `/api/notifications` - Push notification management

## Goal-Related Features
- **Goal Creation Wizard**:
  - Step-by-step process for creating structured goals
  - Templates for common fitness goals
  - Custom goal creation
- **Goal Tracking**:
  - Automated progress tracking based on logged activities
  - Manual progress updates
  - Visual progress indicators
- **Goal Visualization**:
  - Timeline views for long-term goals
  - Progress charts specific to goal type
  - Comparison with past goals
- **Goal Sharing**:
  - Share goals with friends or groups
  - Create collaborative goals
  - Privacy controls for sensitive goals

## PWA Features
- **Offline Support**: 
  - Caching of recent feed items
  - Offline logging (sync when back online)
  - Service worker update handling
- **Installation**:
  - Web manifest with app icons
  - Install prompts
  - Full-screen mode
- **Push Notifications**:
  - Friend activity alerts
  - Goal progress reminders
  - Achievement notifications
- **Background Sync**:
  - Queue updates when offline
  - Sync when connection is restored

## Development Approach

### Phase 1: Core Setup & PWA Foundation
- Next.js project setup with TypeScript
- PWA configuration (manifest, service worker)
- Firebase integration
- Authentication system
- Responsive layouts for mobile/desktop

### Phase 2: Data Management & Tracking Features
- Database schema implementation
- Weight logging functionality
- Gym attendance tracking
- Photo upload capabilities
- Offline data handling

### Phase 3: Goal System Implementation
- Goal data models and API endpoints
- Goal creation and management interfaces
- Progress tracking mechanisms
- Goal-specific visualizations

### Phase 4: Social Features
- Friend/Group system
- Activity feed
- Notification system
- Comments and reactions
- Social goal sharing

### Phase 5: Statistics & Visualization
- Personal progress charts
- Group statistics
- Achievement system
- Data export

### Phase 6: PWA Enhancements
- Push notification implementation
- Install experience optimization
- Offline mode improvements
- Performance optimization

## Deployment Workflow
- Development environment on Vercel
- CI/CD pipeline with GitHub Actions
- Staging environment for testing
- Production deployment with analytics

## Performance Considerations
- Implement image optimization
- Use incremental static regeneration where appropriate
- Implement suspense and streaming for better UX
- Optimize bundle size with code splitting
- Use edge functions for global performance

## Security Considerations
- Implement proper Firebase security rules
- Use Firebase App Check to prevent API abuse
- Secure API routes with authentication middleware
- Implement rate limiting
- Follow OWASP security best practices

## Analytics & Monitoring
- Implement user engagement tracking
- Track key performance indicators
- Monitor error rates and performance
- A/B testing capability for new features

## Future Expansion Possibilities
- Integration with fitness trackers via Web Bluetooth
- Export/import workout data
- Advanced social features like video sharing
- Nutrition tracking
- AI-powered insights and goal recommendations