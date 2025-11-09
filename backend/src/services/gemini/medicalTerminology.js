/**
 * Centralized Medical Terminology Guide
 *
 * This module provides a comprehensive mapping of common patient language
 * to medical terminology. Used across all Gemini AI prompts and search
 * query analysis to ensure consistent synonym recognition.
 *
 * Single source of truth - update here to apply everywhere.
 */

/**
 * Medical Synonym Map - Structured object for query analysis and search filtering
 * Maps common patient terms to medical terminology synonyms
 */
export const MEDICAL_SYNONYM_MAP = {
  // Lab Tests
  "blood work": ["complete blood count", "cbc", "blood test", "hemogram", "cmp", "bmp", "metabolic panel", "labs"],
  "blood test": ["complete blood count", "cbc", "blood work", "hemogram", "labs"],
  "labs": ["blood work", "blood test", "cbc", "complete blood count", "lab results", "laboratory"],
  "cholesterol": ["lipid panel", "ldl", "hdl", "triglycerides", "lipids", "cholesterol test"],
  "blood sugar": ["glucose", "a1c", "hba1c", "fasting glucose", "hemoglobin a1c", "diabetes test"],
  "sugar test": ["glucose", "a1c", "hba1c", "fasting glucose", "hemoglobin a1c", "diabetes test"],
  "diabetes test": ["glucose", "a1c", "hba1c", "fasting glucose", "hemoglobin a1c", "blood sugar"],
  "thyroid test": ["tsh", "t3", "t4", "thyroid panel", "thyroid function test", "thyroid levels"],
  "thyroid levels": ["tsh", "t3", "t4", "thyroid panel", "thyroid function test"],
  "liver test": ["lft", "alt", "ast", "bilirubin", "liver panel", "hepatic function", "liver function"],
  "liver function": ["lft", "alt", "ast", "bilirubin", "liver panel", "hepatic function"],
  "kidney test": ["creatinine", "bun", "gfr", "renal panel", "kidney function test"],
  "kidney function": ["creatinine", "bun", "gfr", "renal panel", "kidney function test"],
  "iron test": ["ferritin", "serum iron", "iron panel", "tibc"],
  "vitamin levels": ["vitamin d", "b12", "folate", "vitamin panel"],
  "electrolytes": ["sodium", "potassium", "chloride", "electrolyte panel"],
  "psa": ["prostate-specific antigen", "prostate test"],

  // Imaging
  "x-ray": ["xray", "radiograph", "radiology report", "plain film"],
  "xray": ["x-ray", "radiograph", "radiology report", "plain film"],
  "mri": ["magnetic resonance imaging", "mr scan"],
  "ct scan": ["computed tomography", "cat scan", "ct imaging", "ct"],
  "cat scan": ["computed tomography", "ct scan", "ct imaging"],
  "ultrasound": ["sonography", "us", "echo", "echocardiogram"],
  "mammogram": ["breast imaging", "breast x-ray"],
  "pet scan": ["positron emission tomography"],

  // Medications
  "prescription": ["medication", "meds", "rx", "drug", "drugs", "medicine", "pharmaceutical"],
  "medication": ["prescription", "meds", "rx", "drug", "drugs", "medicine"],
  "meds": ["medication", "prescription", "rx", "drug", "drugs", "medicine"],
  "blood pressure med": ["antihypertensive", "ace inhibitor", "beta blocker", "arb", "calcium channel blocker", "bp med", "hypertension med"],
  "bp med": ["antihypertensive", "ace inhibitor", "beta blocker", "blood pressure med"],
  "diabetes med": ["metformin", "insulin", "antidiabetic", "hypoglycemic agent", "glucophage", "sugar med"],
  "sugar med": ["metformin", "insulin", "antidiabetic", "hypoglycemic agent", "diabetes med"],
  "cholesterol med": ["atorvastatin", "simvastatin", "lipitor", "crestor", "lipid-lowering agent", "statin"],
  "statin": ["atorvastatin", "simvastatin", "lipitor", "crestor", "cholesterol med"],
  "blood thinner": ["anticoagulant", "warfarin", "coumadin", "aspirin", "antiplatelet"],
  "painkiller": ["analgesic", "nsaid", "ibuprofen", "acetaminophen", "tylenol", "opioid", "pain med"],
  "pain med": ["analgesic", "nsaid", "ibuprofen", "painkiller"],
  "antibiotic": ["antimicrobial", "amoxicillin", "penicillin", "antibacterial"],
  "antidepressant": ["ssri", "antidepressive", "prozac", "zoloft"],
  "inhaler": ["bronchodilator", "albuterol", "steroid inhaler", "rescue inhaler", "asthma med"],
  "asthma med": ["bronchodilator", "albuterol", "inhaler", "rescue inhaler"],

  // Visits & Procedures
  "checkup": ["physical", "exam", "doctor visit", "annual exam", "wellness visit", "preventive care", "physical exam", "routine visit"],
  "physical": ["checkup", "physical exam", "doctor visit", "annual exam", "routine visit"],
  "routine visit": ["checkup", "physical", "doctor visit", "wellness visit"],
  "shot": ["vaccine", "vaccination", "immunization", "jab", "inoculation"],
  "vaccine": ["vaccination", "immunization", "shot", "jab", "inoculation"],
  "vaccination": ["vaccine", "immunization", "shot", "jab"],
  "immunization": ["vaccine", "vaccination", "shot"],
  "operation": ["surgery", "surgical procedure", "operative report", "procedure note"],
  "surgery": ["operation", "surgical procedure", "operative report"],
  "biopsy": ["tissue sample", "pathology", "specimen collection"],
  "ekg": ["ecg", "electrocardiogram", "cardiac monitoring", "heart test"],
  "ecg": ["ekg", "electrocardiogram", "cardiac monitoring"],

  // Specialties
  "heart doctor": ["cardiologist", "cardiac specialist"],
  "cardiologist": ["heart doctor", "cardiac specialist"],
  "bone doctor": ["orthopedist", "orthopedic surgeon", "orthopedics", "joint doctor"],
  "joint doctor": ["orthopedist", "orthopedic surgeon", "bone doctor"],
  "skin doctor": ["dermatologist", "dermatology"],
  "dermatologist": ["skin doctor", "dermatology"],
  "cancer doctor": ["oncologist", "oncology"],
  "oncologist": ["cancer doctor", "oncology"],
  "stomach doctor": ["gastroenterologist", "gi specialist", "gi doctor"],
  "gi doctor": ["gastroenterologist", "gi specialist", "stomach doctor"],
  "lung doctor": ["pulmonologist", "pulmonary specialist"],
  "pulmonologist": ["lung doctor", "pulmonary specialist"],
  "kidney doctor": ["nephrologist", "renal specialist"],
  "nephrologist": ["kidney doctor", "renal specialist"],
  "brain doctor": ["neurologist", "neurology", "nervous system specialist"],
  "neurologist": ["brain doctor", "neurology", "nervous system specialist"],
  "hormone doctor": ["endocrinologist", "diabetes doctor"],
  "endocrinologist": ["hormone doctor", "diabetes doctor"],
  "eye doctor": ["ophthalmologist", "optometrist"],
  "ear nose throat": ["ent", "otolaryngologist"],
  "ent": ["ear nose throat", "otolaryngologist"],

  // Common Conditions
  "high blood pressure": ["hypertension", "htn", "elevated bp"],
  "hypertension": ["high blood pressure", "htn", "elevated bp"],
  "diabetes": ["diabetes mellitus", "dm", "type 1 diabetes", "type 2 diabetes", "sugar disease"],
  "sugar disease": ["diabetes", "diabetes mellitus"],
  "high cholesterol": ["hyperlipidemia", "dyslipidemia", "hypercholesterolemia"],
  "heart attack": ["myocardial infarction", "mi", "coronary event", "acute coronary syndrome"],
  "stroke": ["cerebrovascular accident", "cva", "brain attack"],
  "copd": ["chronic obstructive pulmonary disease", "chronic lung disease", "emphysema"],
  "emphysema": ["copd", "chronic obstructive pulmonary disease"],
  "arthritis": ["osteoarthritis", "rheumatoid arthritis", "inflammatory arthritis", "joint pain"],
  "joint pain": ["arthritis", "osteoarthritis"],

  // Body Systems
  "heart": ["cardiac", "cardiovascular", "coronary"],
  "cardiovascular": ["heart", "cardiac", "coronary"],
  "lungs": ["pulmonary", "respiratory", "breathing"],
  "breathing": ["pulmonary", "respiratory", "lungs"],
  "stomach": ["gastrointestinal", "digestive", "abdominal", "gut", "gi"],
  "gut": ["gastrointestinal", "digestive", "stomach", "gi"],
  "gi": ["gastrointestinal", "stomach", "gut", "digestive"],
  "kidneys": ["renal", "urinary"],
  "liver": ["hepatic"],
  "bones": ["musculoskeletal", "orthopedic", "joints"],
  "joints": ["musculoskeletal", "orthopedic", "bones"],

  // General Terms
  "diagnosis": ["disease", "disorder", "findings", "medical condition", "condition"],
  "condition": ["diagnosis", "disease", "disorder"],
  "normal": ["within reference range", "wnl", "within normal limits", "unremarkable", "okay", "fine"],
  "okay": ["normal", "within reference range", "fine"],
  "fine": ["normal", "within reference range", "okay"],
  "abnormal": ["outside reference range", "elevated", "decreased", "out of range", "high", "low", "off"],
  "high": ["elevated", "abnormal", "outside reference range"],
  "low": ["decreased", "abnormal", "outside reference range"],
  "test results": ["lab results", "laboratory findings", "diagnostic results", "workup"],
  "lab results": ["test results", "laboratory findings", "diagnostic results"],
  "symptoms": ["clinical presentation", "chief complaint", "signs and symptoms", "complaints"],
  "complaints": ["symptoms", "clinical presentation", "chief complaint"],
};

/**
 * Medical Terminology Guide - Text format for AI prompts
 * This is the human-readable version used in Gemini prompts
 */
export const MEDICAL_TERMINOLOGY_GUIDE = `--- MEDICAL TERMINOLOGY GUIDE ---
When interpreting user queries, be aware of these common medical term synonyms:

**Lab Tests:**
- "blood work", "blood test", "labs" = CBC, CMP, BMP, Complete Blood Count, metabolic panel, hemogram
- "cholesterol" = lipid panel, LDL, HDL, triglycerides, lipids
- "blood sugar", "sugar test", "diabetes test" = glucose, A1C, HbA1c, fasting glucose, hemoglobin A1C
- "thyroid test", "thyroid levels" = TSH, T3, T4, thyroid panel, thyroid function test
- "liver test", "liver function" = LFT, ALT, AST, bilirubin, liver panel, hepatic function
- "kidney test", "kidney function" = creatinine, BUN, GFR, renal panel, kidney function test
- "iron test" = ferritin, serum iron, iron panel, TIBC
- "vitamin levels" = vitamin D, B12, folate, vitamin panel
- "electrolytes" = sodium, potassium, chloride, electrolyte panel
- "PSA" = prostate-specific antigen, prostate test

**Imaging:**
- "x-ray", "xray" = radiograph, radiology report, plain film
- "MRI" = magnetic resonance imaging, MR scan
- "CT scan", "CAT scan" = computed tomography, CT imaging
- "ultrasound" = sonography, US, echo, echocardiogram (for heart)
- "mammogram" = breast imaging, breast x-ray
- "PET scan" = positron emission tomography

**Medications:**
- "prescription", "medication", "meds", "drugs", "medicine" = Rx, pharmaceutical, drug therapy
- "blood pressure med", "BP med", "hypertension med" = antihypertensive, ACE inhibitor, beta blocker, ARB, calcium channel blocker
- "diabetes med", "sugar med" = metformin, insulin, antidiabetic, hypoglycemic agent, glucophage
- "cholesterol med", "statin" = atorvastatin, simvastatin, lipitor, crestor, lipid-lowering agent
- "blood thinner" = anticoagulant, warfarin, coumadin, aspirin, antiplatelet
- "painkiller", "pain med" = analgesic, NSAID, ibuprofen, acetaminophen, tylenol, opioid
- "antibiotic" = antimicrobial, amoxicillin, penicillin, antibacterial
- "antidepressant" = SSRI, antidepressive, prozac, zoloft
- "inhaler", "asthma med" = bronchodilator, albuterol, steroid inhaler, rescue inhaler

**Visits & Procedures:**
- "checkup", "physical", "routine visit" = physical exam, doctor visit, annual exam, wellness visit, preventive care
- "shot", "vaccine", "immunization" = vaccination, inoculation, jab
- "operation", "surgery" = surgical procedure, operative report, procedure note
- "biopsy" = tissue sample, pathology, specimen collection
- "EKG", "ECG", "heart test" = electrocardiogram, cardiac monitoring

**Specialties:**
- "heart doctor" = cardiologist, cardiac specialist
- "bone doctor", "joint doctor" = orthopedist, orthopedic surgeon, orthopedics
- "skin doctor" = dermatologist, dermatology
- "cancer doctor" = oncologist, oncology
- "stomach doctor", "GI doctor" = gastroenterologist, GI specialist
- "lung doctor" = pulmonologist, pulmonary specialist
- "kidney doctor" = nephrologist, renal specialist
- "brain doctor", "neurologist" = neurology, nervous system specialist
- "hormone doctor" = endocrinologist, diabetes doctor
- "eye doctor" = ophthalmologist, optometrist
- "ear nose throat", "ENT" = otolaryngologist

**Common Conditions:**
- "high blood pressure" = hypertension, HTN, elevated BP
- "diabetes", "sugar disease" = diabetes mellitus, DM, type 1 diabetes, type 2 diabetes
- "high cholesterol" = hyperlipidemia, dyslipidemia, hypercholesterolemia
- "heart attack" = myocardial infarction, MI, coronary event, acute coronary syndrome
- "stroke" = cerebrovascular accident, CVA, brain attack
- "COPD", "emphysema" = chronic obstructive pulmonary disease, chronic lung disease
- "arthritis", "joint pain" = osteoarthritis, rheumatoid arthritis, inflammatory arthritis

**Body Systems:**
- "heart", "cardiovascular" = cardiac, coronary
- "lungs", "breathing" = pulmonary, respiratory
- "stomach", "gut", "GI" = gastrointestinal, digestive, abdominal
- "kidneys" = renal, urinary
- "liver" = hepatic
- "bones", "joints" = musculoskeletal, orthopedic

**General Terms:**
- "diagnosis", "what's wrong", "condition" = disease, disorder, findings, medical condition
- "normal", "okay", "fine" = within reference range, WNL (within normal limits), unremarkable
- "abnormal", "high", "low", "off" = outside reference range, elevated, decreased, out of range
- "test results", "lab results" = laboratory findings, diagnostic results, workup
- "symptoms", "complaints" = clinical presentation, chief complaint, signs and symptoms
--- END TERMINOLOGY GUIDE ---`;
