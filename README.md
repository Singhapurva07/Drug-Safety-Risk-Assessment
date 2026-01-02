# Drug-Safety-Risk-Assessment
Advanced machine learning models analyze FDA FAERS data to predict organ-specific adverse event risks with transparent explanations.
The system bridges the gap between raw adverse event statistics and clinically interpretable insights, particularly in polypharmacy and high-risk patient scenarios.

1. Problem Statement

Adverse drug reactions remain a significant cause of morbidity worldwide. Existing pharmacovigilance systems often provide statistical signals without clinical interpretation, making it difficult for healthcare professionals and students to understand the mechanism, relevance, and patient context of drug risks.

MediVision addresses this gap by combining:

Predictive machine learning models

Domain-aware agentic AI reasoning

A transparent and explainable user interface

2. System Capabilities Overview
Capability	Description
Multi-organ risk prediction	Estimates adverse event probability for liver, kidney, and lung
Explainable AI reasoning	Converts ML outputs into clinical interpretations
Polypharmacy awareness	Detects and escalates risk when multiple drugs are used
Dual explanation modes	Clinical (professional) and Educational (patient/student)
Detailed risk analysis	On-demand in-depth clinical reasoning
Modern web interface	Interactive, visual, and responsive UI
3. Data Source
FDA FAERS (Adverse Event Reporting System)
Aspect	Details
Type	Real-world post-marketing surveillance data
Scope	Millions of adverse event reports
Nature	Voluntary reporting (subject to bias)
Usage in MediVision	Model training, probability estimation, signal detection

Note: FAERS does not provide dosage, lab values, or patient history. MediVision explicitly accounts for these limitations in its explanations.

4. Machine Learning Architecture
4.1 Feature Engineering
Feature Category	Examples
Demographics	Age bucket, sex
Drug usage	Drug count, active ingredient
Clinical context	Serious outcome, reaction count
Administration	Route, dose category
Risk context	Polypharmacy flag

Categorical features are encoded using pre-trained label encoders to ensure consistency with training.

4.2 Models Used
Organ	Algorithm	Purpose
Liver	LightGBM	Hepatotoxicity risk estimation
Kidney	XGBoost	Renal adverse event prediction
Lung	XGBoost	Respiratory risk estimation

All models are CPU-based, making the system lightweight and deployable without specialized hardware.

4.3 Model Outputs

Each organ model outputs:

Output	Description
Probability	Likelihood of adverse event (0–1)
Risk level	Low / Moderate / High
Confidence	Derived from prediction variance
5. Agentic AI Layer (Explainable Reasoning)
5.1 Role of Agentic AI

The agentic AI does not replace ML models. Instead, it:

Interprets numerical predictions

Incorporates drug-specific pharmacology

Considers patient context

Explains mechanisms and monitoring needs

5.2 Drug Knowledge Integration
Drug	Primary Concern	Monitoring
Paracetamol	Hepatotoxicity	Liver function tests
Ibuprofen	Renal / GI risk	Renal function
Warfarin	Bleeding risk	INR
Metformin	Lactic acidosis	Renal function
Statins	Myopathy	CK, liver enzymes

This knowledge base improves realism when FAERS data is sparse.

5.3 Explanation Modes
Mode	Target Audience	Characteristics
Clinical	Healthcare professionals	Medical terminology, mechanisms, monitoring
Educational	Students / patients	Simplified, non-alarming explanations
6. Risk Aggregation Logic
Overall Risk Score

A weighted aggregate score is computed:

Organ	Weight
Liver	40%
Kidney	35%
Lung	25%

The final score reflects overall adverse event susceptibility, not diagnosis.

Primary Risk Driver Identification
Condition	Outcome
Highest organ probability	Organ-driven risk
Polypharmacy detected	Interaction-driven risk
Low probabilities	Low overall risk profile
7. Detailed Risk Analysis (On-Demand)

When requested, MediVision generates a structured analysis including:

Section	Description
Identified Issues	Elevated organ risks
Biological Mechanisms	Drug metabolism and toxicity
Risk Pathways	Acute vs chronic patterns
Patient Factors	Age, polypharmacy, interactions
Monitoring	Labs, symptoms, follow-up
Clinical Guidance	Risk mitigation strategies

This analysis is generated only on demand to conserve resources.

8. User Interface Design
Frontend Highlights
Feature	Description
Visual risk cards	Organ-wise probability bars
Confidence badges	High / Medium / Low
Polypharmacy alerts	Contextual warnings
Blue gradient UI	Clear, clinical visual tone
Responsive layout	Desktop and mobile friendly
9. System Architecture Flow

User inputs patient and drug information

Backend preprocesses and encodes features

Organ-specific ML models generate predictions

Risk aggregation and confidence estimation

Agentic AI interprets results

UI displays risks, explanations, and disclaimers

10. Ethical Considerations & Safety
Aspect	Implementation
No diagnosis	Explicit disclaimer
Transparency	Probabilities shown
Uncertainty	Confidence reporting
Bias awareness	FAERS limitations explained
11. Intended Applications

Academic major projects

Explainable AI demonstrations

Pharmacovigilance research

Clinical decision support prototyping

AI ethics and interpretability studies

12. Limitations

FAERS reporting bias

No dosage or lab values

No longitudinal patient history

Not validated for real-world clinical decisions

13. Disclaimer

MediVision provides machine learning–based risk estimations derived from FDA FAERS data.
It is not a medical diagnosis or treatment tool.
Always consult qualified healthcare professionals for medical decisions.

