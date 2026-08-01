"""
Blood Compatibility Module for RedPulse AI Prediction Engine.
Defines standard medical blood transfusion compatibility rules and priority scoring.
"""

from typing import Dict, List, Tuple

# Recipient Blood Group -> Compatible Donor Blood Groups
BLOOD_COMPATIBILITY_RULES: Dict[str, List[str]] = {
    'O-': ['O-'],
    'O+': ['O+', 'O-'],
    'A-': ['A-', 'O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']  # Universal recipient
}


def get_compatible_donor_types(recipient_blood_group: str) -> List[str]:
    """
    Returns list of donor blood types that can safely donate to recipient_blood_group.
    """
    normalized = recipient_blood_group.strip().upper()
    return BLOOD_COMPATIBILITY_RULES.get(normalized, [normalized, 'O-'])


def check_compatibility(donor_blood: str, recipient_blood: str) -> Tuple[bool, str, float]:
    """
    Checks if donor_blood is compatible with recipient_blood.
    Returns: (is_compatible, reason, match_score)
    """
    donor_norm = donor_blood.strip().upper()
    recip_norm = recipient_blood.strip().upper()

    compatible_donors = get_compatible_donor_types(recip_norm)

    if donor_norm not in compatible_donors:
        return False, f"Incompatible: {donor_norm} cannot donate to {recip_norm}", 0.0

    if donor_norm == recip_norm:
        return True, "Exact blood group match", 100.0

    if donor_norm == 'O-':
        return True, "Universal donor (O-) compatibility", 90.0

    return True, f"Compatible blood subgroup ({donor_norm} for {recip_norm})", 75.0
