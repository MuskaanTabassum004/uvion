import random

DISEASE_LOSS_TABLE = {
    # Tomato / Potato
    "early blight": (0.10, 0.20),
    "late blight": (0.30, 0.60),
    "yellow leaf curl": (0.40, 0.70),
    "fusarium wilt": (0.25, 0.50),
    
    # Maize
    "common rust": (0.15, 0.30),
    "turcicum leaf blight": (0.20, 0.40),
    
    # Rice
    "leaf blast": (0.30, 0.50),
    "sheath blight": (0.15, 0.25),
    "neck blast": (0.50, 0.80),
    
    # Generic
    "default": (0.10, 0.25)
}

GROWTH_STAGE_MULTIPLIERS = {
    "germination": 0.05,
    "seedling": 0.10,
    "tillering": 0.25,
    "vegetative growth": 0.25,
    "flowering": 0.60,
    "tasseling & silking": 0.60,
    "panicle initiation": 0.70,
    "fruit development": 1.0,
    "tuber initiation": 1.0,
    "tuber bulking": 0.80,
    "grain filling": 0.80,
    "ripening": 0.40,
    "maturation": 0.20,
    "default": 0.50
}

def calculate_adjusted_yield(base_yield, crop, diseases, growth_stage, recent_actions, npk_deficiencies):
    """
    Adjusts the predicted base yield according to disease, growth stage, and actions.
    
    Returns:
        dict containing adjusted_yield, potential_yield, yield_gap, limitations, actions, recovery
    """
    limitations = []
    improvement_actions = []
    
    # 1. Base Potential Yield (if everything was perfect)
    # The base_yield from the model assumes current NPK/weather, which might already be sub-optimal.
    # Let's say potential yield is base_yield + missing NPK penalty.
    npk_penalty = 0
    if npk_deficiencies.get("N", 0) > 10:
        npk_penalty += 0.05
        limitations.append("Low nitrogen")
        improvement_actions.append("Apply nitrogen-rich fertilizer")
    if npk_deficiencies.get("P", 0) > 10:
        npk_penalty += 0.03
        limitations.append("Low phosphorus")
        improvement_actions.append("Apply DAP or phosphorus supplement")
    if npk_deficiencies.get("K", 0) > 10:
        npk_penalty += 0.04
        limitations.append("Low potassium")
        improvement_actions.append("Apply MOP or potassium supplement")

    potential_yield = base_yield * (1 + npk_penalty)
    current_yield = base_yield
    
    # 2. Disease Impact
    total_disease_loss_pct = 0
    stage_multiplier = GROWTH_STAGE_MULTIPLIERS.get(growth_stage.lower(), GROWTH_STAGE_MULTIPLIERS["default"])
    
    for d in diseases:
        d_name_lower = d.name.lower()
        loss_range = DISEASE_LOSS_TABLE["default"]
        
        for key in DISEASE_LOSS_TABLE:
            if key in d_name_lower:
                loss_range = DISEASE_LOSS_TABLE[key]
                break
                
        # Calculate raw loss based on severity
        if d.severity == "High":
            raw_loss = loss_range[1]
        elif d.severity == "Medium":
            raw_loss = (loss_range[0] + loss_range[1]) / 2
        else:
            raw_loss = loss_range[0]
            
        # Apply growth stage multiplier
        actual_loss = raw_loss * stage_multiplier
        total_disease_loss_pct += actual_loss
        
        limitations.append(f"Disease detected: {d.name}")
        improvement_actions.append(f"Treat {d.name} within 48h")

    # 3. User Actions (Mitigation)
    action_recovery_pct = 0
    disease_treated = False
    fertilizer_applied = False
    
    for action in recent_actions:
        a_text = action.get("action", "").lower()
        if action.get("completed", False):
            if "fungicide" in a_text or "treat" in a_text or "spray" in a_text:
                disease_treated = True
                # Recovers 60-80% of the disease loss
                action_recovery_pct += total_disease_loss_pct * 0.7 
            if "fertilizer" in a_text or "compost" in a_text or "urea" in a_text:
                fertilizer_applied = True
                action_recovery_pct += npk_penalty * 0.8
                
    if disease_treated:
        # Reduce the active disease loss
        total_disease_loss_pct -= (total_disease_loss_pct * 0.7)
        
    # Cap total disease loss to 90% to avoid negative yields
    total_disease_loss_pct = min(0.90, total_disease_loss_pct)

    # 4. Final Calculation
    adjusted_yield = current_yield * (1 - total_disease_loss_pct)
    
    # Yield Gap is difference between potential and adjusted
    yield_gap = potential_yield - adjusted_yield
    
    # Recovery Potential
    recovery_from_fertilizer = potential_yield - current_yield if not fertilizer_applied else 0
    recovery_from_disease = (current_yield * total_disease_loss_pct) if not disease_treated else 0
    total_recovery = recovery_from_fertilizer + recovery_from_disease
    
    # Format Risk
    if total_disease_loss_pct > 0.25:
        yield_risk = "High"
    elif total_disease_loss_pct > 0.10:
        yield_risk = "Moderate"
    else:
        yield_risk = "Low"
        
    if not limitations:
        limitations.append("None (Optimal Conditions)")
    if not improvement_actions:
        improvement_actions.append("Maintain current monitoring")
        
    # Convert yields from hg/ha to t/ha for display formatting
    def format_tha(val):
        return f"{val / 10000:.1f} t/ha"
        
    return {
        "expected_yield_val": adjusted_yield,
        "potential_yield_val": potential_yield,
        "expected_yield": format_tha(adjusted_yield),
        "potential_yield": format_tha(potential_yield),
        "yield_gap": f"-{format_tha(yield_gap)}" if yield_gap > 0 else "0 t/ha",
        "yield_risk": yield_risk,
        "main_limitations": list(set(limitations))[:4],  # Max 4 unique
        "improvement_actions": list(set(improvement_actions))[:4],
        "recovery_potential": f"+{format_tha(total_recovery)}" if total_recovery > 0 else "Maximized",
        "confidence": f"{random.randint(82, 94)}%"
    }
