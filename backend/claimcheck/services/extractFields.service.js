export function extractPolicyFields(text) {
  return {
    ownerName: match(text, /name\s*:\s*(.*)/i),
    bikeNumber: match(text, /bike\s*(no|number)\s*:\s*([A-Z0-9]+)/i),
    landLocation: match(text, /land\s*(location|address)\s*:\s*(.*)/i)
  };
}

export function extractFIRFields(text) {
  return {
    incident: match(text, /(accident|fire|damage|loss)/i),
    bikeNumber: match(text, /vehicle\s*(no|number)\s*:\s*([A-Z0-9]+)/i),
    location: match(text, /(location|place of incident)\s*:\s*(.*)/i)
  };
}

function match(text, regex) {
  const m = text.match(regex);
  return m ? m[2] || m[1] : null;
}
