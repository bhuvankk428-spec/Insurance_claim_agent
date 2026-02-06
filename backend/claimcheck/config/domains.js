export const DOMAIN_RULES = {
  automobile: {
    assetMatch: ["vehicleNumber"],
    optionalMatch: ["ownerName", "chassisNumber", "engineNumber", "policyNumber"],
  },
  bike: {
    assetMatch: ["vehicleNumber"],
    optionalMatch: ["ownerName", "chassisNumber", "engineNumber", "policyNumber"],
  },
  crop: {
    assetMatch: ["landLocation"],
    optionalMatch: ["ownerName", "surveyNumber", "cropType", "policyNumber"],
  },
  business_property: {
    assetMatch: ["businessLocation"],
    optionalMatch: ["businessName", "propertyAddress", "policyNumber"],
  },
  property: {
    assetMatch: ["propertyAddress"],
    optionalMatch: ["ownerName", "policyNumber"],
  },
  cyber: {
    assetMatch: ["companyName"],
    optionalMatch: ["domainName", "policyNumber"],
  },
  health: {
    assetMatch: ["patientName"],
    optionalMatch: ["policyNumber", "hospitalName"],
  },
};
