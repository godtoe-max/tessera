/** Deterministic development records used by the initial migration/seed command after Netlify is linked. */
export const seedOrganizations=[
  {name:"Acme Corp",slug:"acme-corp"},
  {name:"Northstar Foods",slug:"northstar-foods"},
  {name:"Greenline Energy",slug:"greenline-energy"},
  {name:"Vantage Health",slug:"vantage-health"},
] as const;

export const seedProjects=[
  {organizationSlug:"acme-corp",name:"ERP modernization",slug:"erp-modernization"},
  {organizationSlug:"acme-corp",name:"Finance transformation",slug:"finance-transformation"},
  {organizationSlug:"northstar-foods",name:"Controls optimization",slug:"controls-optimization"},
  {organizationSlug:"greenline-energy",name:"Analytics enablement",slug:"analytics-enablement"},
  {organizationSlug:"vantage-health",name:"Platform assessment",slug:"platform-assessment"},
] as const;
