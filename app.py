from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
import os
import numpy as np

# ==================== LOAD ENV ====================
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not found in .env")

groq_client = Groq(api_key=GROQ_API_KEY)

# ==================== APP ====================
app = FastAPI(
    title="MediVision - FAERS Organ Damage Predictor API",
    description="Explainable AI-Assisted Pharmacovigilance Platform",
    version="2.0.0"
)

# ==================== CORS ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== PATHS ====================
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models_improved"

# ==================== LOAD ML MODELS ====================
try:
    label_encoders = joblib.load(MODELS_DIR / "label_encoders.pkl")

    FEATURE_COLUMNS = [
        "age_bucket_le", "sex_clean_le", "reporter_type_le", "route_clean_le",
        "dose_bin_le", "indication_clean_le", "active_ingredient_le",
        "drug_count", "reaction_count", "serious_outcome", "polypharmacy"
    ]

    MODELS = {
        "LIVER": joblib.load(MODELS_DIR / "liver_lightgbm.pkl"),
        "KIDNEY": joblib.load(MODELS_DIR / "kidney_xgboost.pkl"),
        "LUNG": joblib.load(MODELS_DIR / "lung_xgboost.pkl"),
    }

except Exception as e:
    raise RuntimeError(f"Model loading failed: {e}")

# ==================== DRUG CLASS MAPPING ====================
DRUG_CLASSES = {
    "PARACETAMOL": "Analgesic",
    "ACETAMINOPHEN": "Analgesic",
    "IBUPROFEN": "NSAID",
    "ASPIRIN": "NSAID",
    "NAPROXEN": "NSAID",
    "DICLOFENAC": "NSAID",
    "ATORVASTATIN": "Statin",
    "SIMVASTATIN": "Statin",
    "ROSUVASTATIN": "Statin",
    "METFORMIN": "Antidiabetic",
    "INSULIN": "Antidiabetic",
    "AMOXICILLIN": "Antibiotic",
    "CIPROFLOXACIN": "Antibiotic",
    "AZITHROMYCIN": "Antibiotic",
    "MORPHINE": "Opioid",
    "CODEINE": "Opioid",
    "OXYCODONE": "Opioid",
    "WARFARIN": "Anticoagulant",
    "HEPARIN": "Anticoagulant",
    "OMEPRAZOLE": "Proton Pump Inhibitor",
    "PANTOPRAZOLE": "Proton Pump Inhibitor",
    "AMLODIPINE": "Calcium Channel Blocker",
    "LISINOPRIL": "ACE Inhibitor",
    "LOSARTAN": "ARB",
    "METOPROLOL": "Beta Blocker",
    "FUROSEMIDE": "Diuretic",
    "PREDNISONE": "Corticosteroid",
    "ALBUTEROL": "Bronchodilator",
}

# ==================== DRUG RISK KNOWLEDGE BASE ====================
DRUG_RISK_PROFILES = {
    "PARACETAMOL": {
        "primary_concern": "hepatotoxicity",
        "risk_factors": ["chronic use", "overdose", "alcohol consumption"],
        "monitoring": "liver function tests"
    },
    "ACETAMINOPHEN": {
        "primary_concern": "hepatotoxicity",
        "risk_factors": ["chronic use", "overdose", "alcohol consumption"],
        "monitoring": "liver function tests"
    },
    "IBUPROFEN": {
        "primary_concern": "GI bleeding and renal dysfunction",
        "risk_factors": ["elderly", "chronic use", "dehydration"],
        "monitoring": "renal function, GI symptoms"
    },
    "ATORVASTATIN": {
        "primary_concern": "myopathy and liver enzyme elevation",
        "risk_factors": ["high dose", "drug interactions"],
        "monitoring": "CK levels, liver enzymes"
    },
    "METFORMIN": {
        "primary_concern": "lactic acidosis",
        "risk_factors": ["renal impairment", "heart failure"],
        "monitoring": "renal function, lactate levels"
    },
    "WARFARIN": {
        "primary_concern": "bleeding risk",
        "risk_factors": ["drug interactions", "dietary changes"],
        "monitoring": "INR levels"
    },
}

# ==================== REQUEST SCHEMAS ====================
class PredictionRequest(BaseModel):
    age: int | None = None
    sex: str = "UNK"
    reporter_type: str = "UNK"
    drug_count: int = 1
    reaction_count: int = 0
    serious_outcome: int = 0
    polypharmacy: int = 0
    route: str = "UNKNOWN"
    dose_bin: str = "Unknown"
    indication: str = "UNKNOWN"
    active_ingredient: str = "UNKNOWN"
    explanation_mode: str = "clinical"

class DetailedAnalysisRequest(BaseModel):
    predictions: dict
    overall_risk_score: float
    primary_driver: str
    confidence: str
    drug_class: str
    drug_name: str  # ✅ ADDED: Drug name field

# ==================== HELPER FUNCTIONS ====================
def calculate_overall_risk(predictions):
    weights = {"LIVER": 0.4, "KIDNEY": 0.35, "LUNG": 0.25}
    overall = sum(predictions[o]["probability"] * weights[o] for o in predictions)
    return round(overall * 100, 1)

def calculate_confidence(predictions):
    probs = [predictions[o]["probability"] for o in predictions]
    variance = np.var(probs)
    if variance < 0.02:
        return "High"
    elif variance < 0.05:
        return "Medium"
    return "Low"

def identify_primary_driver(predictions, polypharmacy):
    max_organ = max(predictions, key=lambda x: predictions[x]["probability"])
    factors = []
    if predictions[max_organ]["probability"] > 0.35:
        factors.append(f"{max_organ.capitalize()} risk")
    if polypharmacy == 1:
        factors.append("Polypharmacy")
    return ", ".join(factors) if factors else "Low overall risk profile"

def get_drug_class(drug_name):
    return DRUG_CLASSES.get(drug_name.upper(), "Unknown Class")

def get_drug_risk_profile(drug_name):
    return DRUG_RISK_PROFILES.get(drug_name.upper(), None)

# ==================== AGENTIC AI PROMPT GENERATOR ====================
def generate_clinical_prompt(drug_name, drug_class, age_bucket, sex, polypharmacy, 
                            predictions, overall_risk, confidence, explanation_mode):

    drug_profile = get_drug_risk_profile(drug_name)

    drug_specific_info = ""
    if drug_profile:
        drug_specific_info = f"""
Known risk profile for {drug_name}:
- Primary concern: {drug_profile['primary_concern']}
- Risk factors: {', '.join(drug_profile['risk_factors'])}
- Monitoring: {drug_profile['monitoring']}
"""

    organ_summary = "\n".join([
        f"- {organ}: {data['probability']*100:.1f}% ({data['risk_level']})"
        for organ, data in predictions.items()
    ])

    mode_instruction = (
        "Audience: Healthcare professionals. Use medical terminology."
        if explanation_mode == "clinical"
        else "Audience: Patients. Use simple language."
    )

    return f"""You are a clinical pharmacology AI assistant.

{mode_instruction}

Drug: {drug_name}
Class: {drug_class}
Age group: {age_bucket}
Sex: {sex}
Polypharmacy: {"Yes" if polypharmacy else "No"}

{drug_specific_info}

ML Predictions:
{organ_summary}
Overall risk: {overall_risk}%
Confidence: {confidence}

Explain reasoning and end with [GREEN ALERT / YELLOW ALERT / RED ALERT].
"""

# ==================== DETAILED ANALYSIS PROMPT ====================
def generate_detailed_prompt(drug_name, drug_class, predictions, overall_risk, primary_driver, confidence):
    organ_summary = "\n".join([
        f"- {organ}: {data['probability']*100:.1f}% ({data['risk_level']})"
        for organ, data in predictions.items()
    ])
    
    return f"""You are an expert clinical pharmacologist providing comprehensive risk analysis.

Drug: {drug_name}
Class: {drug_class}
Overall Risk Score: {overall_risk}%
Primary Risk Driver: {primary_driver}
Confidence: {confidence}

Organ-Specific Predictions:
{organ_summary}

Provide a detailed analysis with the following structure:

1. IDENTIFIED ISSUES
   - List key risk factors and concerns
   - Highlight organ-specific vulnerabilities

2. POSSIBLE CONSEQUENCES
   - Short-term adverse effects
   - Long-term complications
   - Risk of progression

3. RISK PATHWAYS
   - Biological mechanisms involved
   - Drug-organ interactions
   - Compounding factors

4. MONITORING RECOMMENDATIONS
   - Laboratory tests required
   - Clinical signs to watch for
   - Follow-up schedule
   - When to seek immediate care

5. RISK MITIGATION STRATEGIES
   - Dose adjustments if needed
   - Alternative therapies to consider
   - Lifestyle modifications
   - Drug interactions to avoid

Be specific, evidence-based, and clinically actionable. Use medical terminology appropriately.
"""

# ==================== MAIN PREDICTION ENDPOINT ====================
@app.post("/predict")
async def predict(data: PredictionRequest):
    try:
        if data.age is None:
            age_bucket = "Unknown"
        elif data.age <= 18:
            age_bucket = "0-18"
        elif data.age <= 45:
            age_bucket = "19-45"
        elif data.age <= 65:
            age_bucket = "46-65"
        else:
            age_bucket = "65+"

        drug_name_clean = data.active_ingredient.strip().upper()
        drug_class = get_drug_class(drug_name_clean)

        row = {
            "age_bucket": age_bucket,
            "sex_clean": data.sex.upper(),
            "reporter_type": data.reporter_type.upper(),
            "route_clean": data.route.upper(),
            "dose_bin": data.dose_bin,
            "indication_clean": data.indication.upper(),
            "active_ingredient": drug_name_clean,
            "drug_count": data.drug_count,
            "reaction_count": data.reaction_count,
            "serious_outcome": data.serious_outcome,
            "polypharmacy": data.polypharmacy,
        }

        df = pd.DataFrame([row])

        for col, enc in label_encoders.items():
            if col in df.columns:
                try:
                    df[f"{col}_le"] = enc.transform(df[col].astype(str))
                except ValueError:
                    df[f"{col}_le"] = 0

        X = df[FEATURE_COLUMNS]

        predictions = {}
        for organ, model in MODELS.items():
            prob = float(model.predict_proba(X)[:, 1][0])
            level = "High" if prob > 0.65 else "Moderate" if prob > 0.35 else "Low"
            predictions[organ] = {"probability": round(prob, 4), "risk_level": level}

        overall_risk = calculate_overall_risk(predictions)
        confidence = calculate_confidence(predictions)
        primary_driver = identify_primary_driver(predictions, data.polypharmacy)

        agent_prompt = generate_clinical_prompt(
            drug_name_clean, drug_class, age_bucket, data.sex,
            data.polypharmacy, predictions, overall_risk,
            confidence, data.explanation_mode
        )

        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": agent_prompt}],
                temperature=0.3,
                max_tokens=400
            )
            explanation = completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq API Error: {e}")
            explanation = f"Risk assessment indicates {primary_driver} as the main concern. Monitoring recommended."

        return {
            "status": "success",
            "predictions": predictions,
            "overall_risk_score": overall_risk,
            "confidence": confidence,
            "primary_driver": primary_driver,
            "drug_class": drug_class,
            "drug_name": drug_name_clean,  # ✅ ADDED: Include drug name in response
            "default_explanation": explanation,
            "disclaimer": "This is an ML-based risk estimation from FAERS data. Not a medical diagnosis."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DETAILED ANALYSIS ENDPOINT ====================
@app.post("/detailed-analysis")
async def detailed_analysis(request: DetailedAnalysisRequest):
    """
    Generate comprehensive detailed risk analysis.
    """
    try:
        detailed_prompt = generate_detailed_prompt(
            request.drug_name,  # ✅ FIXED: Use drug_name from request
            request.drug_class,
            request.predictions,
            request.overall_risk_score,
            request.primary_driver,
            request.confidence
        )

        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": detailed_prompt}],
            temperature=0.3,
            max_tokens=1500
        )

        return {
            "status": "success",
            "detailed_explanation": completion.choices[0].message.content.strip()
        }

    except Exception as e:
        print(f"Detailed analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate detailed analysis: {str(e)}")

# ==================== HEALTH CHECK ====================
@app.get("/")
async def root():
    return {
        "message": "MediVision API v2.0",
        "status": "operational",
        "endpoints": ["/predict", "/detailed-analysis"]
    }

# ==================== RUN ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)