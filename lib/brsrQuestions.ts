import { BrsrQuestion, DataSource } from "./types";

/**
 * BRSR question sets per AREPL department, generated from the real FY25 BRSR
 * format (Section A general disclosures, Section B management & process,
 * Section C the 9 NGRBC principles). Keyed by department name so each SPOC's
 * sheet is a focused questionnaire, mirroring the client's manual process.
 */
export const BRSR_QUESTIONS: Record<string, BrsrQuestion[]> = {
  "Company Secretary": [
    { code: "A.1", section: "A", text: "Corporate Identity Number (CIN) of the listed entity", answer: "U15490AP2017PTC106255" },
    { code: "A.9", section: "A", text: "Reporting period for the information provided", answer: "01 Apr 2025 – 31 Mar 2026" },
    { code: "P1 Q1", section: "C", text: "Number of board meetings held during the financial year", answer: 6, prev: 5 },
    { code: "P1 Q2", section: "C", text: "Percentage of independent directors on the board", answer: 50, unit: "%", prev: 50 },
    {
      code: "P1 Q4",
      section: "C",
      text: "Training & awareness programmes on the NGRBC principles for the Board and workforce",
      answer: "See breakdown",
      table: {
        columns: ["Segment", "Programmes held", "Persons covered", "% coverage"],
        rows: [
          ["Board of Directors", 3, 8, "100%"],
          ["Key Managerial Personnel", 4, 12, "100%"],
          ["Employees (other than BoD/KMP)", 22, 1240, "85%"],
          ["Workers", 9, 210, "72%"],
        ],
      },
    },
    { code: "P1 Q7", section: "C", text: "Number of complaints on conflict of interest received during the year", answer: 0, prev: 0 },
    { code: "P1 Q3", section: "C", text: "Coverage of anti-corruption / anti-bribery policy awareness training", answer: 100, unit: "%", prev: 96 },
  ],
  Finance: [
    { code: "A.11", section: "A", text: "Paid-up capital of the entity", answer: 215.46, unit: "₹ Cr" },
    { code: "A.17", section: "A", text: "Turnover of the entity for the financial year", answer: 842, unit: "₹ Cr" },
    { code: "A.19b", section: "A", text: "Contribution of exports as a percentage of total turnover", answer: 43, unit: "%" },
    { code: "P8 Q1", section: "C", text: "CSR obligation for the year (2% of average net profit)", answer: 168, unit: "₹ lakh" },
    { code: "P8 Q2", section: "C", text: "Amount spent on CSR during the financial year", answer: 176, unit: "₹ lakh" },
    { code: "P8 Q4", section: "C", text: "Percentage of input material sourced from MSMEs / small producers", answer: 31, unit: "%" },
  ],
  Sustainability: [
    {
      code: "P6 Q1",
      section: "C",
      text: "GHG emissions and intensity (FY26 vs FY25)",
      answer: "See breakdown",
      table: {
        columns: ["Parameter", "Unit", "FY26", "FY25"],
        rows: [
          ["Scope 1 emissions", "tCO₂e", 3120, 3390],
          ["Scope 2 emissions", "tCO₂e", 5480, 5720],
          ["Total (Scope 1 + 2)", "tCO₂e", 8600, 9110],
          ["Emission intensity", "tCO₂e / ₹ Cr", 10.2, 11.9],
        ],
      },
    },
    {
      code: "P6 Q7",
      section: "C",
      text: "Water withdrawal, consumption and discharge (FY26 vs FY25)",
      answer: "See breakdown",
      table: {
        columns: ["Parameter", "Unit", "FY26", "FY25"],
        rows: [
          ["Total withdrawal", "KL", 91800, 98200],
          ["Total consumption", "KL", 30600, 33100],
          ["Total discharge (treated)", "KL", 61200, 65100],
        ],
      },
    },
    { code: "P6 Q11", section: "C", text: "Total waste generated and percentage recycled", answer: "410 MT · 78% recycled", prev: "455 MT · 71% recycled" },
  ],
  HR: [
    {
      code: "A.20",
      section: "A",
      text: "Employees and workers (including differently abled) as at the end of the financial year",
      answer: "See breakdown",
      table: {
        columns: ["Category", "Total", "Male", "Female"],
        rows: [
          ["Permanent employees", 986, 742, 244],
          ["Other than permanent employees", 214, 150, 64],
          ["Permanent workers", 205, 170, 35],
          ["Other than permanent workers", 57, 44, 13],
          ["Differently abled (total)", 9, 7, 2],
        ],
      },
    },
    { code: "P3 Q1", section: "C", text: "Percentage of women in the total workforce", answer: 27, unit: "%", prev: 24 },
    {
      code: "P3 Q3",
      section: "C",
      text: "Well-being measures — % of employees and workers covered (FY26 vs FY25)",
      answer: "See breakdown",
      table: {
        columns: ["Measure", "Employees FY26", "Workers FY26", "Employees FY25"],
        rows: [
          ["Health insurance", "100%", "100%", "100%"],
          ["Accident insurance", "100%", "100%", "98%"],
          ["Maternity benefits", "100%", "—", "100%"],
          ["Paternity benefits", "100%", "—", "90%"],
          ["Day-care facilities", "62%", "40%", "55%"],
        ],
      },
    },
    { code: "P3 Q6", section: "C", text: "Coverage of training on skill upgradation for employees", answer: 85, unit: "%", prev: 78 },
    { code: "P5 Q7", section: "C", text: "Number of POSH (sexual harassment) complaints filed and resolved", answer: "2 filed · 2 resolved", prev: "3 filed · 3 resolved" },
    { code: "P5 Q3", section: "C", text: "Percentage of workforce paid more than the minimum wage", answer: 100, unit: "%", prev: 100 },
  ],
  CSR: [
    { code: "P8 Q5", section: "C", text: "Number of CSR projects undertaken during the year", answer: 15 },
    { code: "P8 Q6", section: "C", text: "Total number of beneficiaries reached through CSR", answer: 48200 },
    { code: "P8 Q3", section: "C", text: "Number of Social Impact Assessments (SIA) conducted", answer: 3 },
    { code: "P8 Q7", section: "C", text: "CSR amount spent in aspirational districts", answer: 42, unit: "₹ lakh" },
    { code: "P8 Q8", section: "C", text: "Percentage of CSR spend routed through registered implementing agencies", answer: 68, unit: "%" },
  ],
  Marketing: [
    { code: "P9 Q1", section: "C", text: "Total consumer complaints received during the year", answer: 38 },
    { code: "P9 Q2", section: "C", text: "Percentage of consumer complaints resolved", answer: 97, unit: "%" },
    { code: "P9 Q5", section: "C", text: "Number of product recalls (voluntary and forced)", answer: 0 },
    { code: "P9 Q3", section: "C", text: "Does the entity display product information as per statutory labelling norms?", answer: "Yes" },
    { code: "P9 Q7", section: "C", text: "Instances of penalties for unfair trade practices or misleading advertising", answer: 0 },
  ],
  Procurement: [
    { code: "P2 Q4", section: "C", text: "Percentage of inputs to total inputs by value sourced sustainably", answer: 46, unit: "%" },
    { code: "P2 Q3", section: "C", text: "Percentage of recycled or reused input material used in production", answer: 12, unit: "%" },
    { code: "P8 Q4", section: "C", text: "Percentage of procurement from MSMEs / small producers", answer: 31, unit: "%" },
    { code: "P8 Q9", section: "C", text: "Percentage of procurement from local / same-state suppliers", answer: 64, unit: "%" },
    { code: "P2 Q6", section: "C", text: "Does the entity have a supplier code of conduct / ESG screening?", answer: "Yes" },
  ],
  HSE: [
    { code: "P3 Q11", section: "C", text: "Lost Time Injury Frequency Rate (LTIFR) per million man-hours", answer: 0.4 },
    { code: "P3 Q12", section: "C", text: "Total recordable work-related injuries during the year", answer: 5 },
    { code: "P3 Q13", section: "C", text: "Number of fatalities during the year", answer: 0 },
    { code: "P3 Q9", section: "C", text: "Safety training coverage of employees and workers", answer: 92, unit: "%" },
    { code: "P3 Q10", section: "C", text: "Number of health & safety check-ups / audits conducted", answer: 24 },
  ],
  Energy: [
    { code: "P6 Q1a", section: "C", text: "Total energy consumed across the organization", answer: 148200, unit: "GJ" },
    { code: "P6 Q1b", section: "C", text: "Percentage of energy consumed from renewable sources", answer: 22, unit: "%" },
    { code: "P6 Q1c", section: "C", text: "Energy intensity per rupee of turnover", answer: 176, unit: "GJ/₹ Cr" },
    { code: "P6 Q1d", section: "C", text: "Total electricity purchased from the grid", answer: 9820000, unit: "kWh" },
    { code: "P6 Q4", section: "C", text: "Is the entity covered under the PAT (Perform, Achieve, Trade) scheme?", answer: "No" },
  ],
  IT: [
    { code: "P9 Q9", section: "C", text: "Number of data breaches during the year", answer: 0 },
    { code: "P9 Q9a", section: "C", text: "Number of breaches involving personally identifiable information (PII)", answer: 0 },
    { code: "P9 Q10", section: "C", text: "Number of data-privacy complaints received from customers", answer: 1 },
    { code: "P9 Q8", section: "C", text: "Does the entity have a cybersecurity & data-privacy policy?", answer: "Yes" },
    { code: "P9 Q11", section: "C", text: "Percentage of critical systems covered by cybersecurity audit", answer: 100, unit: "%" },
  ],
};

/**
 * Question banks for the OTHER reports' sources (Sustainability/GRI, BRSR Core
 * assurance, CSR, ESG data book), keyed by source id because these reports
 * reuse department names (Sustainability, Energy, HR…) with different indicators.
 */
export const QUESTIONS_BY_SOURCE: Record<string, BrsrQuestion[]> = {
  // Report 2 — Sustainability Report (GRI)
  "ds-11": [
    { code: "GRI 3-1", section: "C", text: "Number of material topics identified through the assessment", answer: 14 },
    { code: "GRI 3-1", section: "C", text: "Number of stakeholders engaged during materiality assessment", answer: 220 },
    { code: "GRI 2-29", section: "C", text: "Is there a formal stakeholder engagement approach in place?", answer: "Yes" },
  ],
  "ds-12": [
    { code: "GRI 303-3", section: "C", text: "Total water withdrawal across all sources", answer: 96400, unit: "KL" },
    { code: "GRI 306-4", section: "C", text: "Percentage of waste diverted from disposal (recycled)", answer: 78, unit: "%" },
    { code: "GRI 302-1", section: "C", text: "Is energy consumption within the organization tracked and reported?", answer: "Yes" },
  ],
  "ds-13": [
    { code: "GRI 405-1", section: "C", text: "Percentage of women in the total workforce", answer: 27, unit: "%" },
    { code: "GRI 406-1", section: "C", text: "Number of grievances filed and resolved during the year", answer: 12 },
  ],
  "ds-14": [
    { code: "GRI 2-16", section: "C", text: "Number of ethics / code-of-conduct trainings conducted", answer: 9 },
    { code: "GRI 2-23", section: "C", text: "Number of policy commitments reviewed or updated", answer: 4 },
  ],
  // Report 3 — BRSR Core assurance evidence
  "ds-15": [
    { code: "Core A1", section: "C", text: "Number of utility invoices on file supporting energy data", answer: 12 },
    { code: "Core A1", section: "C", text: "Months of continuous meter logs available for assurance", answer: 12 },
  ],
  "ds-16": [
    { code: "Core A4", section: "C", text: "Number of incident reports (Form 27) filed during the year", answer: 5 },
    { code: "Core A4", section: "C", text: "Total man-hours worked during the reporting period", answer: 31, unit: "lakh" },
  ],
  "ds-17": [
    { code: "Core A3", section: "C", text: "Provident Fund coverage of eligible employees", answer: 100, unit: "%" },
    { code: "Core A3", section: "C", text: "Months of wage records available for assurance sampling", answer: 12 },
  ],
  // Report 4 — CSR Annual Report (Companies Act §135)
  "ds-19": [
    { code: "§135", section: "C", text: "Number of CSR projects completed during the year", answer: 11 },
    { code: "§135", section: "C", text: "Number of CSR projects ongoing at year end", answer: 4 },
  ],
  "ds-20": [
    { code: "§135(5)", section: "C", text: "CSR obligation for the year (2% of average net profit)", answer: 168, unit: "₹ lakh" },
    { code: "§135(5)", section: "C", text: "Actual amount spent on CSR during the year", answer: 176, unit: "₹ lakh" },
  ],
  "ds-21": [
    { code: "Rule 8(3)", section: "C", text: "Number of projects covered by Social Impact Assessment", answer: 6 },
    { code: "Rule 8(3)", section: "C", text: "Average impact assessment score (out of 10)", answer: 8 },
  ],
  // Report 5 — ESG Data Book Q1
  "ds-22": [
    { code: "ESG-E1", section: "C", text: "Total energy consumed in Q1", answer: 36900, unit: "GJ" },
    { code: "ESG-E2", section: "C", text: "Total water consumed in Q1", answer: 22400, unit: "KL" },
  ],
  "ds-23": [
    { code: "ESG-C1", section: "C", text: "Scope 1 GHG emissions for Q1", answer: 760, unit: "tCO₂e" },
    { code: "ESG-C2", section: "C", text: "Scope 2 GHG emissions for Q1", answer: 1310, unit: "tCO₂e" },
  ],
  "ds-24": [
    { code: "ESG-S1", section: "C", text: "Number of safety incidents recorded in Q1", answer: 1 },
    { code: "ESG-S2", section: "C", text: "Number of near-misses reported in Q1", answer: 6 },
  ],
};

/** Convenience: questions for a department, or [] if none defined. */
export function questionsFor(department: string): BrsrQuestion[] {
  return BRSR_QUESTIONS[department] ?? [];
}

/** Questions for a specific source: by-source bank → department bank → []. */
export function questionsForSource(src: DataSource): BrsrQuestion[] {
  return QUESTIONS_BY_SOURCE[src.id] ?? BRSR_QUESTIONS[src.department] ?? [];
}
