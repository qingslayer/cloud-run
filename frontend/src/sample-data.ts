import { DocumentFile } from './types';

// A small, transparent 1x1 pixel PNG as a placeholder, converted to Base64.
// In a real app, you might have small thumbnails or specific file previews.
const base64PlaceholderImage = 'data:image/jpeg;base64,/9j/4AAQSkJRgABAQEASABIAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXFhUaHhoYHh4jJCUnIyYnLzU5OjlFPjw8Pj8/Pz//2wBDAQYFBgsJCgsOCw4OFB4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wgARCAA4AFADAREAAhEBAxEB/8QAGQABAQEBAQEAAAAAAAAAAAAAAwECBAAF/8QAFwEBAQEBAAAAAAAAAAAAAAAAAAECA//aAAwDAQACEAMQAAABj3yJ2dNS6s6a5a+sNctNQRuelxs6bFm3NrNs2s25dLi2zSw0sNLDS0s2sNLDSws/8QAHBAAAwACAwEBAAAAAAAAAAAAAQIDABEEEiET/9oACAEBAAEFAvHr42vPYiIZby7F5a2s892s92s92s92s93M89ovaX9pexfaaKaKaKaKaKaKaKaP/8AAcEQACAgMBAQAAAAAAAAAAAAAAAQIREBIgIUH/2gAIAQMBAT8Bol4yXLxy/GfropS+uM/XGfropeP/xAAcEQEAAgMAAwAAAAAAAAAAAAAAAQIREBIgIUH/2gAIAQIBAT8Bol40zxl+MvropS+uM/XGfropeP/EACgQAAEDAgUDBQEAAAAAAAAAAAEAAhEDIRIxQVFxECJAQoGRIzL/2gAIAQEABj8C61xVzV/Vf1X9Vf1X9V/Rf0WLWWsWLWLWLWLWLWLWLWLWLWLWLWLWLWLf/8QAHBAAAgIDAQEAAAAAAAAAAAAAAREAITFBUXFh/9oACAEBAAE/IeIVN2dI7eG8t4by3hvLeG8t4by3hvLeG8tYby3hvLeG8t5vlvLeG8t4by3n/2gAMAwEAAgADAAAAEJJJJJJJJJJJJIJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJP//EAB0RAQEBAAIDAQEAAAAAAAAAAAERIQAxQXFRYRD/2gAIAQMBAT8QyGhoaGhoaGhoaGhoaGhoaGhoaGhoaGj/xAAcEQEBAQEAAwEBAQAAAAAAAAAAAREhMRBBUXH/2gAIAQIBAT8QyGhoaGhoaGhoaGhoaGhoaGhoaGhoaGj/xAAgEAEAAgICAgMBAAAAAAAAAAAAAREhMUFRYXGBkaHB/9oACAEBAAE/EPyhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaP/2Q==';

const base64LabReport = 'data:application/pdf;base64,UGF0aWVudDogSm9obiBEb2UNCkRhdGU6IDIwMjQtMDMtMTUNCkRvY3RvciogRHItIEVtaWx5IENhcnRlciANCgpUZXN0OiBDb21wbGV0ZSBCbG9vCBDb3VudCAoQ0JDKQ0KCiMjIyBSZXN1bHRzOg0KCi0gV2hpdGUgQmxvb2QgQ2VsbHMgKFdCQyk6IDEyLjUgWDEwXjkvTF0gKEhpZ2gpDQotIFJlZCBCbG9vCBDb2xscyAoUkJDKTogNS4xIFgxMF4xMi9MDQotIEhlbW9nbG9iaW46IDE1LjIgZy9kTA0KLSBQbGF0ZWxldHM6IDI1MCB4IDEwXjkvTA0KDQojIyMgUmVmZXJlbmNlIFJhbmdlczoNCg0KLSBXQkM6IDQuMCAtIDExLjAgWDEwXjkvTF0NCi0gUkJDOiA0LjUgLSA1LjUgWzEwXjEyL0xdDQotIEhlbW9nbG9iaW46IDEzLjUgLSAxNy41IFtnL2RMXQ0=';

const base64CardiologyReport = 'data:application/pdf;base64,UGF0aWVudDogSmFuZSBTbWl0aApEYXRlOiAyMDI0LTAyLTIwClByb2NlZHVyZTogRWNob2NhcmRpb2dyYW0KRmluZGluZ3M6IE5vcm1hbCBsZWZ0IHZlbnRyaWN1bGFyIHNpemUgYW5kIGZ1bmN0aW9uLiBFamVjdGlvbiBmcmFjdGlvbiBlc3RpbWF0ZWQgYXQgNjAlLiBObyBzaWduaWZpY2FudCB2YWx2dWxhciBhYm5vcm1hbGl0aWVzIG5vdGVkLg=='

const base64Prescription = 'data:application/pdf;base64,UGF0aWVudDogSm9obiBEb2UKUHJlc2NyaXB0aW9uOiBMaXNpbm9wcmlsCkNvbmNlbnRyYXRpb246IDEwIG1nClRpcG86IFRhYmxldApEb3NhZ2U6IE9uZSB0YWJsZXQgZGFpbHkKUXVhbnRpdHk6IDMwIHRhYmxldHMKUmVmaWxsczogMw==';


export const sampleDocuments: DocumentFile[] = [
  {
    id: 'sample-doc-1',
    name: 'chest_xray_report.jpeg',
    title: 'Chest X-Ray - May 10, 2024',
    type: 'image/jpeg',
    size: 56 * 1024, // 56 KB
    base64Data: base64PlaceholderImage,
    previewUrl: base64PlaceholderImage,
    uploadDate: new Date('2024-05-10T09:30:00Z'),
    category: 'Imaging Reports',
    userId: 'demo-user-01',
    extractedText: 'CHEST X-RAY REPORT\n\nPatient: John Doe\nDate: 2024-05-10\n\nFindings: Lungs are clear. No signs of pneumonia or other abnormalities. Heart size is normal.\nImpression: Normal chest x-ray.',
    status: 'complete',
    structuredData: {
      procedure: "Chest X-Ray",
      findings: "Lungs are clear. No signs of pneumonia or other abnormalities. Heart size is normal.",
      impression: "Normal chest x-ray."
    },
    userNotes: 'Follow-up appointment scheduled for next year.'
  },
  {
    id: 'sample-doc-2',
    name: 'lab_results_mar2024.pdf',
    title: 'Complete Blood Count - Mar 15, 2024',
    type: 'application/pdf',
    size: 120 * 1024, // 120 KB
    base64Data: base64LabReport,
    previewUrl: '', // PDFs don't have a direct object URL preview
    uploadDate: new Date('2024-03-15T14:00:00Z'),
    category: 'Lab Results',
    userId: 'demo-user-01',
    extractedText: 'Patient: John Doe\nDate: 2024-03-15\nTest: Complete Blood Count (CBC)\nResults:\n- White Blood Cells (WBC): 12.5 x 10^9/L (High)\n- Red Blood Cells (RBC): 5.1 x 10^12/L\n- Hemoglobin: 15.2 g/dL\n- Platelets: 250 x 10^9/L\nReference Ranges:\n- WBC: 4.0 - 11.0 [10^9/L]\nNotes: WBC count is slightly elevated.',
    status: 'complete',
    structuredData: {
      results: [
        { testName: 'White Blood Cells (WBC)', value: '12.5', unit: 'x 10^9/L', referenceRange: '4.0 - 11.0' },
        { testName: 'Red Blood Cells (RBC)', value: '5.1', unit: 'x 10^12/L', referenceRange: '4.5 - 5.5' },
        { testName: 'Hemoglobin', value: '15.2', unit: 'g/dL', referenceRange: '13.5 - 17.5' },
        { testName: 'Platelets', value: '250', unit: 'x 10^9/L', referenceRange: '150 - 450' },
      ]
    }
  },
  {
    id: 'sample-doc-3',
    name: 'cardiology_echo_feb2024.pdf',
    title: 'Echocardiogram Report - Feb 22, 2024',
    type: 'application/pdf',
    size: 95 * 1024, // 95 KB
    base64Data: base64CardiologyReport,
    previewUrl: '',
    uploadDate: new Date('2024-02-22T11:45:00Z'),
    category: 'Imaging Reports',
    userId: 'demo-user-01',
    extractedText: 'Patient: Jane Smith\nDate: 2024-02-20\nProcedure: Echocardiogram\nFindings: Normal left ventricular size and function. Ejection fraction estimated at 60%. No significant valvular abnormalities noted.',
    status: 'review',
    structuredData: {
      procedure: "Echocardiogram",
      findings: "Normal left ventricular size and function. Ejection fraction estimated at 60%. No significant valvular abnormalities noted.",
      impression: "Normal echocardiogram.",
    },
    userNotes: 'Awaiting cardiologist notes from the consultation.'
  },
  {
    id: 'sample-doc-4',
    name: 'lisinopril_prescription.pdf',
    title: 'Lisinopril Prescription - May 1, 2024',
    type: 'application/pdf',
    size: 45 * 1024, // 45 KB
    base64Data: base64Prescription,
    previewUrl: '',
    uploadDate: new Date('2024-05-01T16:20:00Z'),
    category: 'Prescriptions',
    userId: 'demo-user-01',
    extractedText: 'Patient: John Doe\nPrescription: Lisinopril\nStrength: 10 mg\nForm: Tablet\nDosage: One tablet daily\nQuantity: 30 tablets\nRefills: 3',
    status: 'complete',
    structuredData: {
      prescriptions: [
        { medication: 'Lisinopril', dosage: '10 mg', frequency: 'One tablet daily', instructions: 'Take in the morning with food.'}
      ]
    },
  },
];