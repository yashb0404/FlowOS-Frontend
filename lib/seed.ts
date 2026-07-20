import { DataSource, Report } from "./types";

/**
 * Seed data modeled on the real AREPL (Galla Foods) FY26 BRSR & sustainability
 * reporting cycle — SPOCs, KPIs, evidence and assurance requirements taken from
 * the client's data-collation process.
 */
export const seedReports: Report[] = [
  {
    id: "rep-1",
    name: "BRSR Report — AREPL FY26",
    project: "Annual Report Annexure · 9 NGRBC Principles",
    frequency: "one-time",
    status: "collecting",
    regulation: "SEBI LODR Reg. 34(2)(f) · BRSR format per Master Circular",
    assurance: "reasonable",
  },
  {
    id: "rep-2",
    name: "Sustainability Report — AREPL FY26",
    project: "GRI-indexed · People, Planet, Principles",
    frequency: "one-time",
    status: "collecting",
    regulation: "GRI Standards 2021 (voluntary)",
    assurance: "internal",
  },
  {
    id: "rep-3",
    name: "BRSR Core — Assurance Evidence Pack FY26",
    project: "Third-party reasonable assurance · sample >90%",
    frequency: "one-time",
    status: "collecting",
    regulation: "BRSR Core · SEBI Industry Standards Note",
    assurance: "reasonable",
  },
  {
    id: "rep-4",
    name: "CSR Annual Report — AREPL FY26",
    project: "Board CSR Committee · Schedule VII activities",
    frequency: "one-time",
    status: "collecting",
    regulation: "Companies Act 2013 §135 · Schedule VII",
    assurance: "internal",
  },
  {
    id: "rep-5",
    name: "ESG Data Book — Q1 FY27",
    project: "Quarterly internal ESG tracker",
    frequency: "quarterly",
    status: "collecting",
    regulation: "Internal ESG policy (group sustainability)",
    assurance: "none",
  },
];

export const seedSources: DataSource[] = [
  // ── Report 1: BRSR — the 10 real AREPL SPOCs from the client email ──
  { id: "ds-1", reportId: "rep-1", label: "Data 1", name: "Company Secretary KPIs", department: "Company Secretary", owner: "Ravi Kumar P", dueTick: 16, submitAtTick: 10, status: "pending", remindersSent: 0, expectedFields: ["board_meetings_held", "independent_directors_pct"], flags: [], principle: "Section A/B — Governance", evidence: ["Board minutes", "Committee composition"] },
  { id: "ds-2", reportId: "rep-1", label: "Data 2", name: "Finance KPIs", department: "Finance", owner: "Avinash P", dueTick: 16, submitAtTick: 12, status: "pending", remindersSent: 0, expectedFields: ["turnover_cr", "csr_spend_pct"], flags: [], principle: "P8 — Inclusive growth", evidence: ["Audited P&L", "CSR ledger extract"] },
  { id: "ds-3", reportId: "rep-1", label: "Data 3", name: "Sustainability KPIs", department: "Sustainability", owner: "Mansi S", dueTick: 16, submitAtTick: 9, status: "pending", remindersSent: 0, expectedFields: ["ghg_scope1_tco2e", "ghg_scope2_tco2e"], flags: [], principle: "P6 — Environment", evidence: ["Emission calc workbook", "Fuel purchase invoices"] },
  { id: "ds-4", reportId: "rep-1", label: "Data 4", name: "HR KPIs", department: "HR", owner: "Hima Bindu K", dueTick: 16, submitAtTick: 18, status: "pending", remindersSent: 0, expectedFields: ["total_employees", "training_coverage_pct"], flags: [], principle: "P3 — Employee well-being", evidence: ["HRMS headcount export", "Training register"] },
  { id: "ds-5", reportId: "rep-1", label: "Data 5", name: "CSR KPIs", department: "CSR", owner: "Bala Subrahmanyam B", dueTick: 16, submitAtTick: null, status: "pending", remindersSent: 0, expectedFields: ["csr_projects", "beneficiaries"], flags: [], principle: "P8 — Inclusive growth", evidence: ["Project completion certificates"] },
  { id: "ds-6", reportId: "rep-1", label: "Data 6", name: "Marketing KPIs", department: "Marketing", owner: "Pavan Kumar D", dueTick: 16, submitAtTick: 14, status: "pending", remindersSent: 0, expectedFields: ["consumer_complaints", "complaints_resolved_pct"], flags: [], principle: "P9 — Consumer value", evidence: ["Complaint register", "CRM export"] },
  { id: "ds-7", reportId: "rep-1", label: "Data 7", name: "Procurement KPIs", department: "Procurement", owner: "Prasanna D", dueTick: 16, submitAtTick: 17, status: "pending", remindersSent: 0, expectedFields: ["msme_sourcing_pct", "local_sourcing_pct"], flags: [], principle: "P8 — Inclusive growth", evidence: ["Vendor master", "PO summary"] },
  { id: "ds-8", reportId: "rep-1", label: "Data 8", name: "HSE KPIs", department: "HSE", owner: "Palla Satish", dueTick: 16, submitAtTick: 15, status: "pending", remindersSent: 0, expectedFields: ["ltifr", "safety_incidents"], flags: [], principle: "P3 — Employee well-being", evidence: ["Incident register", "Safety audit report"] },
  { id: "ds-9", reportId: "rep-1", label: "Data 9", name: "Energy KPIs", department: "Energy", owner: "Kondala Santhoshkumar", dueTick: 16, submitAtTick: 16, status: "pending", remindersSent: 0, expectedFields: ["energy_consumed_gj", "renewable_energy_pct"], flags: [], principle: "P6 — Environment", evidence: ["Utility bills", "Meter logs"] },
  { id: "ds-10", reportId: "rep-1", label: "Data 10", name: "IT KPIs", department: "IT", owner: "Ramesh Kumar O", dueTick: 16, submitAtTick: 13, status: "pending", remindersSent: 0, expectedFields: ["data_breaches", "privacy_complaints"], flags: [], principle: "P9 — Consumer value", evidence: ["Security incident log"] },

  // ── Report 2: Sustainability Report (GRI) — content packs from the same SPOCs ──
  { id: "ds-11", reportId: "rep-2", label: "Data 1", name: "Materiality Assessment", department: "Sustainability", owner: "Mansi S", dueTick: 28, submitAtTick: 24, status: "pending", remindersSent: 0, expectedFields: ["material_topics", "stakeholders_engaged"], flags: [], principle: "GRI 3 — Material topics", evidence: ["Stakeholder survey results"] },
  { id: "ds-12", reportId: "rep-2", label: "Data 2", name: "Environmental Metrics Pack", department: "Energy", owner: "Kondala Santhoshkumar", dueTick: 28, submitAtTick: 30, status: "pending", remindersSent: 0, expectedFields: ["water_withdrawal_kl", "waste_recycled_pct"], flags: [], principle: "GRI 303/306 — Water & waste", evidence: ["Water meter logs", "Waste manifest"] },
  { id: "ds-13", reportId: "rep-2", label: "Data 3", name: "Social Metrics Pack", department: "HR", owner: "Hima Bindu K", dueTick: 28, submitAtTick: 31, status: "pending", remindersSent: 0, expectedFields: ["women_workforce_pct", "grievances_resolved"], flags: [], principle: "GRI 401/406 — People", evidence: ["Diversity report", "Grievance register"] },
  { id: "ds-14", reportId: "rep-2", label: "Data 4", name: "Governance Disclosures", department: "Company Secretary", owner: "Ravi Kumar P", dueTick: 28, submitAtTick: 27, status: "pending", remindersSent: 0, expectedFields: ["ethics_trainings", "policy_updates"], flags: [], principle: "GRI 2 — Governance", evidence: ["Policy register"] },

  // ── Report 3: BRSR Core assurance evidence — what the external assurer samples ──
  { id: "ds-15", reportId: "rep-3", label: "Data 1", name: "Energy & Emissions Evidence", department: "Energy", owner: "Kondala Santhoshkumar", dueTick: 36, submitAtTick: 38, status: "pending", remindersSent: 0, expectedFields: ["utility_invoices_count", "meter_log_months"], flags: [], principle: "BRSR Core — Attr. 1 (GHG)", evidence: ["12× APSPDCL invoices", "DG fuel receipts"] },
  { id: "ds-16", reportId: "rep-3", label: "Data 2", name: "Safety Records Evidence", department: "HSE", owner: "Palla Satish", dueTick: 36, submitAtTick: 37, status: "pending", remindersSent: 0, expectedFields: ["incident_reports_count", "manhours_lakhs"], flags: [], principle: "BRSR Core — Attr. 4 (Safety)", evidence: ["Form 27 filings", "Incident close-outs"] },
  { id: "ds-17", reportId: "rep-3", label: "Data 3", name: "Payroll & Benefits Evidence", department: "HR", owner: "Hima Bindu K", dueTick: 36, submitAtTick: 36, status: "pending", remindersSent: 0, expectedFields: ["pf_coverage_pct", "wage_records_months"], flags: [], principle: "BRSR Core — Attr. 3 (Wages)", evidence: ["PF ECR challans", "Payroll extract"] },
  { id: "ds-18", reportId: "rep-3", label: "Data 4", name: "Utility Invoices — APSPDCL", department: "External Vendor", owner: "APSPDCL (discom)", dueTick: 36, submitAtTick: null, status: "pending", remindersSent: 0, expectedFields: ["duplicate_invoice_set"], flags: [], principle: "BRSR Core — Attr. 1 (GHG)", evidence: ["Certified duplicate bills"] },

  // ── Report 4: CSR Annual Report — Companies Act §135 ──
  { id: "ds-19", reportId: "rep-4", label: "Data 1", name: "CSR Project Register", department: "CSR", owner: "Bala Subrahmanyam B", dueTick: 24, submitAtTick: 26, status: "pending", remindersSent: 0, expectedFields: ["projects_completed", "ongoing_projects"], flags: [], principle: "Schedule VII activities", evidence: ["Project MOUs", "Photo documentation"] },
  { id: "ds-20", reportId: "rep-4", label: "Data 2", name: "CSR Spend Ledger", department: "Finance", owner: "Avinash P", dueTick: 24, submitAtTick: 25, status: "pending", remindersSent: 0, expectedFields: ["csr_obligation_lakhs", "csr_spent_lakhs"], flags: [], principle: "§135(5) — 2% obligation", evidence: ["Ledger extract", "Utilization certificates"] },
  { id: "ds-21", reportId: "rep-4", label: "Data 3", name: "Impact Assessment", department: "External Agency", owner: "SoulAce Consulting", dueTick: 26, submitAtTick: 29, status: "pending", remindersSent: 0, expectedFields: ["projects_assessed", "impact_score", "beneficiary_reach"], flags: [], principle: "CSR Rules 2021 — impact assessment", evidence: ["Signed assessment report"] },

  // ── Report 5: quarterly ESG data book — fast, clean tracker ──
  { id: "ds-22", reportId: "rep-5", label: "Data 1", name: "Energy & Water Tracker", department: "Energy", owner: "Kondala Santhoshkumar", dueTick: 3, submitAtTick: 3, status: "pending", remindersSent: 0, expectedFields: ["energy_gj_q1", "water_kl_q1"], flags: [], principle: "Internal ESG KPI set", evidence: ["Monthly meter summary"] },
  { id: "ds-23", reportId: "rep-5", label: "Data 2", name: "Emissions Tracker", department: "Sustainability", owner: "Mansi S", dueTick: 3, submitAtTick: 4, status: "pending", remindersSent: 0, expectedFields: ["scope1_q1_tco2e", "scope2_q1_tco2e"], flags: [], principle: "Internal ESG KPI set", evidence: ["Calc workbook Q1"] },
  { id: "ds-24", reportId: "rep-5", label: "Data 3", name: "Safety & Incident Tracker", department: "HSE", owner: "Palla Satish", dueTick: 5, submitAtTick: 6, status: "pending", remindersSent: 0, expectedFields: ["incidents_q1", "near_misses_q1"], flags: [], principle: "Internal ESG KPI set", evidence: ["Incident register Q1"] },
];

/**
 * What the Extraction Agent "finds" in each submitted sheet.
 * Deliberate exceptions: ds-4 missing training coverage (validation flag),
 * ds-8 & ds-12 & ds-20 drift vs the reference system (reconciliation flags),
 * ds-5 and ds-18 never arrive (human alerts).
 */
export const submittedData: Record<string, Record<string, number>> = {
  // BRSR
  "ds-1": { board_meetings_held: 6, independent_directors_pct: 50 },
  "ds-2": { turnover_cr: 842, csr_spend_pct: 2.1 },
  "ds-3": { ghg_scope1_tco2e: 3120, ghg_scope2_tco2e: 5480 },
  "ds-4": { total_employees: 1462 }, // training_coverage_pct missing → validation flag
  "ds-6": { consumer_complaints: 38, complaints_resolved_pct: 97 },
  "ds-7": { msme_sourcing_pct: 31, local_sourcing_pct: 64 },
  "ds-8": { ltifr: 0.4, safety_incidents: 3 }, // register says 5 → recon flag
  "ds-9": { energy_consumed_gj: 148200, renewable_energy_pct: 22 },
  "ds-10": { data_breaches: 0, privacy_complaints: 1 },
  // Sustainability Report
  "ds-11": { material_topics: 14, stakeholders_engaged: 220 },
  "ds-12": { water_withdrawal_kl: 96400, waste_recycled_pct: 78 }, // meter says 91,800 → recon flag
  "ds-13": { women_workforce_pct: 27, grievances_resolved: 12 },
  "ds-14": { ethics_trainings: 9, policy_updates: 4 },
  // Assurance pack
  "ds-15": { utility_invoices_count: 12, meter_log_months: 12 },
  "ds-16": { incident_reports_count: 5, manhours_lakhs: 31 },
  "ds-17": { pf_coverage_pct: 100, wage_records_months: 12 },
  // CSR report
  "ds-19": { projects_completed: 11, ongoing_projects: 4 },
  "ds-20": { csr_obligation_lakhs: 168, csr_spent_lakhs: 176 }, // books say 181 → recon flag
  "ds-21": { projects_assessed: 6, impact_score: 8 }, // beneficiary_reach missing → validation flag
  // ESG data book
  "ds-22": { energy_gj_q1: 36900, water_kl_q1: 22400 },
  "ds-23": { scope1_q1_tco2e: 760, scope2_q1_tco2e: 1310 },
  "ds-24": { incidents_q1: 1, near_misses_q1: 6 },
};

/** Reference system snapshot (ERP / HSE register / audited books) for reconciliation. */
export const erpSnapshot: Record<string, Record<string, number>> = {
  "ds-1": { board_meetings_held: 6, independent_directors_pct: 50 },
  "ds-2": { turnover_cr: 842, csr_spend_pct: 2.1 },
  "ds-3": { ghg_scope1_tco2e: 3120, ghg_scope2_tco2e: 5480 },
  "ds-4": { total_employees: 1462 },
  "ds-6": { consumer_complaints: 38, complaints_resolved_pct: 97 },
  "ds-7": { msme_sourcing_pct: 31, local_sourcing_pct: 64 },
  "ds-8": { ltifr: 0.4, safety_incidents: 5 }, // HSE register
  "ds-9": { energy_consumed_gj: 148200, renewable_energy_pct: 22 },
  "ds-10": { data_breaches: 0, privacy_complaints: 1 },
  "ds-11": { material_topics: 14, stakeholders_engaged: 220 },
  "ds-12": { water_withdrawal_kl: 91800, waste_recycled_pct: 78 }, // flow-meter logs
  "ds-13": { women_workforce_pct: 27, grievances_resolved: 12 },
  "ds-14": { ethics_trainings: 9, policy_updates: 4 },
  "ds-15": { utility_invoices_count: 12, meter_log_months: 12 },
  "ds-16": { incident_reports_count: 5, manhours_lakhs: 31 },
  "ds-17": { pf_coverage_pct: 100, wage_records_months: 12 },
  "ds-19": { projects_completed: 11, ongoing_projects: 4 },
  "ds-20": { csr_obligation_lakhs: 168, csr_spent_lakhs: 181 }, // audited books
  "ds-21": { projects_assessed: 6, impact_score: 8 },
  "ds-22": { energy_gj_q1: 36900, water_kl_q1: 22400 },
  "ds-23": { scope1_q1_tco2e: 760, scope2_q1_tco2e: 1310 },
  "ds-24": { incidents_q1: 1, near_misses_q1: 6 },
};

/** FY25 comparatives (from the prior-year BRSR/SR) for year-on-year deltas in generated reports. */
export const priorYearData: Record<string, number> = {
  board_meetings_held: 5, independent_directors_pct: 50, turnover_cr: 761, csr_spend_pct: 2.0,
  ghg_scope1_tco2e: 3390, ghg_scope2_tco2e: 5720, total_employees: 1378, training_coverage_pct: 78,
  csr_projects: 12, beneficiaries: 41000, consumer_complaints: 45, complaints_resolved_pct: 94,
  msme_sourcing_pct: 27, local_sourcing_pct: 61, ltifr: 0.6, safety_incidents: 6,
  energy_consumed_gj: 152400, renewable_energy_pct: 18, data_breaches: 0, privacy_complaints: 2,
  material_topics: 12, stakeholders_engaged: 180, water_withdrawal_kl: 98200, waste_recycled_pct: 71,
  women_workforce_pct: 24, grievances_resolved: 9, ethics_trainings: 7, policy_updates: 3,
  incident_reports_count: 6, manhours_lakhs: 29, projects_completed: 9, ongoing_projects: 5,
  csr_obligation_lakhs: 152, csr_spent_lakhs: 155, projects_assessed: 4, impact_score: 7,
};
