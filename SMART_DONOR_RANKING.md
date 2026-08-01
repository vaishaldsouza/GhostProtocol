# Smart Donor Ranking System

A sophisticated AI-powered donor matching algorithm that identifies the best-fit donor for every blood emergency request using multi-factor analysis and dynamic weighting.

## Overview

The Smart Donor Ranking system goes beyond simple blood type matching by considering multiple critical factors to ensure optimal donor selection for each emergency situation.

## Key Features

### 1. **Multi-Factor Scoring Algorithm**

The system evaluates donors across seven key dimensions:

- **Distance Score (0-100)**: Exponential decay based on proximity to hospital
- **Response Time Score (0-100)**: Based on historical response times
- **Blood Match Score (0-100)**: Blood compatibility with priority weighting
- **Reliability Score (0-100)**: Historical donation success rate and emergency experience
- **Eligibility Score (0-100)**: Medical eligibility based on last donation date
- **Availability Score (0-100)**: Current availability and preferred donation times
- **Final Score (0-100)**: Weighted combination based on urgency level

### 2. **Blood Compatibility Engine**

Implements comprehensive blood type compatibility rules:

```typescript
// Universal donor: O- can donate to all types
// Universal recipient: AB+ can receive from all types
// Exact matches get highest priority (100%)
// Compatible matches get priority based on rarity
```

**Compatibility Matrix:**
- **O-**: Universal donor (100 priority) - can donate to all
- **O+**: Can donate to O+, A+, B+, AB+
- **A-**: Can donate to A+, A-, AB+, AB-
- **A+**: Can donate to A+, AB+
- **B-**: Can donate to B+, B-, AB+, AB-
- **B+**: Can donate to B+, AB+
- **AB-**: Can donate to AB+, AB-
- **AB+**: Universal recipient (60 priority) - can receive from all

### 3. **Dynamic Urgency-Based Weighting**

The algorithm adjusts factor weights based on emergency urgency:

#### Critical Emergencies
- Distance: 45% (proximity is paramount)
- Response Time: 30% (speed critical)
- Blood Match: 15% (still important)
- Reliability: 10% (less critical in life-or-death)

#### Urgent Situations
- Distance: 35%
- Response Time: 25%
- Blood Match: 25%
- Reliability: 15%

#### Standard Requests
- Distance: 25%
- Response Time: 20%
- Blood Match: 35% (more important for planned procedures)
- Reliability: 20% (consistency matters for planned care)

### 4. **Reliability Scoring System**

Evaluates donor reliability using historical data:

**Components:**
- **Success Rate (40%)**: Ratio of successful to total donation attempts
- **Response Time (30%)**: Average response time with exponential decay
- **Emergency Experience (30%)**: Bonus points for emergency response history

**Formula:**
```
Reliability Score = (Success Rate × 0.4) + (Response Score × 0.3) + (Emergency Bonus × 0.3)
```

### 5. **Eligibility Calculation**

Ensures medical compliance with donation guidelines:

- **Minimum 56 days** between donations (WHO guidelines)
- **Optimal window**: 56-90 days (100% score)
- **Extended window**: Beyond 90 days (gradual score decrease)
- **Ineligible**: Less than 56 days (0% score)

### 6. **Backup Donor Strategy**

Categorizes donors into three tiers:

#### Primary Donors (Score ≥ 80%)
- Best match for the emergency
- Contact first
- Highest priority for dispatch

#### Backup Donors (Score 60-79%)
- Suitable alternatives
- Contact if primary donors unavailable
- Maintain as reserve options

#### Emergency Donors (Score < 60%)
- Last resort options
- Contact only in critical shortages
- May require additional verification

### 7. **Intelligent Distance Calculation**

**Features:**
- Exponential decay scoring (closer = exponentially better)
- Respects donor travel preferences
- Considers hospital location vs donor location
- Configurable maximum search radius
- Automatic radius expansion if insufficient donors

**Algorithm:**
```typescript
Distance Score = 100 × e^(-distance / 15)
```

## UI Features

### Ranking Summary Dashboard

Provides real-time insights into donor pool quality:

- **Total Matched Donors**: Number of compatible donors found
- **Average Score**: Overall quality of donor pool
- **Primary/Backup/Emergency Counts**: Distribution across tiers
- **Smart Recommendations**: AI-generated suggestions
- **Top Donor Highlight**: Best match with contact priority

### Detailed Donor Cards

Each donor card displays:

- **Ranking Badge**: Primary/Backup/Emergency status
- **Overall Score**: Weighted final score
- **Factor Breakdown**: Individual scores for each factor (expandable)
- **Compatibility Reason**: Why this donor is a match
- **ETA Calculation**: Estimated arrival time
- **Contact Priority**: Suggested contact order
- **Quick Actions**: Call donor, dispatch SOS

### Interactive Features

- **Show/Hide Details**: Toggle detailed factor breakdown
- **Real-time Updates**: Scores update as parameters change
- **Visual Indicators**: Color-coded status badges
- **Responsive Design**: Works on all screen sizes

## Integration Points

### Emergency Request Flow

1. **Natural Language Input**: User describes emergency
2. **AI Extraction**: System extracts key parameters
3. **Smart Ranking**: Donors ranked using multi-factor algorithm
4. **Optimal Selection**: Primary/backup donors identified
5. **Summary Generation**: Recommendations and insights provided
6. **Contact Dispatch**: System suggests optimal contact order

### Database Integration

- **Donor Profiles**: Extended with availability and history data
- **Emergency Requests**: Store AI analysis and matched donors
- **Response Tracking**: Log actual response times and outcomes
- **Reliability Updates**: Update scores based on actual performance

## Algorithm Examples

### Example 1: Critical Emergency

**Request:** 2 units of O- blood, critical urgency, 45 minutes away

**Top Donor:**
- Distance: 1.8km (98% score)
- Response Time: 15min (95% score)
- Blood Match: O- to O- (100% score)
- Reliability: 90% (15 successful donations)
- **Final Score: 95%** (Primary status)

### Example 2: Urgent Situation

**Request:** 1 unit of A+ blood, urgent urgency, 2 hours away

**Top Donor:**
- Distance: 5.2km (75% score)
- Response Time: 20min (90% score)
- Blood Match: A+ to A+ (100% score)
- Reliability: 85% (12 successful donations)
- **Final Score: 87%** (Primary status)

### Example 3: Standard Request

**Request:** 3 units of B+ blood, standard urgency, planned surgery

**Top Donor:**
- Distance: 8.5km (60% score)
- Response Time: 30min (80% score)
- Blood Match: B+ to B+ (100% score)
- Reliability: 95% (20 successful donations)
- **Final Score: 83%** (Primary status)

## Performance Optimization

### Database Queries
- Indexed queries on blood type, location, and availability
- Efficient filtering with WHERE clauses
- Limited result sets for performance

### Algorithm Efficiency
- O(n) complexity for donor ranking
- Early filtering of incompatible donors
- Cached calculations for repeated queries

### UI Performance
- Lazy loading of detailed breakdowns
- Debounced search radius expansion
- Optimized re-renders with React memo

## Future Enhancements

### Planned Features
- **Real-time GPS Tracking**: Actual donor location tracking
- **Traffic Integration**: Real-time traffic conditions for ETA
- **Machine Learning**: Improve scoring with historical data
- **Predictive Analytics**: Anticipate donor availability
- **Multi-hospital Coordination**: Share donors across facilities
- **SMS Integration**: Automated donor contact and response tracking

### Advanced Algorithms
- **Time-of-day Optimization**: Consider peak traffic hours
- **Weather Conditions**: Factor in weather impact on travel
- **Donor Preferences**: Respect donation time preferences
- **Historical Patterns**: Learn from previous emergency responses
- **Network Effects**: Consider donor-donor relationships

## Technical Implementation

### File Structure
```
src/utils/
├── donorRanking.ts      # Core ranking algorithm
├── emergency.ts         # Emergency operations integration
└── auth.ts             # Authentication with donor availability

src/components/
└── EmergencyAssistantModal.tsx  # UI with ranking visualization
```

### Key Functions

**donorRanking.ts:**
- `rankDonors()` - Main ranking algorithm
- `calculateBloodMatchScore()` - Blood compatibility
- `calculateDistanceScore()` - Proximity scoring
- `calculateReliabilityScore()` - Historical performance
- `selectOptimalDonors()` - Backup strategy
- `generateRankingSummary()` - Insights generation

**emergency.ts:**
- `findMatchingDonors()` - Database integration
- Extended to use smart ranking
- Returns both simple and ranked results

## Configuration

### Adjustable Parameters

```typescript
// Weight configurations
URGENCY_WEIGHTS = {
  critical: { distance: 0.45, responseTime: 0.30, ... },
  urgent: { distance: 0.35, responseTime: 0.25, ... },
  standard: { distance: 0.25, responseTime: 0.20, ... }
}

// Scoring parameters
MAX_DISTANCE_KM = 50;           // Maximum search radius
OPTIMAL_DONATION_DAYS = 90;    // Optimal time between donations
MIN_DONATION_DAYS = 56;        // Minimum time between donations
EMERGENCY_BONUS_PER_RESPONSE = 5; // Emergency experience bonus
```

## Monitoring & Analytics

### Key Metrics
- **Average Match Score**: Overall donor pool quality
- **Primary Donor Success Rate**: Primary donor response success
- **Backup Utilization**: How often backup donors are needed
- **Response Time Accuracy**: Predicted vs actual response times
- **Radius Expansion Rate**: How often search radius needs expansion

### Quality Assurance
- **Score Validation**: Regular review of scoring accuracy
- **Donor Feedback**: Collect donor response quality data
- **Outcome Tracking**: Link donor selection to patient outcomes
- **Algorithm Tuning**: Adjust weights based on performance data

## Conclusion

The Smart Donor Ranking system transforms emergency blood donation from simple matching to intelligent, multi-factor optimization. By considering medical compatibility, logistical constraints, historical performance, and emergency urgency, the system ensures that every request gets the best possible donor match, potentially saving lives through faster, more reliable blood delivery.
