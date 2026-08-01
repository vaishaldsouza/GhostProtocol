"""
Distance Calculation Service for RedPulse AI Prediction Engine.
Uses Haversine formula and distance scoring decay algorithms with caching.
"""

import math
from typing import Dict, Tuple

class DistanceService:
    def __init__(self):
        # In-memory distance cache: (round(lat1,4), round(lon1,4), round(lat2,4), round(lon2,4)) -> distance_km
        self._cache: Dict[Tuple[float, float, float, float], float] = {}

    def calculate_haversine_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculates Great Circle distance between two points in kilometers.
        """
        cache_key = (round(lat1, 4), round(lon1, 4), round(lat2, 4), round(lon2, 4))
        if cache_key in self._cache:
            return self._cache[cache_key]

        # Radius of Earth in kilometers
        R = 6371.0

        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)

        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        distance = R * c

        self._cache[cache_key] = round(distance, 2)
        return round(distance, 2)

    def calculate_distance_score(self, distance_km: float) -> float:
        """
        Converts distance in kilometers to a 0-100 score.
        Closer donors receive higher scores.
        """
        if distance_km <= 1.0:
            return 100.0
        elif distance_km <= 3.0:
            return 95.0
        elif distance_km <= 5.0:
            return 88.0
        elif distance_km <= 10.0:
            return 75.0
        elif distance_km <= 20.0:
            return 50.0
        elif distance_km <= 50.0:
            return 25.0
        else:
            score = 100.0 * math.exp(-0.06 * distance_km)
            return max(0.0, round(score, 1))

    def estimate_eta_minutes(self, distance_km: float) -> int:
        """Estimates travel arrival time in minutes (assumes avg urban transit speed)."""
        # Base 5 mins prep + ~2.5 mins per km
        eta = int(5 + (distance_km * 2.5))
        return max(5, min(180, eta))


distance_service = DistanceService()
