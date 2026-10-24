// Fictional locations and stock for the demo. The real app would use
// Amazon Location Service + OpenSearch for this lookup.
export const demoPlaces = [
    { id: 'ph-1', name: 'GreenLeaf Pharmacy', type: 'Pharmacy', distanceKm: 0.6, address: '12 Lake View Road', hours: 'Open until 10:00 PM', stock: { metformin: 'in', cholecalciferol: 'in', atorvastatin: 'low' } },
    { id: 'ph-2', name: 'CareFirst Medicals', type: 'Pharmacy', distanceKm: 1.2, address: '48 Market Street', hours: 'Open 24 hours', stock: { metformin: 'in', cholecalciferol: 'out', atorvastatin: 'in', amoxicillin: 'in' } },
    { id: 'ho-1', name: 'Riverside General Hospital', type: 'Hospital', distanceKm: 2.4, address: '1 Hospital Avenue', hours: 'Emergency 24 hours', stock: { metformin: 'in', atorvastatin: 'in', cholecalciferol: 'in', clarithromycin: 'in' } },
    { id: 'ph-3', name: 'Wellspring Chemist', type: 'Pharmacy', distanceKm: 3.1, address: '9 Station Road', hours: 'Closed · opens 8:00 AM', stock: { metformin: 'low', cholecalciferol: 'in', atorvastatin: 'out' } },
    { id: 'ho-2', name: 'Unity Community Clinic', type: 'Hospital', distanceKm: 4.8, address: '77 Garden Lane', hours: 'Open until 8:00 PM', stock: { metformin: 'in', atorvastatin: 'low' } }
  ]