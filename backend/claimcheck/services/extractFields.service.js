const DATE_VALUE = "[0-9]{1,4}[A-Z0-9/ .-]*[0-9]{2,4}";

export function extractPolicyFields(text) {
  const source = normalizeExtractText(text);
  const vehicleNumber = matchAny(source, [
    /(vehicle|bike|car)\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    /(vehicle\s*)?(registration|regn|reg)\s*(no|number|mark)\s*:\s*([A-Z0-9 -]+)/i,
    /registration\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
  ]);

  return {
    ownerName: matchAny(source, [
      /policy\s*holder\s*name\s*:\s*(.*)/i,
      /policyholder\s*name\s*:\s*(.*)/i,
      /name\s*of\s*(insured|policyholder)\s*:\s*(.*)/i,
      /insured'?s\s*name\s*:\s*(.*)/i,
      /owner\s*name\s*:\s*(.*)/i,
      /insured\s*name\s*:\s*(.*)/i,
      /name\s*:\s*(.*)/i,
    ]),
    policyNumber: matchAny(source, [
      /policy\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
      /policy\s*id\s*:\s*([A-Z0-9-]+)/i,
    ]),
    policyValidFrom: matchAny(source, [
      new RegExp(`(valid\\s*from|policy\\s*start|start\\s*date)\\s*:\\s*(${DATE_VALUE})`, "i"),
      new RegExp(`policy\\s*validity\\s*:\\s*(${DATE_VALUE})\\s*(?:to|-|until|till)\\s*${DATE_VALUE}`, "i"),
    ]),
    policyValidTill: matchAny(source, [
      new RegExp(`(valid\\s*(till|to)|policy\\s*end|end\\s*date)\\s*:\\s*(${DATE_VALUE})`, "i"),
      new RegExp(`policy\\s*validity\\s*:\\s*${DATE_VALUE}\\s*(?:to|-|until|till)\\s*(${DATE_VALUE})`, "i"),
    ]),
    vehicleNumber,
    bikeNumber: vehicleNumber,
    chassisNumber: matchAny(source, [
      /chassis\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    engineNumber: matchAny(source, [
      /engine\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    landLocation: matchAny(source, [
      /land\s*(location|address)\s*:\s*(.*)/i,
      /farm\s*(location|address)\s*:\s*(.*)/i,
    ]),
    surveyNumber: matchAny(source, [
      /survey\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    cropType: matchAny(source, [
      /crop\s*type\s*:\s*(.*)/i,
      /crop\s*name\s*:\s*(.*)/i,
    ]),
    businessName: matchAny(source, [
      /business\s*name\s*:\s*(.*)/i,
      /firm\s*name\s*:\s*(.*)/i,
      /company\s*name\s*:\s*(.*)/i,
    ]),
    businessLocation: matchAny(source, [
      /business\s*(location|address)\s*:\s*(.*)/i,
      /shop\s*(location|address)\s*:\s*(.*)/i,
      /warehouse\s*(location|address)\s*:\s*(.*)/i,
    ]),
    propertyAddress: matchAny(source, [
      /property\s*(address|location)\s*:\s*(.*)/i,
      /house\s*(address|location)\s*:\s*(.*)/i,
    ]),
    companyName: matchAny(source, [
      /company\s*name\s*:\s*(.*)/i,
      /organization\s*name\s*:\s*(.*)/i,
    ]),
    domainName: matchAny(source, [
      /domain\s*name\s*:\s*([A-Z0-9.-]+)/i,
      /website\s*:\s*([A-Z0-9.-]+)/i,
    ]),
    patientName: matchAny(source, [
      /patient\s*name\s*:\s*(.*)/i,
      /insured\s*person\s*:\s*(.*)/i,
    ]),
    hospitalName: matchAny(source, [
      /hospital\s*name\s*:\s*(.*)/i,
      /clinic\s*name\s*:\s*(.*)/i,
    ]),
  };
}

export function extractFIRFields(text) {
  const source = normalizeExtractText(text);
  const vehicleNumber = matchAny(source, [
    /(vehicle|bike|car)\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    /(vehicle\s*)?(registration|regn|reg)\s*(no|number|mark)\s*:\s*([A-Z0-9 -]+)/i,
    /registration\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
  ]);

  return {
    incident: matchAny(source, [
      /incident\s*type\s*:\s*(.*)/i,
      /incident\s*:\s*(.*)/i,
      /(accident|theft|fire|flood|damage|loss|cyber|hospitalization|injury|collision)/i,
    ]),
    incidentDate: matchAny(source, [
      new RegExp(`(date\\s*of\\s*incident|incident\\s*date|date)\\s*:\\s*(${DATE_VALUE})`, "i"),
    ]),
    ownerName: matchAny(source, [
      /owner\s*name\s*:\s*(.*)/i,
      /complainant\s*name\s*:\s*(.*)/i,
    ]),
    vehicleNumber,
    bikeNumber: vehicleNumber,
    chassisNumber: matchAny(source, [
      /chassis\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    engineNumber: matchAny(source, [
      /engine\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    policyNumber: matchAny(source, [
      /policy\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
      /policy\s*id\s*:\s*([A-Z0-9-]+)/i,
    ]),
    location: matchAny(source, [
      /(location|place of incident|place)\s*:\s*(.*)/i,
    ]),
    landLocation: matchAny(source, [
      /land\s*(location|address)\s*:\s*(.*)/i,
      /farm\s*(location|address)\s*:\s*(.*)/i,
    ]),
    surveyNumber: matchAny(source, [
      /survey\s*(no|number)\s*:\s*([A-Z0-9-]+)/i,
    ]),
    cropType: matchAny(source, [
      /crop\s*type\s*:\s*(.*)/i,
      /crop\s*name\s*:\s*(.*)/i,
    ]),
    businessName: matchAny(source, [
      /business\s*name\s*:\s*(.*)/i,
      /firm\s*name\s*:\s*(.*)/i,
      /company\s*name\s*:\s*(.*)/i,
    ]),
    businessLocation: matchAny(source, [
      /business\s*(location|address)\s*:\s*(.*)/i,
      /shop\s*(location|address)\s*:\s*(.*)/i,
    ]),
    propertyAddress: matchAny(source, [
      /property\s*(address|location)\s*:\s*(.*)/i,
      /house\s*(address|location)\s*:\s*(.*)/i,
    ]),
    companyName: matchAny(source, [
      /company\s*name\s*:\s*(.*)/i,
      /organization\s*name\s*:\s*(.*)/i,
    ]),
    domainName: matchAny(source, [
      /domain\s*name\s*:\s*([A-Z0-9.-]+)/i,
      /website\s*:\s*([A-Z0-9.-]+)/i,
    ]),
    patientName: matchAny(source, [
      /patient\s*name\s*:\s*(.*)/i,
      /insured\s*person\s*:\s*(.*)/i,
    ]),
    hospitalName: matchAny(source, [
      /hospital\s*name\s*:\s*(.*)/i,
      /clinic\s*name\s*:\s*(.*)/i,
    ]),
  };
}

function matchAny(text, regexes) {
  for (const regex of regexes) {
    const m = text.match(regex);
    if (m) {
      const value =
        [...m].slice(1).reverse().find((part) => part !== undefined) || null;
      return typeof value === "string" ? cleanValue(value) : value;
    }
  }
  return null;
}

function normalizeExtractText(text = "") {
  return text
    .replace(/\r/g, "\n")
    .replace(/Loca\s*[Ɵt]\s*on/gi, "Location")
    .replace(/[ \t]+\n/g, "\n");
}

function cleanValue(value) {
  return value.replace(/\s+/g, " ").replace(/\s+([-/])/g, "$1").trim();
}
