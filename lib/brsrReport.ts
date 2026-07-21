import { BrsrQuestion } from "./types";

const fmt = (q?: BrsrQuestion) =>
  q === undefined
    ? "—"
    : `${typeof q.answer === "number" ? q.answer.toLocaleString() : q.answer}${q.unit ? " " + q.unit : ""}`;

/**
 * Compile a department's answered BRSR questions into a written-up disclosure
 * section — the prose narrative the client currently drafts by hand.
 */
export function departmentReport(department: string, qa: BrsrQuestion[]): string[] {
  const by = Object.fromEntries(qa.map((q) => [q.code, q])) as Record<string, BrsrQuestion>;
  const v = (code: string) => fmt(by[code]);
  const ENTITY = "RN Galla Family Pvt. Ltd. (Galla Foods)";

  switch (department) {
    case "Company Secretary":
      return [
        `During the reporting period (${v("A.9")}), the Board of ${ENTITY} met ${v("P1 Q1")} times, maintaining ${v("P1 Q2")} independent-director representation and upholding the entity's commitment to ethical, transparent and accountable governance under Principle 1.`,
        `The entity recorded ${v("P1 Q7")} complaints relating to conflict of interest and achieved ${v("P1 Q3")} coverage of anti-corruption and anti-bribery awareness training across the relevant workforce. The entity is registered under CIN ${v("A.1")}.`,
      ];
    case "Finance":
      return [
        `${ENTITY} reported a turnover of ${v("A.17")} for the financial year against a paid-up capital of ${v("A.11")}, with exports contributing ${v("A.19b")} of total turnover.`,
        `In line with Principle 8, the entity's CSR obligation of ${v("P8 Q1")} was met with an actual spend of ${v("P8 Q2")}, and ${v("P8 Q4")} of input material was sourced from MSMEs and small producers, supporting inclusive and equitable development.`,
      ];
    case "Sustainability":
      return [
        `Under Principle 6, the entity disclosed Scope 1 emissions of ${v("P6 Q1")} and Scope 2 emissions of ${v("P6 Q2")}, giving an emission intensity of ${v("P6 Q3")}.`,
        `Total water withdrawal stood at ${v("P6 Q7")} with ${v("P6 Q9")} discharged after treatment, and the entity generated ${v("P6 Q11")}, reflecting continued efforts to protect and restore the environment.`,
      ];
    case "HR":
      return [
        `As on the reporting date, ${ENTITY} employed ${v("A.20")} people, of whom ${v("P3 Q1")} were women, with ${v("P3 Q2")} of employees covered by health and accident insurance under Principle 3.`,
        `Skill-upgradation training reached ${v("P3 Q6")} of employees. In respect of human rights (Principle 5), the entity recorded ${v("P5 Q7")} under the POSH framework and confirmed that ${v("P5 Q3")} of its workforce was paid more than the applicable minimum wage.`,
      ];
    case "CSR":
      return [
        `The entity undertook ${v("P8 Q5")} CSR projects during the year, reaching ${v("P8 Q6")} beneficiaries and conducting ${v("P8 Q3")} Social Impact Assessments in accordance with Principle 8.`,
        `Of the total CSR outlay, ${v("P8 Q7")} was directed to aspirational districts, and ${v("P8 Q8")} was routed through registered implementing agencies, ensuring accountable and inclusive deployment of funds.`,
      ];
    case "Marketing":
      return [
        `Under Principle 9, the entity received ${v("P9 Q1")} consumer complaints during the year, of which ${v("P9 Q2")} were resolved, and recorded ${v("P9 Q5")} product recalls.`,
        `The entity confirms it displays product information as per statutory labelling norms (${v("P9 Q3")}) and recorded ${v("P9 Q7")} instances of penalties for unfair trade practices or misleading advertising.`,
      ];
    case "Procurement":
      return [
        `In line with Principle 2, ${v("P2 Q4")} of inputs by value were sustainably sourced and ${v("P2 Q3")} of input material was recycled or reused.`,
        `The entity sourced ${v("P8 Q4")} of its procurement from MSMEs and ${v("P8 Q9")} from local suppliers, and maintains a supplier code of conduct with ESG screening (${v("P2 Q6")}).`,
      ];
    case "HSE":
      return [
        `The entity reported a Lost Time Injury Frequency Rate (LTIFR) of ${v("P3 Q11")} per million man-hours, with ${v("P3 Q12")} recordable work-related injuries and ${v("P3 Q13")} fatalities during the year.`,
        `Safety training covered ${v("P3 Q9")} of employees and workers, supported by ${v("P3 Q10")} health and safety check-ups and audits, reinforcing the entity's duty of care under Principle 3.`,
      ];
    case "Energy":
      return [
        `Total energy consumed across the organization was ${v("P6 Q1a")}, of which ${v("P6 Q1b")} came from renewable sources, giving an energy intensity of ${v("P6 Q1c")}.`,
        `Grid electricity purchased during the year was ${v("P6 Q1d")}. The entity's coverage under the PAT (Perform, Achieve, Trade) scheme is reported as: ${v("P6 Q4")}.`,
      ];
    case "IT":
      return [
        `Under Principle 9, the entity recorded ${v("P9 Q9")} data breaches during the year, of which ${v("P9 Q9a")} involved personally identifiable information, and ${v("P9 Q10")} data-privacy complaints from customers.`,
        `The entity maintains a cybersecurity and data-privacy policy (${v("P9 Q8")}), with ${v("P9 Q11")} of critical systems covered by cybersecurity audit.`,
      ];
    default:
      return [
        `Based on the data submitted by ${department}, the following disclosures were compiled for the reporting period: ${qa
          .map((q) => `${q.text.replace(/\.$/, "")} — ${fmt(q)}`)
          .join("; ")}.`,
      ];
  }
}
