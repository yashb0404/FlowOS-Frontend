import { DataSource, Report } from "./types";

export const seedReports: Report[] = [
  {
    id: "rep-1",
    name: "Monthly Operations Report — Plant A · July",
    project: "Plant A Operations",
    frequency: "monthly",
    status: "collecting",
  },
  {
    id: "rep-2",
    name: "Q2 Carbon Emissions & Energy Report",
    project: "Corporate Sustainability",
    frequency: "one-time",
    status: "collecting",
  },
  {
    id: "rep-3",
    name: "Weekly Logistics Snapshot — North Region",
    project: "Supply Chain",
    frequency: "weekly",
    status: "collecting",
  },
  {
    id: "rep-4",
    name: "Vendor Compliance Audit — FY26",
    project: "Procurement Governance",
    frequency: "quarterly",
    status: "collecting",
  },
  {
    id: "rep-5",
    name: "Monthly Finance Pack — HQ · July",
    project: "Corporate Finance",
    frequency: "monthly",
    status: "collecting",
  },
  {
    id: "rep-6",
    name: "BRSR Report — AREPL FY26",
    project: "SEBI BRSR · Annual Report Annexure",
    frequency: "one-time",
    status: "collecting",
  },
];

export const seedSources: DataSource[] = [
  // ── Report 1: four data sources, three problem paths ──
  {
    id: "ds-1",
    reportId: "rep-1",
    label: "Data 1",
    name: "Sales Summary",
    department: "Sales",
    owner: "R. Menon",
    dueTick: 1,
    submitAtTick: 3, // arrives after two email follow-ups
    status: "pending",
    remindersSent: 0,
    expectedFields: ["revenue_lakhs", "units_sold"],
    flags: [],
  },
  {
    id: "ds-2",
    reportId: "rep-1",
    label: "Data 2",
    name: "Production Output",
    department: "Production",
    owner: "D. Rao",
    dueTick: 1,
    submitAtTick: 1, // on time, clean — the happy path
    status: "pending",
    remindersSent: 0,
    expectedFields: ["output_units", "downtime_hours"],
    flags: [],
  },
  {
    id: "ds-3",
    reportId: "rep-1",
    label: "Data 3",
    name: "Inventory Position",
    department: "Warehouse",
    owner: "S. Bhatt",
    dueTick: 2,
    submitAtTick: 4, // late AND incomplete → validation flag
    status: "pending",
    remindersSent: 0,
    expectedFields: ["closing_stock", "variance_pct", "damaged_units"],
    flags: [],
  },
  {
    id: "ds-4",
    reportId: "rep-1",
    label: "Data 4",
    name: "Distributor Sales Data",
    department: "External Vendor",
    owner: "Zenith Distributors",
    dueTick: 1,
    submitAtTick: null, // never submits → full ladder → human alert
    status: "pending",
    remindersSent: 0,
    expectedFields: ["distributor_sales_lakhs"],
    flags: [],
  },

  // ── Report 2: two clean sources — shows the gate opening automatically ──
  {
    id: "ds-5",
    reportId: "rep-2",
    label: "Data 1",
    name: "Emissions Data",
    department: "Sustainability",
    owner: "M. Sharma",
    dueTick: 2,
    submitAtTick: 2,
    status: "pending",
    remindersSent: 0,
    expectedFields: ["emissions_tco2e", "renewable_pct"],
    flags: [],
  },
  {
    id: "ds-6",
    reportId: "rep-2",
    label: "Data 2",
    name: "Energy Usage",
    department: "Facilities",
    owner: "V. Krishnan",
    dueTick: 3,
    submitAtTick: 4,
    status: "pending",
    remindersSent: 0,
    expectedFields: ["grid_kwh", "solar_kwh"],
    flags: [],
  },

  // ── Report 3: logistics — one clean, one recon mismatch, one late & incomplete ──
  {
    id: "ds-7",
    reportId: "rep-3",
    label: "Data 1",
    name: "Fleet Utilization",
    department: "Transport",
    owner: "A. Fernandes",
    dueTick: 1,
    submitAtTick: 1, // on time, clean
    status: "pending",
    remindersSent: 0,
    expectedFields: ["trips_completed", "utilization_pct"],
    flags: [],
  },
  {
    id: "ds-8",
    reportId: "rep-3",
    label: "Data 2",
    name: "Warehouse Dispatch Log",
    department: "Warehouse",
    owner: "K. Iyer",
    dueTick: 2,
    submitAtTick: 3, // one follow-up, then a recon mismatch on shipped units
    status: "pending",
    remindersSent: 0,
    expectedFields: ["units_shipped", "pending_orders"],
    flags: [],
  },
  {
    id: "ds-9",
    reportId: "rep-3",
    label: "Data 3",
    name: "Carrier Invoices",
    department: "External Vendor",
    owner: "BlueDart Logistics",
    dueTick: 2,
    submitAtTick: 5, // late AND missing a field → validation flag
    status: "pending",
    remindersSent: 0,
    expectedFields: ["freight_cost_lakhs", "fuel_surcharge_pct", "damage_claims"],
    flags: [],
  },

  // ── Report 4: vendor audit — slow burn, one vendor never responds ──
  {
    id: "ds-10",
    reportId: "rep-4",
    label: "Data 1",
    name: "Vendor Certifications",
    department: "Procurement",
    owner: "N. Kulkarni",
    dueTick: 2,
    submitAtTick: 2, // on time, clean
    status: "pending",
    remindersSent: 0,
    expectedFields: ["certified_vendors", "expired_certs"],
    flags: [],
  },
  {
    id: "ds-11",
    reportId: "rep-4",
    label: "Data 2",
    name: "Contract Renewals",
    department: "Legal",
    owner: "P. Desai",
    dueTick: 3,
    submitAtTick: 5, // two follow-ups, then a recon mismatch
    status: "pending",
    remindersSent: 0,
    expectedFields: ["renewals_due", "auto_renewed"],
    flags: [],
  },
  {
    id: "ds-12",
    reportId: "rep-4",
    label: "Data 3",
    name: "Supplier Scorecards",
    department: "Quality",
    owner: "T. Nair",
    dueTick: 3,
    submitAtTick: 4,
    status: "pending",
    remindersSent: 0,
    expectedFields: ["avg_score", "critical_ncrs"],
    flags: [],
  },
  {
    id: "ds-13",
    reportId: "rep-4",
    label: "Data 4",
    name: "Vendor Insurance Proofs",
    department: "External Vendor",
    owner: "Apex Suppliers Ltd",
    dueTick: 2,
    submitAtTick: null, // never submits → full ladder → human alert
    status: "pending",
    remindersSent: 0,
    expectedFields: ["policies_valid"],
    flags: [],
  },

  // ── Report 5: finance pack — fast and clean except one variance ──
  {
    id: "ds-14",
    reportId: "rep-5",
    label: "Data 1",
    name: "P&L Summary",
    department: "Finance",
    owner: "G. Reddy",
    dueTick: 1,
    submitAtTick: 1, // on time — but recon catches an expense variance
    status: "pending",
    remindersSent: 0,
    expectedFields: ["net_profit_lakhs", "opex_lakhs"],
    flags: [],
  },
  {
    id: "ds-15",
    reportId: "rep-5",
    label: "Data 2",
    name: "Accounts Receivable",
    department: "Finance",
    owner: "H. Mehta",
    dueTick: 1,
    submitAtTick: 2, // one day late, clean
    status: "pending",
    remindersSent: 0,
    expectedFields: ["ar_outstanding_lakhs", "overdue_90d_lakhs"],
    flags: [],
  },
  {
    id: "ds-16",
    reportId: "rep-5",
    label: "Data 3",
    name: "Treasury Position",
    department: "Treasury",
    owner: "L. Kapoor",
    dueTick: 2,
    submitAtTick: 2, // on time, clean
    status: "pending",
    remindersSent: 0,
    expectedFields: ["cash_on_hand_lakhs", "fx_exposure_pct"],
    flags: [],
  },

  // ── Report 6: BRSR — the 10 real AREPL SPOCs from the client email ──
  { id: "ds-17", reportId: "rep-6", label: "Data 1", name: "Company Secretary KPIs", department: "Company Secretary", owner: "Ravi Kumar P", dueTick: 2, submitAtTick: 2, status: "pending", remindersSent: 0, expectedFields: ["board_meetings_held", "independent_directors_pct"], flags: [] },
  { id: "ds-18", reportId: "rep-6", label: "Data 2", name: "Finance KPIs", department: "Finance", owner: "Avinash P", dueTick: 2, submitAtTick: 3, status: "pending", remindersSent: 0, expectedFields: ["turnover_cr", "csr_spend_pct"], flags: [] },
  { id: "ds-19", reportId: "rep-6", label: "Data 3", name: "Sustainability KPIs", department: "Sustainability", owner: "Mansi S", dueTick: 2, submitAtTick: 2, status: "pending", remindersSent: 0, expectedFields: ["ghg_scope1_tco2e", "ghg_scope2_tco2e"], flags: [] },
  { id: "ds-20", reportId: "rep-6", label: "Data 4", name: "HR KPIs", department: "HR", owner: "Hima Bindu K", dueTick: 3, submitAtTick: 4, status: "pending", remindersSent: 0, expectedFields: ["total_employees", "training_coverage_pct"], flags: [] },
  { id: "ds-21", reportId: "rep-6", label: "Data 5", name: "CSR KPIs", department: "CSR", owner: "Bala Subrahmanyam B", dueTick: 3, submitAtTick: null, status: "pending", remindersSent: 0, expectedFields: ["csr_projects", "beneficiaries"], flags: [] },
  { id: "ds-22", reportId: "rep-6", label: "Data 6", name: "Marketing KPIs", department: "Marketing", owner: "Pavan Kumar D", dueTick: 3, submitAtTick: 3, status: "pending", remindersSent: 0, expectedFields: ["consumer_complaints", "complaints_resolved_pct"], flags: [] },
  { id: "ds-23", reportId: "rep-6", label: "Data 7", name: "Procurement KPIs", department: "Procurement", owner: "Prasanna D", dueTick: 4, submitAtTick: 5, status: "pending", remindersSent: 0, expectedFields: ["msme_sourcing_pct", "local_sourcing_pct"], flags: [] },
  { id: "ds-24", reportId: "rep-6", label: "Data 8", name: "HSE KPIs", department: "HSE", owner: "Palla Satish", dueTick: 4, submitAtTick: 4, status: "pending", remindersSent: 0, expectedFields: ["ltifr", "safety_incidents"], flags: [] },
  { id: "ds-25", reportId: "rep-6", label: "Data 9", name: "Energy KPIs", department: "Energy", owner: "Kondala Santhoshkumar", dueTick: 4, submitAtTick: 5, status: "pending", remindersSent: 0, expectedFields: ["energy_consumed_gj", "renewable_energy_pct"], flags: [] },
  { id: "ds-26", reportId: "rep-6", label: "Data 10", name: "IT KPIs", department: "IT", owner: "Ramesh Kumar O", dueTick: 5, submitAtTick: 5, status: "pending", remindersSent: 0, expectedFields: ["data_breaches", "privacy_complaints"], flags: [] },
];

/**
 * What the Extraction Agent "finds" in each submitted document.
 * ds-1 revenue drifts +8% vs ERP → reconciliation flag.
 * ds-3 is missing damaged_units → validation flag.
 */
export const submittedData: Record<string, Record<string, number>> = {
  "ds-1": { revenue_lakhs: 521, units_sold: 1190 },
  "ds-2": { output_units: 14200, downtime_hours: 12 },
  "ds-3": { closing_stock: 8400, variance_pct: 0 }, // damaged_units missing
  "ds-5": { emissions_tco2e: 1240, renewable_pct: 34 },
  "ds-6": { grid_kwh: 88200, solar_kwh: 21400 },
  // Report 3 — logistics
  "ds-7": { trips_completed: 342, utilization_pct: 87 },
  "ds-8": { units_shipped: 12650, pending_orders: 210 }, // shipped drifts vs ERP
  "ds-9": { freight_cost_lakhs: 46, fuel_surcharge_pct: 11 }, // damage_claims missing
  // Report 4 — vendor audit
  "ds-10": { certified_vendors: 128, expired_certs: 6 },
  "ds-11": { renewals_due: 19, auto_renewed: 7 }, // renewals drift vs ERP
  "ds-12": { avg_score: 4, critical_ncrs: 2 },
  // Report 5 — finance pack
  "ds-14": { net_profit_lakhs: 212, opex_lakhs: 348 }, // opex drifts vs ERP
  "ds-15": { ar_outstanding_lakhs: 486, overdue_90d_lakhs: 62 },
  "ds-16": { cash_on_hand_lakhs: 910, fx_exposure_pct: 18 },
  // Report 6 — BRSR (AREPL FY26)
  "ds-17": { board_meetings_held: 6, independent_directors_pct: 50 },
  "ds-18": { turnover_cr: 842, csr_spend_pct: 2.1 },
  "ds-19": { ghg_scope1_tco2e: 3120, ghg_scope2_tco2e: 5480 },
  "ds-20": { total_employees: 1462 }, // training_coverage_pct missing → validation flag
  "ds-22": { consumer_complaints: 38, complaints_resolved_pct: 97 },
  "ds-23": { msme_sourcing_pct: 31, local_sourcing_pct: 64 },
  "ds-24": { ltifr: 0.4, safety_incidents: 3 }, // incidents drift vs HSE register
  "ds-25": { energy_consumed_gj: 148200, renewable_energy_pct: 22 },
  "ds-26": { data_breaches: 0, privacy_complaints: 1 },
};

/** Mock ERP / system-of-record snapshot the Reconciliation Agent compares against. */
export const erpSnapshot: Record<string, Record<string, number>> = {
  "ds-1": { revenue_lakhs: 482, units_sold: 1190 },
  "ds-2": { output_units: 14200, downtime_hours: 12 },
  "ds-3": { closing_stock: 8400, variance_pct: 0 },
  "ds-5": { emissions_tco2e: 1240, renewable_pct: 34 },
  "ds-6": { grid_kwh: 88200, solar_kwh: 21400 },
  // Report 3 — logistics
  "ds-7": { trips_completed: 342, utilization_pct: 87 },
  "ds-8": { units_shipped: 11980, pending_orders: 210 }, // +5.6% mismatch on units_shipped
  "ds-9": { freight_cost_lakhs: 46, fuel_surcharge_pct: 11 },
  // Report 4 — vendor audit
  "ds-10": { certified_vendors: 128, expired_certs: 6 },
  "ds-11": { renewals_due: 23, auto_renewed: 7 }, // -17.4% mismatch on renewals_due
  "ds-12": { avg_score: 4, critical_ncrs: 2 },
  // Report 5 — finance pack
  "ds-14": { net_profit_lakhs: 212, opex_lakhs: 330 }, // +5.5% mismatch on opex
  "ds-15": { ar_outstanding_lakhs: 486, overdue_90d_lakhs: 62 },
  "ds-16": { cash_on_hand_lakhs: 910, fx_exposure_pct: 18 },
  // Report 6 — BRSR (AREPL FY26): reference = HSE register / audited books
  "ds-17": { board_meetings_held: 6, independent_directors_pct: 50 },
  "ds-18": { turnover_cr: 842, csr_spend_pct: 2.1 },
  "ds-19": { ghg_scope1_tco2e: 3120, ghg_scope2_tco2e: 5480 },
  "ds-20": { total_employees: 1462 },
  "ds-22": { consumer_complaints: 38, complaints_resolved_pct: 97 },
  "ds-23": { msme_sourcing_pct: 31, local_sourcing_pct: 64 },
  "ds-24": { ltifr: 0.4, safety_incidents: 5 }, // submitted 3 vs register 5 → flag
  "ds-25": { energy_consumed_gj: 148200, renewable_energy_pct: 22 },
  "ds-26": { data_breaches: 0, privacy_complaints: 1 },
};
