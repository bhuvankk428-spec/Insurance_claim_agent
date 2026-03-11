import { DOMAIN_RULES } from "../config/domains.js";

const POLICY_IDENTITY_FIELDS = {
  automobile: [["ownerName"]],
  bike: [["ownerName"]],
  crop: [["ownerName"]],
  property: [["ownerName"]],
  business_property: [["businessName"], ["companyName"]],
  cyber: [["companyName"]],
  health: [["patientName"]],
};

const FIR_REQUIRED_FIELDS = {
  automobile: ["incident", "vehicleNumber"],
  bike: ["incident", "vehicleNumber"],
  crop: ["incident", "landLocation"],
  property: ["incident", "propertyAddress"],
  business_property: ["incident", "businessLocation"],
  cyber: ["incident", "companyName"],
  health: ["incident", "patientName"],
};

function hasValue(value) {
  return typeof value === "string" ? Boolean(value.trim()) : Boolean(value);
}

function formatFieldName(field) {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function collectMissingFields(data, fields = []) {
  return fields.filter((field) => !hasValue(data?.[field]));
}

function collectMissingIdentity(data, identityGroups = []) {
  return identityGroups
    .filter((group) => !group.some((field) => hasValue(data?.[field])))
    .flat();
}

export function validatePolicyDocument(domain, policyData) {
  const rules = DOMAIN_RULES[domain] || DOMAIN_RULES.automobile;
  const missing = [
    ...collectMissingFields(policyData, rules.assetMatch || []),
    ...collectMissingIdentity(
      policyData,
      POLICY_IDENTITY_FIELDS[domain] || POLICY_IDENTITY_FIELDS.automobile
    ),
  ];

  return {
    ok: missing.length === 0,
    missingFields: missing,
    message:
      missing.length === 0
        ? "Policy verified"
        : `Policy missing required details: ${missing
            .map(formatFieldName)
            .join(", ")}`,
  };
}

export function validateFirDocument(domain, firData) {
  const requiredFields =
    FIR_REQUIRED_FIELDS[domain] || FIR_REQUIRED_FIELDS.automobile;
  const missing = collectMissingFields(firData, requiredFields);

  return {
    ok: missing.length === 0,
    missingFields: missing,
    message:
      missing.length === 0
        ? null
        : `Evidence document missing required details: ${missing
            .map(formatFieldName)
            .join(", ")}`,
  };
}
