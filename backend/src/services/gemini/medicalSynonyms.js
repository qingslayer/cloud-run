/**
 * Medical Synonym Map for Client-Side Search Query Expansion
 *
 * This map is used ONLY for document filtering/search (NO AI prompts).
 * It helps users find documents when they search with colloquial terms.
 *
 * Example: User searches "cholesterol" → also matches documents containing "LDL", "HDL", "lipid panel"
 *
 * IMPORTANT: This does NOT consume AI tokens - it's just for keyword matching.
 */

export const MEDICAL_SYNONYM_MAP = {
  // Cardiovascular & Lipids
  'cholesterol': ['lipid', 'ldl', 'hdl', 'triglycerides', 'lipid panel'],
  'blood pressure': ['bp', 'hypertension', 'hypotension'],
  'heart rate': ['pulse', 'hr', 'beats per minute', 'bpm'],

  // Blood Sugar & Diabetes
  'blood sugar': ['glucose', 'a1c', 'hba1c', 'hemoglobin a1c', 'glycemic'],
  'diabetes': ['diabetic', 'glucose', 'insulin'],

  // Blood Tests
  'blood work': ['lab', 'labs', 'blood test', 'lab results', 'lab work'],
  'cbc': ['complete blood count', 'blood count'],
  'hemoglobin': ['hgb', 'hb'],
  'white blood cell': ['wbc', 'leukocyte'],
  'red blood cell': ['rbc', 'erythrocyte'],
  'platelet': ['plt', 'thrombocyte'],

  // Liver Function
  'liver': ['hepatic', 'liver function'],
  'alt': ['alanine aminotransferase', 'sgpt'],
  'ast': ['aspartate aminotransferase', 'sgot'],

  // Kidney Function
  'kidney': ['renal', 'kidney function'],
  'creatinine': ['cr', 'serum creatinine'],
  'bun': ['blood urea nitrogen', 'urea'],
  'egfr': ['estimated gfr', 'glomerular filtration rate'],

  // Thyroid
  'thyroid': ['tsh', 'thyroid function', 't3', 't4'],

  // Vitamins & Minerals
  'vitamin d': ['25-oh vitamin d', 'vitamin d3'],
  'vitamin b12': ['cobalamin', 'b12'],
  'iron': ['ferritin', 'serum iron'],

  // Imaging
  'x-ray': ['xray', 'radiograph', 'radiography'],
  'mri': ['magnetic resonance imaging'],
  'ct scan': ['cat scan', 'computed tomography'],
  'ultrasound': ['sonography', 'sonogram', 'echo'],

  // Medications
  'blood thinner': ['anticoagulant', 'warfarin', 'coumadin'],
  'statin': ['cholesterol medication', 'atorvastatin', 'simvastatin'],
  'antibiotic': ['antibiotics', 'antimicrobial'],

  // Common Conditions
  'infection': ['infectious', 'bacterial', 'viral'],
  'inflammation': ['inflammatory', 'inflamed'],
  'allergy': ['allergic', 'allergies', 'allergen'],

  // Vaccinations
  'vaccine': ['vaccination', 'immunization', 'shot', 'booster'],
  'flu shot': ['influenza vaccine', 'flu vaccine'],
  'covid': ['covid-19', 'coronavirus', 'sars-cov-2'],

  // General Medical Terms
  'prescription': ['rx', 'medication', 'medicine', 'drug'],
  'doctor': ['physician', 'md', 'provider'],
  'appointment': ['visit', 'consultation', 'checkup'],
  'diagnosis': ['diagnosed', 'condition'],
  'treatment': ['therapy', 'management'],
  'symptom': ['symptoms', 'complaint'],
  'test': ['testing', 'exam', 'examination', 'screening'],
  'result': ['results', 'findings', 'outcome'],
  'normal': ['within range', 'wtr', 'wnl', 'within normal limits'],
  'abnormal': ['out of range', 'elevated', 'high', 'low', 'flagged'],
  'chronic': ['long-term', 'ongoing'],
  'acute': ['sudden', 'short-term'],
};