"""
UVION Crop Data Module
Contains disease mappings and fertilizer recommendations for all crops
"""

from dataclasses import dataclass
from typing import Dict, List

@dataclass
class Disease:
    name: str
    severity: str  # Low, Medium, High
    symptoms: str
    control_measures: List[str]
    risk_trigger: str  # Scientific weather condition that triggers this disease
    impact_level: str  # Qualitative/Quantitative impact on yield
    expected_window: str # The temporal window when this risk is most active

@dataclass
class StageDisease:
    stage_name: str
    diseases: List[Disease]

@dataclass
class FertilizerNeed:
    stage_name: str
    nitrogen: int  # kg/hectare
    phosphorus: int  # kg/hectare
    potassium: int  # kg/hectare
    organic_matter: int  # tons/hectare
    micronutrients: List[str]
    application_timing: str

# ============================================================================
# RICE - DISEASE MAPPING BY GROWTH STAGE
# ============================================================================

RICE_DISEASES = [
    StageDisease(
        stage_name="Germination",
        diseases=[
            Disease(
                name="Seed Rot (Achlya spp.)",
                severity="High",
                symptoms="Seeds fail to germinate, blackening of seeds with fuzzy fungal growth",
                control_measures=["Use disease-free seeds", "Seed treatment with Trichoderma viride", "Ensure field is not submerged during sowing"],
                risk_trigger="Waterlogged soil, Temp < 20°C",
                impact_level="⚠️ Critical: Total stand failure (80-100% loss)",
                expected_window="Initial 5-7 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Seedling",
        diseases=[
            Disease(
                name="Leaf Blast (Magnaporthe oryzae)",
                severity="High",
                symptoms="Diamond-shaped spots with gray centers and reddish borders",
                control_measures=["Avoid excessive Nitrogen", "Spray Tricyclazole 75WP @ 0.6g/L", "Maintain thin water layer"],
                risk_trigger="Humidity > 90%, Night Temp < 20°C, Overcast skies",
                impact_level="⚠️ High: Severe foliage destruction (30-50% loss)",
                expected_window="Next 10 days"
            ),
            Disease(
                name="Bacterial Leaf Blight (Xoo)",
                severity="High",
                symptoms="Yellow-white streaks with wavy margins on leaf blades",
                control_measures=["Balanced NPK (don't over-N)", "Copper Oxychloride spray", "Avoid field work when plants are wet"],
                risk_trigger="Heavy winds + Rain (Storms), Temp 25-30°C",
                impact_level="⚠️ High: Photosynthesis inhibition (20-40% loss)",
                expected_window="Monsoon windows"
            ),
        ]
    ),
    StageDisease(
        stage_name="Tillering",
        diseases=[
            Disease(
                name="Sheath Blight (Rhizoctonia solani)",
                severity="High",
                symptoms="Snake-skin like lesions on leaf sheaths near water line",
                control_measures=["Reduce plant density", "Spray Hexaconazole 5% EC @ 2ml/L", "Improve drainage"],
                risk_trigger="Humidity > 95%, High plant density, Temp > 28°C",
                impact_level="⚠️ Moderate: Upward spread to panicle (15-25% loss)",
                expected_window="Next 14 days"
            ),
            Disease(
                name="Brown Spot (Helminthosporium)",
                severity="Medium",
                symptoms="Small, circular brown spots with yellow halos (looks like pepper)",
                control_measures=["Increase Potassium levels", "Apply Mancozeb 75WP @ 2g/L", "Improve soil drainage"],
                risk_trigger="Potassium deficiency + High Humidity (>85%)",
                impact_level="⚠️ Low-Medium: Reduced grain quality (10-15% loss)",
                expected_window="Next 7 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Panicle Initiation",
        diseases=[
            Disease(
                name="Neck Blast",
                severity="High",
                symptoms="Blast infection at the neck node; neck turns brown/black and snaps",
                control_measures=["Spray Tricyclazole before heading", "Preventive spraying at boot leaf stage", "Avoid night irrigation"],
                risk_trigger="Humidity > 90%, Intermittent rain, Low night temp",
                impact_level="⚠️ Critical: Total grain loss in infected panicles",
                expected_window="Heading period (3-5 days)"
            ),
            Disease(
                name="Stem Rot",
                severity="Medium",
                symptoms="Black lesions on outer sheaths; rotting at the water line",
                control_measures=["Apply Potash", "Avoid stagnant water", "Burn infected stubble post-harvest"],
                risk_trigger="Long periods of standing water, Temp 25-30°C",
                impact_level="⚠️ Moderate: Lodging and small grains (10-20% loss)",
                expected_window="Next 10 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Flowering",
        diseases=[
            Disease(
                name="False Smut (Ustilaginoidea virens)",
                severity="Medium",
                symptoms="Grains transform into yellow/greenish velvety balls (smut balls)",
                control_measures=["Remove smut balls carefully", "Spray Copper Hydroxide at booting stage", "Use certified seeds"],
                risk_trigger="High Humidity (>90%), Rain during flowering",
                impact_level="⚠️ Moderate: Market value reduction + Toxin risk",
                expected_window="Flowering period"
            ),
            Disease(
                name="Bacterial Leaf Streak",
                severity="Low",
                symptoms="Narrow, translucent, water-soaked streaks on leaves",
                control_measures=["Avoid flooding field", "Spray Agrimycin", "Improve soil aeration"],
                risk_trigger="Warm weather (Temp > 30°C), High humidity",
                impact_level="⚠️ Low: Minimal yield impact",
                expected_window="Mid-season"
            ),
        ]
    ),
    StageDisease(
        stage_name="Grain Filling",
        diseases=[
            Disease(
                name="Grain Discoloration",
                severity="Medium",
                symptoms="Glumes turn brown, black, or red; poor grain filling",
                control_measures=["Foliar spray of Propiconazole", "Improve field sanitation", "Harvest at 20% moisture"],
                risk_trigger="Frequent rain during late season, Temp 25-28°C",
                impact_level="⚠️ Moderate: Loss in milling quality and weight",
                expected_window="Next 10 days"
            ),
            Disease(
                name="Rice Tungro Disease",
                severity="High",
                symptoms="Stunting, yellowing of leaves, fewer tillers",
                control_measures=["Control Green Leafhoppers", "Roguing of infected plants", "Use resistant varieties"],
                risk_trigger="Presence of Green Leafhoppers + High Temp",
                impact_level="⚠️ High: Severe stunting and yield loss",
                expected_window="Next 14 days"
            ),
        ]
    ),
]

# ============================================================================
# RICE - FERTILIZER RECOMMENDATIONS BY GROWTH STAGE
# ============================================================================

RICE_FERTILIZERS = [
    FertilizerNeed(
        stage_name="Germination",
        nitrogen=20,
        phosphorus=40,
        potassium=20,
        organic_matter=5,
        micronutrients=["Zinc", "Iron"],
        application_timing="Before planting, incorporate into soil"
    ),
    FertilizerNeed(
        stage_name="Seedling",
        nitrogen=30,
        phosphorus=0,
        potassium=0,
        organic_matter=0,
        micronutrients=["Zinc"],
        application_timing="2 weeks after transplanting"
    ),
    FertilizerNeed(
        stage_name="Tillering",
        nitrogen=120,
        phosphorus=0,
        potassium=40,
        organic_matter=0,
        micronutrients=["Boron"],
        application_timing="Split into 2-3 doses"
    ),
    FertilizerNeed(
        stage_name="Panicle Initiation",
        nitrogen=40,
        phosphorus=0,
        potassium=20,
        organic_matter=0,
        micronutrients=["Potassium"],
        application_timing="As panicle formation begins"
    ),
    FertilizerNeed(
        stage_name="Flowering",
        nitrogen=0,
        phosphorus=0,
        potassium=20,
        organic_matter=0,
        micronutrients=["Manganese", "Zinc"],
        application_timing="Foliar spray"
    ),
    FertilizerNeed(
        stage_name="Grain Filling",
        nitrogen=0,
        phosphorus=0,
        potassium=30,
        organic_matter=0,
        micronutrients=["Magnesium"],
        application_timing="Foliar spray every 10 days"
    ),
]

# ============================================================================
# TOMATO - DISEASE MAPPING BY GROWTH STAGE
# ============================================================================

TOMATO_DISEASES = [
    StageDisease(
        stage_name="Germination",
        diseases=[
            Disease(
                name="Damping Off (Pythium spp.)",
                severity="High",
                symptoms="Seedling collapse at soil level, soft water-soaked stem rot",
                control_measures=["Use treated seeds", "Improve soil drainage", "Apply Trichoderma to nursery beds"],
                risk_trigger="High soil moisture, Temp 15-20°C",
                impact_level="⚠️ Critical: Total nursery loss possible",
                expected_window="First 14 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Seedling",
        diseases=[
            Disease(
                name="Early Blight (Alternaria solani)",
                severity="Medium",
                symptoms="Target-like concentric rings on older leaves, yellowing",
                control_measures=["Remove lower leaves", "Spray Mancozeb 75WP", "Increase spacing"],
                risk_trigger="High Humidity (>80%), Intermittent rain, Temp 24-29°C",
                impact_level="⚠️ Moderate: Defoliation and reduced vigor",
                expected_window="Next 7 days"
            ),
            Disease(
                name="Fusarium Wilt",
                severity="High",
                symptoms="One-sided yellowing of leaves, wilting during day",
                control_measures=["Use resistant hybrids", "Crop rotation with non-solanaceous crops", "Adjust soil pH to 6.5"],
                risk_trigger="Warm soil (Temp 27-32°C), Low soil moisture",
                impact_level="⚠️ High: Permanent wilting and death",
                expected_window="Next 14 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Vegetative Growth",
        diseases=[
            Disease(
                name="Late Blight (Phytophthora infestans)",
                severity="High",
                symptoms="Dark water-soaked lesions, white fuzzy mold on undersides",
                control_measures=["Preventive spray with Metalaxyl", "Remove infected foliage immediately", "Avoid overhead irrigation"],
                risk_trigger="Cool, wet weather (Humidity > 90%, Temp 15-20°C)",
                impact_level="⚠️ Critical: Rapid crop destruction (within days)",
                expected_window="Next 5 days"
            ),
            Disease(
                name="Septoria Leaf Spot",
                severity="Medium",
                symptoms="Small circular spots with gray centers and dark borders",
                control_measures=["Mulching to prevent soil splash", "Spray Chlorothalonil", "Remove crop debris"],
                risk_trigger="High Humidity (>85%), Wet leaf surfaces",
                impact_level="⚠️ Moderate: Severe defoliation",
                expected_window="Next 10 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Flowering",
        diseases=[
            Disease(
                name="Bacterial Canker",
                severity="High",
                symptoms="Leaf margins turn brown (marginal necrosis), 'bird's eye' spots on fruit",
                control_measures=["Use pathogen-free seeds", "Copper sprays", "Sanitize tools"],
                risk_trigger="Splashing rain, High Humidity, Temp 24-32°C",
                impact_level="⚠️ High: Systemic infection leading to death",
                expected_window="Next 14 days"
            ),
            Disease(
                name="Tomato Yellow Leaf Curl (TYLCV)",
                severity="High",
                symptoms="Stunting, upward leaf curling, yellowing of margins",
                control_measures=["Control Whiteflies using yellow sticky traps", "Reflective mulches", "Remove infected plants"],
                risk_trigger="High Whitefly population, Dry weather",
                impact_level="⚠️ Critical: Drastic yield reduction",
                expected_window="Next 10 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Fruit Development",
        diseases=[
            Disease(
                name="Blossom End Rot",
                severity="Medium",
                symptoms="Dark sunken leathery spots on the blossom end of fruits",
                control_measures=["Consistent watering schedule", "Apply Calcium nitrate", "Mulching"],
                risk_trigger="Fluctuating soil moisture, Calcium deficiency",
                impact_level="⚠️ Moderate: Non-marketable fruits",
                expected_window="Fruit set period"
            ),
            Disease(
                name="Buckeye Rot",
                severity="Medium",
                symptoms="Large brown spots with concentric rings on fruits near soil",
                control_measures=["Staking plants", "Mulching", "Improve soil drainage"],
                risk_trigger="Wet soil, Fruit contact with soil",
                impact_level="⚠️ Moderate: Fruit rotting",
                expected_window="Next 7 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Ripening",
        diseases=[
            Disease(
                name="Anthracnose (Colletotrichum spp.)",
                severity="Medium",
                symptoms="Small circular sunken lesions on ripe fruits",
                control_measures=["Harvest promptly", "Fungicide spray (Azoxystrobin)", "Crop rotation"],
                risk_trigger="Warm, wet weather during ripening",
                impact_level="⚠️ High: Post-harvest spoilage",
                expected_window="Harvest window"
            ),
            Disease(
                name="Gray Mold (Botrytis cinerea)",
                severity="Low",
                symptoms="Gray velvety mold on fruits and stems",
                control_measures=["Improve ventilation", "Lower humidity", "Remove dead tissues"],
                risk_trigger="High Humidity (>90%), Cool temp",
                impact_level="⚠️ Low: Occasional fruit loss",
                expected_window="Next 5 days"
            ),
        ]
    ),
]

# ============================================================================
# TOMATO - FERTILIZER RECOMMENDATIONS BY GROWTH STAGE
# ============================================================================

TOMATO_FERTILIZERS = [
    FertilizerNeed(
        stage_name="Germination",
        nitrogen=30,
        phosphorus=60,
        potassium=40,
        organic_matter=10,
        micronutrients=["Boron", "Molybdenum"],
        application_timing="Incorporate before planting"
    ),
    FertilizerNeed(
        stage_name="Seedling",
        nitrogen=40,
        phosphorus=0,
        potassium=30,
        organic_matter=0,
        micronutrients=["Iron", "Zinc"],
        application_timing="Weekly liquid fertilizer"
    ),
    FertilizerNeed(
        stage_name="Vegetative Growth",
        nitrogen=100,
        phosphorus=0,
        potassium=50,
        organic_matter=0,
        micronutrients=["Magnesium"],
        application_timing="Split into 2-3 doses"
    ),
    FertilizerNeed(
        stage_name="Flowering",
        nitrogen=40,
        phosphorus=40,
        potassium=60,
        organic_matter=0,
        micronutrients=["Boron", "Calcium"],
        application_timing="At flower bud emergence"
    ),
    FertilizerNeed(
        stage_name="Fruit Development",
        nitrogen=20,
        phosphorus=20,
        potassium=80,
        organic_matter=0,
        micronutrients=["Potassium"],
        application_timing="Every 2 weeks"
    ),
    FertilizerNeed(
        stage_name="Ripening",
        nitrogen=0,
        phosphorus=20,
        potassium=60,
        organic_matter=0,
        micronutrients=["Potassium", "Magnesium"],
        application_timing="Foliar spray"
    ),
]

# ============================================================================
# POTATO - DISEASE MAPPING BY GROWTH STAGE
# ============================================================================

POTATO_DISEASES = [
    StageDisease(
        stage_name="Sprouting",
        diseases=[
            Disease(
                name="Seed Piece Decay (Erwinia spp.)",
                severity="High",
                symptoms="Soft, slimy, foul-smelling rot of seed pieces",
                control_measures=["Use certified seeds", "Allow cut seeds to suberize", "Plant in well-drained soil"],
                risk_trigger="Wet soil, Temp > 20°C",
                impact_level="⚠️ High: Poor emergence and weak plants",
                expected_window="Sprouting period"
            ),
        ]
    ),
    StageDisease(
        stage_name="Vegetative Growth",
        diseases=[
            Disease(
                name="Early Blight (Alternaria solani)",
                severity="High",
                symptoms="Dark brown spots with concentric rings (target spots) on leaves",
                control_measures=["Maintain plant vigor", "Spray Mancozeb", "Avoid overhead irrigation"],
                risk_trigger="Alternating wet and dry periods, Temp 24-29°C",
                impact_level="⚠️ Moderate: Premature leaf death",
                expected_window="Next 10 days"
            ),
            Disease(
                name="Potato Virus Y (PVY)",
                severity="Medium",
                symptoms="Mottling, mosaic patterns on leaves, stunting",
                control_measures=["Control Aphids", "Roguing of infected plants", "Use virus-free seeds"],
                risk_trigger="High Aphid activity, Cool weather",
                impact_level="⚠️ Moderate: Tuber size reduction",
                expected_window="Next 14 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Tuber Initiation",
        diseases=[
            Disease(
                name="Late Blight (Phytophthora infestans)",
                severity="High",
                symptoms="Dark, water-soaked leaf lesions, white mold on undersides",
                control_measures=["Spray Chlorothalonil or Metalaxyl", "Remove infected foliage", "Destroy cull piles"],
                risk_trigger="High Humidity (>90%), Rain/Fog, Temp 10-20°C",
                impact_level="⚠️ Critical: Total crop loss (foliage and tubers)",
                expected_window="Next 5 days"
            ),
            Disease(
                name="Verticillium Wilt",
                severity="Medium",
                symptoms="Yellowing and wilting of lower leaves, 'one-sided' wilting",
                control_measures=["Crop rotation (3-4 years)", "Use resistant varieties", "Balanced nutrition"],
                risk_trigger="Warm weather, Drought stress",
                impact_level="⚠️ Moderate: Early senescence",
                expected_window="Next 15 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Tuber Bulking",
        diseases=[
            Disease(
                name="Common Scab (Streptomyces scabies)",
                severity="Low",
                symptoms="Cork-like, raised or pitted lesions on tuber skin",
                control_measures=["Maintain soil moisture during bulking", "Lower soil pH to 5.2", "Crop rotation"],
                risk_trigger="Dry soil during tuber set, High soil pH (>5.5)",
                impact_level="⚠️ Low: Aesthetic damage (unmarketable)",
                expected_window="Bulking period"
            ),
            Disease(
                name="Soft Rot",
                severity="High",
                symptoms="Cream-colored, soft, mushy tuber decay",
                control_measures=["Avoid waterlogging", "Control bruising during cultivation", "Proper ventilation"],
                risk_trigger="Excessive soil moisture, Temp > 25°C",
                impact_level="⚠️ High: Tuber decay in soil and storage",
                expected_window="Next 7 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Maturation",
        diseases=[
            Disease(
                name="Black Scurf (Rhizoctonia solani)",
                severity="Low",
                symptoms="Hard, black 'dirt-like' sclerotia on tuber surface",
                control_measures=["Harvest promptly after skin set", "Use clean seed", "Fungicide furrow treatment"],
                risk_trigger="Cool, wet soil at harvest",
                impact_level="⚠️ Low: Surface blemishes",
                expected_window="Next 10 days"
            ),
            Disease(
                name="Silver Scurf",
                severity="Low",
                symptoms="Silvery, metallic patches on tuber skin",
                control_measures=["Proper ventilation in storage", "Prompt harvest", "Fungicide spray"],
                risk_trigger="High Humidity at harvest/storage",
                impact_level="⚠️ Low: Skin appearance loss",
                expected_window="Harvest window"
            ),
        ]
    ),
]

# ============================================================================
# POTATO - FERTILIZER RECOMMENDATIONS BY GROWTH STAGE
# ============================================================================

POTATO_FERTILIZERS = [
    FertilizerNeed(
        stage_name="Sprouting",
        nitrogen=30,
        phosphorus=60,
        potassium=80,
        organic_matter=15,
        micronutrients=["Boron", "Manganese"],
        application_timing="Incorporate before planting"
    ),
    FertilizerNeed(
        stage_name="Vegetative Growth",
        nitrogen=80,
        phosphorus=0,
        potassium=50,
        organic_matter=0,
        micronutrients=["Iron", "Zinc"],
        application_timing="At emergence and 30 days after"
    ),
    FertilizerNeed(
        stage_name="Tuber Initiation",
        nitrogen=60,
        phosphorus=0,
        potassium=100,
        organic_matter=0,
        micronutrients=["Potassium"],
        application_timing="At tuber initiation"
    ),
    FertilizerNeed(
        stage_name="Tuber Bulking",
        nitrogen=0,
        phosphorus=0,
        potassium=120,
        organic_matter=0,
        micronutrients=["Potassium", "Magnesium"],
        application_timing="Every 2 weeks"
    ),
    FertilizerNeed(
        stage_name="Maturation",
        nitrogen=0,
        phosphorus=20,
        potassium=40,
        organic_matter=0,
        micronutrients=["Potassium"],
        application_timing="Last application 3 weeks before harvest"
    ),
]

# ============================================================================
# MAIZE - DISEASE MAPPING BY GROWTH STAGE
# ============================================================================

MAIZE_DISEASES = [
    StageDisease(
        stage_name="Germination",
        diseases=[
            Disease(
                name="Seed Rot & Seedling Blight (Fusarium spp.)",
                severity="High",
                symptoms="Seeds rot before emergence; seedlings are yellow and stunted",
                control_measures=["Use high-quality treated seeds", "Avoid planting in cold, wet soil", "Proper seed depth"],
                risk_trigger="Cold, wet soil (Temp < 13°C), Poor drainage",
                impact_level="⚠️ High: Reduced plant population",
                expected_window="First 10 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Seedling",
        diseases=[
            Disease(
                name="Damping Off (Pythium spp.)",
                severity="High",
                symptoms="Water-soaked lesions on roots, seedling death",
                control_measures=["Seed treatment with Metalaxyl", "Improve soil drainage", "Avoid deep planting"],
                risk_trigger="High soil moisture, Poor aeration",
                impact_level="⚠️ Moderate-High: Patchy emergence",
                expected_window="First 14 days"
            ),
            Disease(
                name="Maize Mosaic Virus",
                severity="Medium",
                symptoms="Light and dark green stripes on leaves, stunting",
                control_measures=["Control Planthoppers", "Remove infected plants", "Use resistant varieties"],
                risk_trigger="High Planthopper population",
                impact_level="⚠️ Moderate: Stunted growth",
                expected_window="Next 15 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Vegetative Growth",
        diseases=[
            Disease(
                name="Common Rust (Puccinia sorghi)",
                severity="Medium",
                symptoms="Cinnamon-brown pustules on both leaf surfaces",
                control_measures=["Use resistant hybrids", "Spray Mancozeb or Pyraclostrobin", "Early planting"],
                risk_trigger="Cool, moist weather (Humidity > 95%, Temp 16-23°C)",
                impact_level="⚠️ Moderate: Reduced photosynthesis",
                expected_window="Next 10 days"
            ),
            Disease(
                name="Banded Leaf and Sheath Blight",
                severity="High",
                symptoms="Banded patches on leaves and sheaths, cottony growth",
                control_measures=["Avoid high plant density", "Foliar spray of Hexaconazole", "Remove infected lower leaves"],
                risk_trigger="High Humidity (>90%), Temp 28-32°C",
                impact_level="⚠️ High: Premature leaf death and ear rot",
                expected_window="Next 10 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Tasseling & Silking",
        diseases=[
            Disease(
                name="Turcicum Leaf Blight (Exserohilum turcicum)",
                severity="High",
                symptoms="Large spindle-shaped grayish-green lesions on leaves",
                control_measures=["Spray Carbendazim or Mancozeb", "Crop rotation", "Balanced NPK"],
                risk_trigger="High Humidity, Frequent rain, Temp 18-27°C",
                impact_level="⚠️ High: Massive foliage loss",
                expected_window="Next 7 days"
            ),
            Disease(
                name="Southern Rust",
                severity="High",
                symptoms="Orange-tan pustules mostly on upper leaf surfaces",
                control_measures=["Preventive fungicide spray", "Use resistant varieties", "Monitor weather"],
                risk_trigger="High Humidity, Temp 25-30°C",
                impact_level="⚠️ High: Rapid spread and yield loss",
                expected_window="Next 5 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Grain Filling",
        diseases=[
            Disease(
                name="Grey Leaf Spot (Cercospora zeae-maydis)",
                severity="High",
                symptoms="Rectangular tan spots limited by leaf veins",
                control_measures=["Spray Strobilurin fungicides", "Conventional tillage", "Crop rotation"],
                risk_trigger="Prolonged periods of leaf wetness (>12 hours)",
                impact_level="⚠️ High: Severe defoliation and lodging",
                expected_window="Next 10 days"
            ),
            Disease(
                name="Ear Rot (Aspergillus/Fusarium)",
                severity="Medium",
                symptoms="Moldy growth on kernels; kernels may be pink, white, or green",
                control_measures=["Control ear-feeding insects", "Harvest at 15% moisture", "Proper drying"],
                risk_trigger="Drought stress followed by late rain, Insect damage",
                impact_level="⚠️ Moderate: Quality loss and Mycotoxins",
                expected_window="Grain maturation"
            ),
        ]
    ),
]

# ============================================================================
# MAIZE - FERTILIZER RECOMMENDATIONS BY GROWTH STAGE
# ============================================================================

MAIZE_FERTILIZERS = [
    FertilizerNeed(
        stage_name="Germination",
        nitrogen=30,
        phosphorus=60,
        potassium=40,
        organic_matter=8,
        micronutrients=["Zinc", "Iron"],
        application_timing="Incorporated before planting"
    ),
    FertilizerNeed(
        stage_name="Seedling",
        nitrogen=40,
        phosphorus=0,
        potassium=30,
        organic_matter=0,
        micronutrients=["Zinc"],
        application_timing="At 3-4 leaf stage"
    ),
    FertilizerNeed(
        stage_name="Vegetative Growth",
        nitrogen=140,
        phosphorus=0,
        potassium=60,
        organic_matter=0,
        micronutrients=["Magnesium"],
        application_timing="Split into 2 doses at V6 and V12"
    ),
    FertilizerNeed(
        stage_name="Tasseling & Silking",
        nitrogen=60,
        phosphorus=30,
        potassium=60,
        organic_matter=0,
        micronutrients=["Zinc", "Boron"],
        application_timing="Critical period, split applications"
    ),
    FertilizerNeed(
        stage_name="Grain Filling",
        nitrogen=0,
        phosphorus=0,
        potassium=40,
        organic_matter=0,
        micronutrients=["Potassium"],
        application_timing="Foliar spray at grain initiation"
    ),
]

# ============================================================================
# GRAPES - DISEASE MAPPING BY GROWTH STAGE
# ============================================================================

GRAPES_DISEASES = [
    StageDisease(
        stage_name="Dormancy",
        diseases=[
            Disease(
                name="Powdery Mildew (Winter Cleistothecia)",
                severity="Low",
                symptoms="Dark survival structures (cleistothecia) on bark and canes",
                control_measures=["Pruning of old canes", "Apply dormant spray of lime sulfur", "Remove infected leaves from ground"],
                risk_trigger="Presence of inoculum from previous season",
                impact_level="⚠️ Low: Initial inoculum source",
                expected_window="Winter dormancy"
            ),
        ]
    ),
    StageDisease(
        stage_name="Bud Break",
        diseases=[
            Disease(
                name="Anthracnose (Bird's Eye Rot)",
                severity="Medium",
                symptoms="Small, circular black spots on new shoots and leaves",
                control_measures=["Copper-based sprays", "Remove infected tissues", "Improve vineyard sanitation"],
                risk_trigger="Frequent rain, Temp 10-15°C during bud break",
                impact_level="⚠️ Moderate: Shoot stunting",
                expected_window="Next 7 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Shoot Growth",
        diseases=[
            Disease(
                name="Downy Mildew (Plasmopara viticola)",
                severity="High",
                symptoms="Yellow 'oil spots' on upper leaf surface, white fuzzy growth below",
                control_measures=["Spray Copper or Metalaxyl", "Improve canopy ventilation", "Avoid overhead irrigation"],
                risk_trigger="High Humidity (>90%), Rain, Temp 15-25°C",
                impact_level="⚠️ High: Severe defoliation and flower loss",
                expected_window="Next 5 days"
            ),
            Disease(
                name="Powdery Mildew (Erysiphe necator)",
                severity="High",
                symptoms="White, powdery fungal growth on leaves, shoots, and young berries",
                control_measures=["Regular sulfur dusting", "Apply Potassium bicarbonate", "Leaf pulling for airflow"],
                risk_trigger="Humidity 40-70%, Low light, Temp 20-27°C",
                impact_level="⚠️ High: Reduced sugar content and berry splitting",
                expected_window="Next 10 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Flowering",
        diseases=[
            Disease(
                name="Botrytis Bunch Rot (Gray Mold)",
                severity="High",
                symptoms="Brown, rotted flowers; gray velvety mold during humid periods",
                control_measures=["Avoid excessive Nitrogen", "Spray Botryticides", "Remove flower debris"],
                risk_trigger="Rain during flowering, Humidity > 90%, Temp 15-20°C",
                impact_level="⚠️ Critical: Loss of entire clusters",
                expected_window="Flowering period"
            ),
        ]
    ),
    StageDisease(
        stage_name="Fruit Set",
        diseases=[
            Disease(
                name="Black Rot (Guignardia bidwellii)",
                severity="High",
                symptoms="Circular tan spots on leaves; berries turn into black, shriveled mummies",
                control_measures=["Spray Mancozeb or Myclobutanil", "Remove mummified berries", "Pruning"],
                risk_trigger="Warm, wet weather (Temp 20-27°C), Long leaf wetness",
                impact_level="⚠️ High: Complete destruction of clusters",
                expected_window="Next 10 days"
            ),
            Disease(
                name="Phomopsis Cane and Leaf Spot",
                severity="Medium",
                symptoms="Small black lesions on the first 3-4 nodes of new canes",
                control_measures=["Prune infected canes", "Spray Captan or Mancozeb", "Improve sanitation"],
                risk_trigger="Cool, wet spring weather",
                impact_level="⚠️ Moderate: Weakening of canes",
                expected_window="Next 14 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Berry Development",
        diseases=[
            Disease(
                name="Sour Rot",
                severity="Medium",
                symptoms="Berries turn brown and smell like vinegar; presence of fruit flies",
                control_measures=["Control fruit flies", "Manage canopy for airflow", "Apply antimicrobial sprays"],
                risk_trigger="Rain during ripening, Berry wounding, Fruit flies",
                impact_level="⚠️ High: Off-flavors and cluster rotting",
                expected_window="Next 10 days"
            ),
        ]
    ),
    StageDisease(
        stage_name="Ripening",
        diseases=[
            Disease(
                name="Late Season Botrytis",
                severity="High",
                symptoms="Gray mold covering entire clusters; berry skin becomes slip-skin",
                control_measures=["Leaf removal around clusters", "Apply specific fungicides", "Careful handling"],
                risk_trigger="High Humidity, Rain just before harvest",
                impact_level="⚠️ Critical: Massive harvest loss",
                expected_window="Harvest window"
            ),
            Disease(
                name="Ripe Rot",
                severity="Medium",
                symptoms="Circular sunken lesions with pinkish spore masses on ripe berries",
                control_measures=["Timely harvest", "Fungicide program", "Pruning for light"],
                risk_trigger="Warm, wet conditions during ripening",
                impact_level="⚠️ Moderate: Fruit spoilage",
                expected_window="Next 7 days"
            ),
        ]
    ),
]

# ============================================================================
# GRAPES - FERTILIZER RECOMMENDATIONS BY GROWTH STAGE
# ============================================================================

GRAPES_FERTILIZERS = [
    FertilizerNeed(
        stage_name="Dormancy",
        nitrogen=0,
        phosphorus=40,
        potassium=60,
        organic_matter=5,
        micronutrients=["Boron", "Zinc"],
        application_timing="Late winter, before bud break"
    ),
    FertilizerNeed(
        stage_name="Bud Break",
        nitrogen=30,
        phosphorus=0,
        potassium=30,
        organic_matter=0,
        micronutrients=["Iron", "Manganese"],
        application_timing="As buds break"
    ),
    FertilizerNeed(
        stage_name="Shoot Growth",
        nitrogen=80,
        phosphorus=20,
        potassium=60,
        organic_matter=0,
        micronutrients=["Magnesium"],
        application_timing="Every 2 weeks during growth"
    ),
    FertilizerNeed(
        stage_name="Flowering",
        nitrogen=20,
        phosphorus=40,
        potassium=40,
        organic_matter=0,
        micronutrients=["Boron", "Zinc"],
        application_timing="During flower bud formation"
    ),
    FertilizerNeed(
        stage_name="Fruit Set",
        nitrogen=0,
        phosphorus=30,
        potassium=80,
        organic_matter=0,
        micronutrients=["Potassium"],
        application_timing="As fruit sets"
    ),
    FertilizerNeed(
        stage_name="Berry Development",
        nitrogen=0,
        phosphorus=0,
        potassium=100,
        organic_matter=0,
        micronutrients=["Potassium"],
        application_timing="Every 10-14 days"
    ),
    FertilizerNeed(
        stage_name="Ripening",
        nitrogen=0,
        phosphorus=20,
        potassium=60,
        organic_matter=0,
        micronutrients=["Potassium", "Magnesium"],
        application_timing="Foliar spray at harvest approach"
    ),
]

# ============================================================================
# CROP DATA REGISTRY
# ============================================================================

CROP_DATA = {
    "Rice": {
        "diseases": RICE_DISEASES,
        "fertilizers": RICE_FERTILIZERS,
    },
    "Tomato": {
        "diseases": TOMATO_DISEASES,
        "fertilizers": TOMATO_FERTILIZERS,
    },
    "Potato": {
        "diseases": POTATO_DISEASES,
        "fertilizers": POTATO_FERTILIZERS,
    },
    "Maize": {
        "diseases": MAIZE_DISEASES,
        "fertilizers": MAIZE_FERTILIZERS,
    },
    "Grapes": {
        "diseases": GRAPES_DISEASES,
        "fertilizers": GRAPES_FERTILIZERS,
    },
}


def get_stage_diseases(crop_type: str, stage_name: str) -> list:
    """Get diseases for a specific crop stage"""
    if crop_type not in CROP_DATA:
        return []
    
    for stage_disease in CROP_DATA[crop_type]["diseases"]:
        if stage_disease.stage_name == stage_name:
            return stage_disease.diseases
    return []


def get_stage_fertilizer(crop_type: str, stage_name: str) -> FertilizerNeed:
    """Get fertilizer recommendations for a specific crop stage"""
    if crop_type not in CROP_DATA:
        return None
    
    for fert in CROP_DATA[crop_type]["fertilizers"]:
        if fert.stage_name == stage_name:
            return fert
    return None
