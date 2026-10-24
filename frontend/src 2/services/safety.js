// Simulated, deliberately small rule set for the demo.
// It is NOT a clinical database. Replace with the backend interaction service
// (Bedrock / Comprehend Medical / Step Functions) when the API is connected.

const norm = (s) => (s || '').trim().toLowerCase()

const ALLERGY_CLASSES = {
  penicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'flucloxacillin', 'cloxacillin', 'piperacillin', 'benzylpenicillin'],
  sulfa: ['sulfamethoxazole', 'sulfadiazine', 'sulfasalazine'],
  nsaid: ['ibuprofen', 'naproxen', 'diclofenac', 'aspirin', 'ketorolac']
}

const INTERACTIONS = [
  { a: 'atorvastatin', b: 'clarithromycin', severity: 'major', note: 'May raise statin levels and increase the risk of muscle injury.' },
  { a: 'atorvastatin', b: 'gemfibrozil', severity: 'major', note: 'Combined use increases the risk of muscle-related side effects.' },
  { a: 'metformin', b: 'cimetidine', severity: 'moderate', note: 'May increase metformin exposure; monitoring may be needed.' },
  { a: 'warfarin', b: 'aspirin', severity: 'major', note: 'Additive bleeding risk.' },
  { a: 'warfarin', b: 'ibuprofen', severity: 'major', note: 'Additive bleeding risk.' },
  { a: 'cholecalciferol', b: 'hydrochlorothiazide', severity: 'moderate', note: 'Can contribute to raised calcium levels.' },
  { a: 'sildenafil', b: 'nitroglycerin', severity: 'major', note: 'Can cause a severe drop in blood pressure.' }
]

export const severityRank = { none: 0, moderate: 1, major: 2, high: 3 }

export function checkMedication({ name, ingredient }, patient, activeMedications) {
  const ing = norm(ingredient)
  const findings = []
  if (!norm(name) || !ing) return { incomplete: true, findings }

  for (const allergy of patient.allergies || []) {
    const key = norm(allergy)
    const family = ALLERGY_CLASSES[key] || [key]
    if (family.includes(ing) || ing === key) {
      findings.push({
        kind: 'allergy',
        severity: 'high',
        title: `Recorded allergy: ${allergy}`,
        detail: `${name} (${ing}) falls under the recorded ${allergy} allergy in this demo rule.`
      })
    }
  }

  for (const med of activeMedications) {
    const other = norm(med.ingredient)
    if (!other) continue
    if (other === ing) {
      findings.push({
        kind: 'duplicate',
        severity: 'moderate',
        title: `Duplicate ingredient: ${med.name}`,
        detail: `${med.name} already contains ${ing}. Taking both may duplicate therapy.`
      })
    }
    for (const rule of INTERACTIONS) {
      if ((rule.a === ing && rule.b === other) || (rule.b === ing && rule.a === other)) {
        findings.push({
          kind: 'interaction',
          severity: rule.severity,
          title: `Possible interaction with ${med.name}`,
          detail: rule.note
        })
      }
    }
  }
  return { incomplete: false, findings }
}

export function worstSeverity(findings) {
  return findings.reduce((w, f) => (severityRank[f.severity] > severityRank[w] ? f.severity : w), 'none')
}