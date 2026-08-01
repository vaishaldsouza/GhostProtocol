"""
Scoring Engine for RedPulse AI Donor Prediction.
Implements rule-based weighted scoring formula and modular ML-ready strategy interfaces.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
from app.models.donor import ScoreBreakdown, DonorBase
from app.services.compatibility import check_compatibility
from app.services.distance_service import distance_service


class BaseScoringStrategy(ABC):
    """
    Abstract Base Class for Donor Scoring.
    Allows rule-based engine to be seamlessly swapped with ML Models
    (Random Forest, XGBoost, or Logistic Regression) without modifying API routes.
    """

    @abstractmethod
    def calculate_score(
        self,
        donor: DonorBase,
        hospital_lat: float,
        hospital_lon: float,
        required_blood: str
    ) -> Tuple[ScoreBreakdown, bool]:
        """
        Calculates donor prediction score and eligibility.
        Returns: (ScoreBreakdown, is_eligible)
        """
        pass


class RuleBasedScoringStrategy(BaseScoringStrategy):
    """
    Weighted 5-Factor Scoring Strategy:
      - Distance Score (40%)
      - Donation Eligibility Score (20%)
      - Acceptance Rate Score (20%)
      - Availability Score (10%)
      - Blood Match Score (10%)
    """

    WEIGHT_DISTANCE = 0.40
    WEIGHT_ELIGIBILITY = 0.20
    WEIGHT_ACCEPTANCE = 0.20
    WEIGHT_AVAILABILITY = 0.10
    WEIGHT_BLOOD_MATCH = 0.10

    def calculate_score(
        self,
        donor: DonorBase,
        hospital_lat: float,
        hospital_lon: float,
        required_blood: str
    ) -> Tuple[ScoreBreakdown, bool]:

        # 1. Eligibility Hard Checks
        # Exclude donors who are marked unavailable, age <18 or >65, inactive, unverified
        if not donor.is_active or not donor.is_verified:
            return self._build_ineligible_breakdown(donor, hospital_lat, hospital_lon, required_blood, "Account inactive or unverified"), False

        if donor.age < 18 or donor.age > 65:
            return self._build_ineligible_breakdown(donor, hospital_lat, hospital_lon, required_blood, f"Age ({donor.age}) outside 18-65 range"), False

        # Minimum recovery period: 56 days
        if donor.last_donated_days_ago < 56:
            return self._build_ineligible_breakdown(donor, hospital_lat, hospital_lon, required_blood, f"In recovery period (donated {donor.last_donated_days_ago} days ago, min 56 days)"), False

        # 2. Blood Compatibility Check
        is_compatible, match_reason, blood_match_score = check_compatibility(donor.blood_group, required_blood)
        if not is_compatible:
            return self._build_ineligible_breakdown(donor, hospital_lat, hospital_lon, required_blood, match_reason), False

        # 3. Distance Calculation
        dist_km = distance_service.calculate_haversine_distance(
            donor.latitude, donor.longitude, hospital_lat, hospital_lon
        )
        dist_score = distance_service.calculate_distance_score(dist_km)

        # 4. Donation Eligibility Score (20%)
        # >90 days = 100, 56-89 days = 80-95 linear scale
        if donor.last_donated_days_ago >= 180:
            eligibility_score = 100.0
        elif donor.last_donated_days_ago >= 90:
            eligibility_score = 95.0
        else:
            # 56 to 89 days
            eligibility_score = 80.0 + ((donor.last_donated_days_ago - 56) / 34.0) * 15.0

        # 5. Previous Acceptance Rate Score (20%)
        # Acceptance Rate = Accepted Requests / Total Requests
        if donor.total_requests_received > 0:
            acceptance_rate = donor.accepted_requests / donor.total_requests_received
            acceptance_score = min(100.0, max(0.0, acceptance_rate * 100.0))
        else:
            acceptance_score = 80.0  # Default neutral score for new donors

        # 6. Availability Score (10%)
        status = (donor.availability_status or "available").lower()
        if status == "available" and donor.is_available:
            avail_score = 100.0
        elif status == "busy":
            avail_score = 40.0
        else:
            avail_score = 0.0

        # 7. Final Weighted Calculation
        final_score = (
            (self.WEIGHT_DISTANCE * dist_score) +
            (self.WEIGHT_ELIGIBILITY * eligibility_score) +
            (self.WEIGHT_ACCEPTANCE * acceptance_score) +
            (self.WEIGHT_AVAILABILITY * avail_score) +
            (self.WEIGHT_BLOOD_MATCH * blood_match_score)
        )
        final_score = round(min(100.0, max(0.0, final_score)), 1)

        # Estimate acceptance probability (0.0 to 1.0)
        acceptance_prob = round(final_score / 100.0, 2)

        breakdown = ScoreBreakdown(
            distance_km=dist_km,
            distance_score=round(dist_score, 1),
            eligibility_score=round(eligibility_score, 1),
            acceptance_rate_score=round(acceptance_score, 1),
            availability_score=round(avail_score, 1),
            blood_match_score=round(blood_match_score, 1),
            final_score=final_score,
            acceptance_probability=acceptance_prob,
            compatibility_reason=match_reason,
            rank=1
        )

        return breakdown, True

    def _build_ineligible_breakdown(self, donor, lat, lon, req_blood, reason) -> ScoreBreakdown:
        dist_km = distance_service.calculate_haversine_distance(donor.latitude, donor.longitude, lat, lon)
        return ScoreBreakdown(
            distance_km=dist_km,
            distance_score=0.0,
            eligibility_score=0.0,
            acceptance_rate_score=0.0,
            availability_score=0.0,
            blood_match_score=0.0,
            final_score=0.0,
            acceptance_probability=0.0,
            compatibility_reason=f"Ineligible: {reason}",
            rank=999
        )


class MLModelScoringStrategy(BaseScoringStrategy):
    """
    Future Machine Learning Model Strategy (Random Forest / XGBoost / Logistic Regression Wrapper).
    Uses rule-based scoring as fallback when model weights are not loaded.
    """

    def __init__(self, model_path: str = None):
        self.model_path = model_path
        self.fallback_strategy = RuleBasedScoringStrategy()

    def calculate_score(
        self,
        donor: DonorBase,
        hospital_lat: float,
        hospital_lon: float,
        required_blood: str
    ) -> Tuple[ScoreBreakdown, bool]:
        # If ML model file exists, execute inference pipeline; otherwise fallback smoothly
        return self.fallback_strategy.calculate_score(donor, hospital_lat, hospital_lon, required_blood)


# Default strategy instance
scoring_engine = RuleBasedScoringStrategy()
