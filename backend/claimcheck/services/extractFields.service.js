export function extractPolicyFields(text) {
  const vehicleNumber = matchAny(text, [
    /(vehicle|bike|car)\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    /registration\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
  ]);

  return {
    ownerName: matchAny(text, [
      /owner\s*name\s*:\s*(.*)/i,
      /insured\s*name\s*:\s*(.*)/i,
      /name\s*:\s*(.*)/i,
    ]),
    policyNumber: matchAny(text, [
      /policy\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
      /policy\s*id\s*:\s*([A-Z0-9-]+)/i,
    ]),
    policyValidFrom: matchAny(text, [
      /(valid\s*from|policy\s*start|start\s*date)\s*:\s*([0-9/.-]+)/i,
    ]),
    policyValidTill: matchAny(text, [
      /(valid\s*(till|to)|policy\s*end|end\s*date)\s*:\s*([0-9/.-]+)/i,
    ]),
    vehicleNumber,
    bikeNumber: vehicleNumber,
    chassisNumber: matchAny(text, [
      /chassis\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    engineNumber: matchAny(text, [
      /engine\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    landLocation: matchAny(text, [
      /land\s*(location|address)\s*:\s*(.*)/i,
      /farm\s*(location|address)\s*:\s*(.*)/i,
    ]),
    surveyNumber: matchAny(text, [
      /survey\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    cropType: matchAny(text, [
      /crop\s*type\s*:\s*(.*)/i,
      /crop\s*name\s*:\s*(.*)/i,
    ]),
    businessName: matchAny(text, [
      /business\s*name\s*:\s*(.*)/i,
      /firm\s*name\s*:\s*(.*)/i,
      /company\s*name\s*:\s*(.*)/i,
    ]),
    businessLocation: matchAny(text, [
      /business\s*(location|address)\s*:\s*(.*)/i,
      /shop\s*(location|address)\s*:\s*(.*)/i,
      /warehouse\s*(location|address)\s*:\s*(.*)/i,
    ]),
    propertyAddress: matchAny(text, [
      /property\s*(address|location)\s*:\s*(.*)/i,
      /house\s*(address|location)\s*:\s*(.*)/i,
    ]),
    companyName: matchAny(text, [
      /company\s*name\s*:\s*(.*)/i,
      /organization\s*name\s*:\s*(.*)/i,
    ]),
    domainName: matchAny(text, [
      /domain\s*name\s*:\s*([A-Z0-9.-]+)/i,
      /website\s*:\s*([A-Z0-9.-]+)/i,
    ]),
    patientName: matchAny(text, [
      /patient\s*name\s*:\s*(.*)/i,
      /insured\s*person\s*:\s*(.*)/i,
    ]),
    hospitalName: matchAny(text, [
      /hospital\s*name\s*:\s*(.*)/i,
      /clinic\s*name\s*:\s*(.*)/i,
    ]),
  };
}

export function extractFIRFields(text) {
  const vehicleNumber = matchAny(text, [
    /(vehicle|bike|car)\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    /registration\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
  ]);

  return {
    incident: matchAny(text, [
      /(accident|theft|fire|flood|damage|loss|cyber|hospitalization|injury|collision)/i,
      /incident\s*type\s*:\s*(.*)/i,
    ]),
    incidentDate: matchAny(text, [
      /(date\s*of\s*incident|incident\s*date|date)\s*:\s*([0-9/.-]+)/i,
    ]),
    ownerName: matchAny(text, [
      /owner\s*name\s*:\s*(.*)/i,
      /complainant\s*name\s*:\s*(.*)/i,
    ]),
    vehicleNumber,
    bikeNumber: vehicleNumber,
    chassisNumber: matchAny(text, [
      /chassis\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    engineNumber: matchAny(text, [
      /engine\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    policyNumber: matchAny(text, [
      /policy\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
      /policy\s*id\s*:\s*([A-Z0-9-]+)/i,
    ]),
    location: matchAny(text, [
      /(location|place of incident|place)\s*:\s*(.*)/i,
    ]),
    landLocation: matchAny(text, [
      /land\s*(location|address)\s*:\s*(.*)/i,
      /farm\s*(location|address)\s*:\s*(.*)/i,
    ]),
    surveyNumber: matchAny(text, [
      /survey\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    cropType: matchAny(text, [
      /crop\s*type\s*:\s*(.*)/i,
      /crop\s*name\s*:\s*(.*)/i,
    ]),
    businessName: matchAny(text, [
      /business\s*name\s*:\s*(.*)/i,
      /firm\s*name\s*:\s*(.*)/i,
      /company\s*name\s*:\s*(.*)/i,
    ]),
    businessLocation: matchAny(text, [
      /business\s*(location|address)\s*:\s*(.*)/i,
      /shop\s*(location|address)\s*:\s*(.*)/i,
    ]),
    propertyAddress: matchAny(text, [
      /property\s*(address|location)\s*:\s*(.*)/i,
      /house\s*(address|location)\s*:\s*(.*)/i,
    ]),
    companyName: matchAny(text, [
      /company\s*name\s*:\s*(.*)/i,
      /organization\s*name\s*:\s*(.*)/i,
    ]),
    domainName: matchAny(text, [
      /domain\s*name\s*:\s*([A-Z0-9.-]+)/i,
      /website\s*:\s*([A-Z0-9.-]+)/i,
    ]),
    patientName: matchAny(text, [
      /patient\s*name\s*:\s*(.*)/i,
      /insured\s*person\s*:\s*(.*)/i,
    ]),
    hospitalName: matchAny(text, [
      /hospital\s*name\s*:\s*(.*)/i,
      /clinic\s*name\s*:\s*(.*)/i,
    ]),
  };
}

function matchAny(text, regexes) {
  for (const regex of regexes) {
    const m = text.match(regex);
    if (m) {
      return m[3] || m[2] || m[1] || null;
    }
  }
  return null;
}
