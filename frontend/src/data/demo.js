export const demoPatient = {
  id: 'patient-demo-001',
  name: 'Aarav Sharma',
  age: 42,
  allergies: ['Penicillin'],
  allergyStatus: 'recorded',
  medications: [
    { id: 'med-1', name: 'Metformin', strength: '500 mg', route: 'Oral', frequency: 'Twice daily', time: '08:00 AM', prescriber: 'Dr. Meera Rao', startDate: '12 Oct 2026', status: 'Active', ingredient: 'metformin' },
    { id: 'med-2', name: 'Vitamin D3', strength: '1000 IU', route: 'Oral', frequency: 'Once daily', time: '09:00 AM', prescriber: 'Dr. Meera Rao', startDate: '02 Oct 2026', status: 'Active', ingredient: 'cholecalciferol' },
    { id: 'med-3', name: 'Atorvastatin', strength: '10 mg', route: 'Oral', frequency: 'Once daily', time: '08:00 PM', prescriber: 'Dr. Arjun Nair', startDate: '20 Sep 2026', status: 'Active', ingredient: 'atorvastatin' }
  ],
  doses: [
    { id: 'dose-1', medicationId: 'med-1', medicine: 'Metformin', dose: '500 mg', time: '08:00 AM', status: 'taken' },
    { id: 'dose-2', medicationId: 'med-2', medicine: 'Vitamin D3', dose: '1000 IU', time: '09:00 AM', status: 'pending' },
    { id: 'dose-3', medicationId: 'med-3', medicine: 'Atorvastatin', dose: '10 mg', time: '08:00 PM', status: 'pending' }
  ]
}

export const demoAlerts = [
  { id: 'alert-1', title: 'Dose awaiting confirmation', detail: 'Vitamin D3 · scheduled for 09:00 AM', time: 'Today, 9:05 AM', status: 'Created', severity: 'info' },
  { id: 'alert-2', title: 'Medication profile updated', detail: 'Atorvastatin was added to your active list', time: 'Yesterday, 4:30 PM', status: 'Delivered', severity: 'info' }
]

export const demoHistory = [
  { id: 1, type: 'Dose recorded', detail: 'Metformin 500 mg marked as taken', actor: 'Aarav Sharma', time: 'Today, 8:03 AM' },
  { id: 2, type: 'Prescription created', detail: 'Atorvastatin 10 mg added to active medication list', actor: 'Dr. Arjun Nair', time: 'Yesterday, 4:30 PM' },
  { id: 3, type: 'Safety check performed', detail: 'Demo rules checked against the current medication list', actor: 'Dr. Meera Rao', time: 'Yesterday, 4:25 PM' },
  { id: 4, type: 'Prescription updated', detail: 'Metformin schedule confirmed as twice daily', actor: 'Dr. Meera Rao', time: '12 Oct 2026, 10:15 AM' }
]
