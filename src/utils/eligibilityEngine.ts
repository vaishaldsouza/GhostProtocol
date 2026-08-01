import { supabase } from './supabase';
import { calculateAge } from './age';
import {
  User,
  EligibilityResult,
  EligibilityCheck,
  EligibilityStatus,
  DeferralDuration,
} from '../types';

// ── Constants (WHO / AABB guidelines) ────────────────────────────────────────
export const MIN_AGE              = 18;
export const MAX_AGE              = 65;
export const MIN_WEIGHT_KG        = 50;
export const MIN_DAYS_BETWEEN_DONATIONS = 56;   // whole blood
export const MIN_DAYS_PLATELETS   = 2;
export const MIN_DAYS_PLASMA      = 28;
export const OPTIMAL_DAYS_BETWEEN = 90;

// ── Donor profile shape expected by the engine ────────────────────────────────
export interface DonorProfile {
  dob?: string;
  gender?: string;
  weightKg?: number;
  medicalNotes?: string;
  lastDonationDate?: string;      // ISO date string from donor_availability
  nextEligibleDate?: string;
  isAvailable?: boolean;
}

// ── Helper: days between two dates ───────────────────────────────────────────
function daysBetween(from: string | Date, to: string | Date = new Date()): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

function addDays(from: Date, n: number): string {
  const d = new Date(from.getTime() + n * 86_400_000);
  return d.toISOString().split('T')[0];
}

// ── Individual check runners ──────────────────────────────────────────────────

function checkAge(dob?: string): EligibilityCheck {
  const age = calculateAge(dob);
  if (!dob || age === 0) {
    return {
      id: 'age',
      category: 'demographic',
      label: 'Age Requirement',
      status: 'unknown',
      detail: 'Date of birth not provided — cannot verify age.',
    };
  }
  if (age < MIN_AGE) {
    return {
      id: 'age',
      category: 'demographic',
      label: 'Age Requirement',
      status: 'fail',
      detail: `You are ${age} years old. Minimum age is ${MIN_AGE}.`,
      deferralDuration: 'until_resolved',
    };
  }
  if (age > MAX_AGE) {
    return {
      id: 'age',
      category: 'demographic',
      label: 'Age Requirement',
      status: 'warn',
      detail: `You are ${age} years old. Donors over ${MAX_AGE} require physician clearance.`,
    };
  }
  return {
    id: 'age',
    category: 'demographic',
    label: 'Age Requirement',
    status: 'pass',
    detail: `Age ${age} — within the ${MIN_AGE}–${MAX_AGE} eligible range.`,
  };
}

function checkWeight(weightKg?: number, gender?: string): EligibilityCheck {
  if (!weightKg) {
    return {
      id: 'weight',
      category: 'demographic',
      label: 'Weight Requirement',
      status: 'unknown',
      detail: 'Weight not recorded. Minimum is 50 kg.',
    };
  }
  if (weightKg < MIN_WEIGHT_KG) {
    return {
      id: 'weight',
      category: 'demographic',
      label: 'Weight Requirement',
      status: 'fail',
      detail: `Your weight (${weightKg} kg) is below the 50 kg minimum.`,
      deferralDuration: 'until_resolved',
    };
  }
  return {
    id: 'weight',
    category: 'demographic',
    label: 'Weight Requirement',
    status: 'pass',
    detail: `Weight ${weightKg} kg — meets the ≥ 50 kg requirement.`,
  };
}

function checkDonationInterval(
  lastDonationDate?: string,
  nextEligibleDate?: string,
): EligibilityCheck {
  if (!lastDonationDate) {
    return {
      id: 'interval',
      category: 'timing',
      label: 'Donation Interval',
      status: 'pass',
      detail: 'No previous donation on record — first-time donor, cleared.',
    };
  }

  const daysSince = daysBetween(lastDonationDate);

  // Prefer explicit next_eligible_date if set
  if (nextEligibleDate) {
    const daysLeft = daysBetween(new Date(), nextEligibleDate);
    if (daysLeft > 0) {
      return {
        id: 'interval',
        category: 'timing',
        label: 'Donation Interval',
        status: 'fail',
        detail: `Last donation: ${daysSince} day(s) ago. Next eligible date: ${nextEligibleDate} (${daysLeft} day(s) away).`,
        deferralDuration: '4_weeks',
      };
    }
  } else if (daysSince < MIN_DAYS_BETWEEN_DONATIONS) {
    const daysLeft = MIN_DAYS_BETWEEN_DONATIONS - daysSince;
    return {
      id: 'interval',
      category: 'timing',
      label: 'Donation Interval',
      status: 'fail',
      detail: `Last donation was ${daysSince} day(s) ago. Must wait ${daysLeft} more day(s) (56-day WHO minimum).`,
      deferralDuration: '4_weeks',
    };
  }

  const label =
    daysSince >= OPTIMAL_DAYS_BETWEEN
      ? `${daysSince} days since last donation — ideal window.`
      : `${daysSince} days since last donation — just within the 56-day minimum.`;

  return {
    id: 'interval',
    category: 'timing',
    label: 'Donation Interval',
    status: daysSince >= MIN_DAYS_BETWEEN_DONATIONS ? 'pass' : 'fail',
    detail: label,
  };
}

// ── Medical-notes keyword screener ────────────────────────────────────────────
interface MedicalRule {
  pattern: RegExp;
  status: 'fail' | 'warn';
  label: string;
  detail: string;
  deferral?: DeferralDuration;
}

const MEDICAL_RULES: MedicalRule[] = [
  // Permanent deferrals
  { pattern: /hiv|aids/i,            status: 'fail', label: 'HIV / AIDS',          detail: 'HIV/AIDS is a permanent deferral from whole-blood donation.',             deferral: 'permanent' },
  { pattern: /hepatitis\s*[bc]/i,    status: 'fail', label: 'Hepatitis B/C',       detail: 'Hepatitis B or C is a permanent deferral.',                              deferral: 'permanent' },
  { pattern: /cancer|leukemia/i,     status: 'fail', label: 'Cancer / Leukemia',   detail: 'Active or recent cancer requires medical clearance — likely permanent.',   deferral: 'permanent' },
  { pattern: /sickle.?cell/i,        status: 'fail', label: 'Sickle-Cell Disease', detail: 'Sickle-cell trait may donate; sickle-cell disease is a deferral.',         deferral: 'permanent' },
  // Long deferrals
  { pattern: /malaria/i,             status: 'fail', label: 'Malaria History',      detail: 'Malaria treatment: 3-year deferral. Recent travel to endemic zone: 12 months.', deferral: '12_months' },
  { pattern: /blood\s*thinners?|warfarin|heparin|eliquis|xarelto/i, status: 'warn', label: 'Blood Thinners', detail: 'Blood-thinner medication — consult donation centre before donating.', deferral: 'until_resolved' },
  { pattern: /diabetes.*insulin/i,   status: 'warn', label: 'Insulin-Dependent Diabetes', detail: 'Insulin-dependent diabetes requires physician clearance.', deferral: 'until_resolved' },
  { pattern: /pregnant|pregnancy/i,  status: 'fail', label: 'Pregnancy',            detail: 'Donation is deferred during pregnancy and for 6 months post-partum.',       deferral: '6_months' },
  { pattern: /tattoo|piercing/i,     status: 'warn', label: 'Tattoo / Piercing',    detail: 'Recent tattoo or piercing: 12-month deferral if done at unregulated facility.', deferral: '12_months' },
  { pattern: /surgery|operation/i,   status: 'warn', label: 'Recent Surgery',       detail: 'Major surgery: 12-month deferral. Minor surgery: 4-week deferral after full recovery.', deferral: '12_months' },
  // Short deferrals
  { pattern: /cold|flu|fever|infection/i, status: 'warn', label: 'Recent Illness',  detail: 'Active illness or within 1 week of recovery is a short-term deferral.', deferral: '1_week' },
  { pattern: /vaccine|vaccination/i, status: 'warn', label: 'Recent Vaccination',   detail: 'Live vaccines: 4-week deferral. Inactivated (e.g. COVID, flu): 14-day deferral if symptom-free.', deferral: '2_weeks' },
  { pattern: /alcohol/i,             status: 'warn', label: 'Alcohol Use',           detail: 'Avoid donating within 24 h of alcohol consumption.', deferral: '1_week' },
];

function checkMedicalNotes(medicalNotes?: string): EligibilityCheck[] {
  if (!medicalNotes || medicalNotes.trim() === '') {
    return [{
      id: 'medical_notes',
      category: 'health',
      label: 'Medical History',
      status: 'pass',
      detail: 'No medical conditions recorded.',
    }];
  }

  const triggered: EligibilityCheck[] = [];
  for (const rule of MEDICAL_RULES) {
    if (rule.pattern.test(medicalNotes)) {
      triggered.push({
        id: `medical_${rule.label.toLowerCase().replace(/\s+/g, '_')}`,
        category: 'health',
        label: rule.label,
        status: rule.status,
        detail: rule.detail,
        deferralDuration: rule.deferral,
      });
    }
  }

  if (triggered.length === 0) {
    triggered.push({
      id: 'medical_notes',
      category: 'health',
      label: 'Medical History',
      status: 'pass',
      detail: 'No disqualifying conditions detected in medical notes.',
    });
  }

  return triggered;
}

// ── Composite score & status ──────────────────────────────────────────────────

function deriveStatus(checks: EligibilityCheck[]): EligibilityStatus {
  const hasPermanentFail = checks.some(
    (c) => c.status === 'fail' && c.deferralDuration === 'permanent',
  );
  if (hasPermanentFail) return 'ineligible';

  const failCount = checks.filter((c) => c.status === 'fail').length;
  if (failCount > 0) return 'deferred';

  const warnCount = checks.filter((c) => c.status === 'warn').length;
  if (warnCount > 0) return 'needs_review';

  return 'eligible';
}

function computeScore(checks: EligibilityCheck[]): number {
  const weights: Record<EligibilityCheck['status'], number> = {
    pass: 100, warn: 50, fail: 0, unknown: 60,
  };
  if (checks.length === 0) return 0;
  const total = checks.reduce((s, c) => s + weights[c.status], 0);
  return Math.round(total / checks.length);
}

function buildSummary(status: EligibilityStatus, checks: EligibilityCheck[]): string {
  const fails = checks.filter((c) => c.status === 'fail');
  const warns = checks.filter((c) => c.status === 'warn');

  if (status === 'eligible')
    return 'You pass all screening criteria and are cleared to donate whole blood today.';
  if (status === 'ineligible')
    return `Permanent deferral: ${fails.map((f) => f.label).join(', ')}.`;
  if (status === 'deferred') {
    const longestDeferral = fails[0]?.deferralDuration;
    return `Temporarily deferred due to: ${fails.map((f) => f.label).join(', ')}. ${
      longestDeferral ? `Typical deferral: ${longestDeferral.replace(/_/g, ' ')}.` : ''
    }`;
  }
  return `Eligible with advisory — please discuss with donation staff: ${warns.map((w) => w.label).join(', ')}.`;
}

function buildRecommendations(
  status: EligibilityStatus,
  checks: EligibilityCheck[],
  score: number,
): string[] {
  const recs: string[] = [];

  if (status === 'eligible') {
    recs.push('Stay well-hydrated (drink 500 ml water before donating).');
    recs.push('Eat an iron-rich meal within 3 hours of donation.');
    recs.push('Avoid strenuous exercise for 12 hours post-donation.');
    return recs;
  }

  checks
    .filter((c) => c.status === 'fail' || c.status === 'warn')
    .forEach((c) => recs.push(c.detail));

  if (checks.some((c) => c.id === 'weight' && c.status !== 'pass'))
    recs.push('Include iron-rich foods (red meat, spinach, lentils) to build eligibility.');

  if (status === 'needs_review')
    recs.push('Visit your nearest donation centre with a physician clearance note.');

  return recs;
}

function deriveComponentEligibility(checks: EligibilityCheck[]): {
  canDonateWhole: boolean;
  canDonatePlatelets: boolean;
  canDonatePlasma: boolean;
} {
  const hasFail = checks.some((c) => c.status === 'fail');
  const hasWarn = checks.some((c) => c.status === 'warn');

  return {
    canDonateWhole:     !hasFail,
    canDonatePlatelets: !hasFail && !hasWarn,
    canDonatePlasma:    !hasFail,
  };
}

// ── Public API: screen from profile ──────────────────────────────────────────

export function screenDonor(profile: DonorProfile): EligibilityResult {
  const checks: EligibilityCheck[] = [
    checkAge(profile.dob),
    checkWeight(profile.weightKg, profile.gender),
    checkDonationInterval(profile.lastDonationDate, profile.nextEligibleDate),
    ...checkMedicalNotes(profile.medicalNotes),
  ];

  const status       = deriveStatus(checks);
  const overallScore = computeScore(checks);
  const summary      = buildSummary(status, checks);
  const recommendations = buildRecommendations(status, checks, overallScore);
  const { canDonateWhole, canDonatePlatelets, canDonatePlasma } =
    deriveComponentEligibility(checks);

  // Compute next eligible date
  let nextEligibleDate: string | undefined;
  let daysUntilEligible: number | undefined;

  if (status === 'deferred') {
    const intervalFail = checks.find(
      (c) => c.id === 'interval' && c.status === 'fail',
    );
    if (intervalFail && profile.lastDonationDate) {
      const nextDate = addDays(
        new Date(profile.lastDonationDate),
        MIN_DAYS_BETWEEN_DONATIONS,
      );
      nextEligibleDate   = nextDate;
      daysUntilEligible  = Math.max(0, daysBetween(new Date(), nextDate));
    }
  }

  return {
    status,
    overallScore,
    checks,
    nextEligibleDate,
    daysUntilEligible,
    summary,
    recommendations,
    canDonateWhole,
    canDonatePlatelets,
    canDonatePlasma,
    screenedAt: new Date().toISOString(),
  };
}

// ── Fetch donor_availability from Supabase and merge with User ────────────────

export async function fetchAndScreenDonor(
  user: User,
): Promise<EligibilityResult> {
  let lastDonationDate: string | undefined;
  let nextEligibleDate: string | undefined;
  let notes: string | undefined;

  try {
    const { data } = await supabase
      .from('donor_availability')
      .select('last_donation_date, next_eligible_date, notes')
      .eq('donor_id', user.id)
      .maybeSingle();

    if (data) {
      lastDonationDate = data.last_donation_date ?? undefined;
      nextEligibleDate = data.next_eligible_date ?? undefined;
      notes            = data.notes ?? undefined;
    }
  } catch {
    // silently fall through — screen on profile data only
  }

  const profile: DonorProfile = {
    dob:              user.dob,
    gender:           user.gender,
    weightKg:         user.weightKg,
    medicalNotes:     [user.medicalNotes, notes].filter(Boolean).join('. ') || undefined,
    lastDonationDate,
    nextEligibleDate,
  };

  return screenDonor(profile);
}

// ── Q&A: natural-language question → structured answer ───────────────────────

export interface QAAnswer {
  eligible: boolean | null;  // null = uncertain / depends
  headline: string;
  body: string;
  deferralDuration?: DeferralDuration;
  sources: string[];
}

interface QARule {
  pattern: RegExp;
  answer: QAAnswer;
}

const QA_RULES: QARule[] = [
  {
    pattern: /age|how old|minimum age|maximum age/i,
    answer: {
      eligible: null,
      headline: 'Age requirement',
      body: 'Donors must be 18–65 years old. First-time donors should be under 60 at some centres. Donors over 65 need a physician clearance letter.',
      sources: ['WHO Blood Safety Guidelines', 'AABB Standards'],
    },
  },
  {
    pattern: /weight|kg|kilograms|heavy|light/i,
    answer: {
      eligible: null,
      headline: 'Weight requirement',
      body: 'You must weigh at least 50 kg (110 lbs) to donate whole blood. Lower weight increases the risk of adverse reactions.',
      sources: ['WHO 2001 Guidelines on Blood Donation'],
    },
  },
  {
    pattern: /covid|coronavirus|covid.?19/i,
    answer: {
      eligible: null,
      headline: 'COVID-19 and vaccination',
      body: 'Inactivated / mRNA vaccines (Pfizer, Moderna, Covaxin, Covishield): no deferral if symptom-free. Live attenuated vaccines: 4-week deferral. If you had COVID-19: wait until fully recovered and symptom-free for at least 14 days.',
      deferralDuration: '2_weeks',
      sources: ['WHO COVID-19 Blood Donor Screening', 'FDA Guidance 2021'],
    },
  },
  {
    pattern: /vaccine|vaccination|immunisation|immunization/i,
    answer: {
      eligible: null,
      headline: 'Vaccination deferral',
      body: 'Inactivated vaccines (flu, hepatitis, rabies, COVID mRNA): no deferral if symptom-free. Live vaccines (MMR, yellow fever, chickenpox): 4-week deferral. Anti-rabies post-exposure: 1-year deferral.',
      deferralDuration: '4_weeks',
      sources: ['AABB 2022 Donor History Questionnaire'],
    },
  },
  {
    pattern: /tattoo|piercing|body.?art/i,
    answer: {
      eligible: false,
      headline: 'Tattoo / Piercing deferral',
      body: 'A 12-month deferral applies if the tattoo or piercing was done at an unlicensed or unregulated facility. If done at a licensed studio using sterile equipment, most centres require only a 4-month deferral. Keep documentation if possible.',
      deferralDuration: '12_months',
      sources: ['AABB Standards for Blood Banks', 'NHS Blood Donation Guidelines'],
    },
  },
  {
    pattern: /pregnancy|pregnant|breastfeed|postpartum|post.?natal/i,
    answer: {
      eligible: false,
      headline: 'Pregnancy deferral',
      body: 'Blood donation is deferred during pregnancy. After delivery, wait at least 6 months before donating (or 9 months if breastfeeding). This protects both mother and infant iron stores.',
      deferralDuration: '6_months',
      sources: ['WHO Blood Safety', 'Red Cross Donor Guidelines'],
    },
  },
  {
    pattern: /malaria/i,
    answer: {
      eligible: false,
      headline: 'Malaria deferral',
      body: 'If you have had malaria: 3-year deferral after treatment completion. If you recently travelled to a malaria-endemic zone: 12-month deferral. This prevents transfusion-transmitted malaria.',
      deferralDuration: '12_months',
      sources: ['WHO Malaria & Blood Safety 2020'],
    },
  },
  {
    pattern: /hiv|aids/i,
    answer: {
      eligible: false,
      headline: 'HIV / AIDS — Permanent deferral',
      body: 'A confirmed HIV/AIDS diagnosis is a permanent deferral from whole-blood donation. Plasma for manufacturing purposes may be considered separately under specific medical oversight.',
      deferralDuration: 'permanent',
      sources: ['WHO HIV & Blood Safety', 'FDA 21 CFR Part 610'],
    },
  },
  {
    pattern: /hepatitis/i,
    answer: {
      eligible: false,
      headline: 'Hepatitis deferral',
      body: 'Hepatitis B or C is a permanent deferral. Hepatitis A: wait 4 weeks after full recovery. Hepatitis E: wait 6 months. Always disclose any hepatitis history to the donation staff.',
      deferralDuration: 'permanent',
      sources: ['AABB Standards', 'WHO Technical Report Series'],
    },
  },
  {
    pattern: /diabetes/i,
    answer: {
      eligible: null,
      headline: 'Diabetes',
      body: 'Non-insulin-dependent (diet/tablet-controlled) diabetes: generally eligible if well-controlled. Insulin-dependent diabetes: most centres defer — requires physician clearance. Donating while blood sugar is poorly controlled is not recommended.',
      sources: ['NHS Blood Donation', 'Red Cross Medical Guidelines'],
    },
  },
  {
    pattern: /blood\s*pressure|hypertension|hypotension/i,
    answer: {
      eligible: null,
      headline: 'Blood pressure',
      body: 'Blood pressure must be measured on the day: systolic 90–180 mmHg, diastolic 50–100 mmHg. Controlled hypertension on medication is generally acceptable. Hypotension (low BP) may cause fainting and could result in deferral on the day.',
      sources: ['AABB Donor History', 'BTS Guidelines 2022'],
    },
  },
  {
    pattern: /surgery|operation|procedure/i,
    answer: {
      eligible: false,
      headline: 'Recent surgery deferral',
      body: 'Minor surgery (e.g. dental, endoscopy): 4-week deferral after full recovery. Major surgery: 12-month deferral. Blood transfusion received during surgery: 12-month deferral. Always inform staff about any recent surgical procedure.',
      deferralDuration: '12_months',
      sources: ['NHS, AABB Donor History Questionnaire'],
    },
  },
  {
    pattern: /medication|medicine|drug|tablet|prescription/i,
    answer: {
      eligible: null,
      headline: 'Medication',
      body: 'Most common medications are acceptable (e.g. antihistamines, antihypertensives, thyroid medications). Deferring medications include: blood thinners (warfarin, heparin, DOACs), isotretinoin (acne), finasteride, dutasteride, and biologics. Always declare all medications on the questionnaire.',
      sources: ['FDA Guidance on Medications', 'AABB 2023 Circular of Information'],
    },
  },
  {
    pattern: /cold|flu|fever|sick|ill|infection|cough/i,
    answer: {
      eligible: false,
      headline: 'Recent illness',
      body: 'If you are currently unwell with cold, flu, or any active infection, please defer your donation until you have been symptom-free for at least 7 days and have completed any antibiotic course.',
      deferralDuration: '1_week',
      sources: ['WHO Blood Donor Selection', 'BTS 2022'],
    },
  },
  {
    pattern: /how often|frequency|how many times|donate again|last donation/i,
    answer: {
      eligible: null,
      headline: 'Donation frequency',
      body: 'Whole blood: every 56 days minimum (males), 84 days recommended (females). Platelets: every 2 days, up to 24 times/year. Plasma: every 28 days. The optimal donation window for whole blood is 56–90 days after your last donation.',
      sources: ['WHO Blood Safety', 'AABB Standards 2023'],
    },
  },
  {
    pattern: /alcohol/i,
    answer: {
      eligible: false,
      headline: 'Alcohol',
      body: 'Do not donate within 24 hours of consuming alcohol. Alcohol dehydrates you and can cause adverse reactions during and after donation.',
      deferralDuration: '1_week',
      sources: ['NHS Blood Donation FAQ'],
    },
  },
  {
    pattern: /travel|abroad|overseas|foreign/i,
    answer: {
      eligible: null,
      headline: 'Travel deferral',
      body: 'Travel to malaria-endemic zones: 12-month deferral. Travel to areas with active Zika, West Nile, or variant CJD risk may also trigger deferral. Disclose all international travel in the last 12 months on your questionnaire.',
      deferralDuration: '12_months',
      sources: ['FDA Travel Donor Deferral Guidance', 'AABB 2023'],
    },
  },
  {
    pattern: /hemoglobin|haemoglobin|hb|anaemia|anemia|iron/i,
    answer: {
      eligible: null,
      headline: 'Haemoglobin level',
      body: 'Minimum Hb on donation day: 12.5 g/dL (females), 13.0 g/dL (males). Anaemia is a temporary deferral — resolve with iron-rich diet (red meat, spinach, lentils, fortified cereals) and re-test after 3 months.',
      sources: ['WHO Blood Donor Selection 2012', 'AABB Standards'],
    },
  },
];

const FALLBACK_ANSWER: QAAnswer = {
  eligible: null,
  headline: 'Consult your donation centre',
  body: 'I could not find a specific rule for your question. Please consult your local blood donation centre or refer to the AABB / WHO Blood Safety guidelines for accurate guidance.',
  sources: ['AABB Standards for Blood Banks 2023', 'WHO Blood Safety & Availability Fact Sheet'],
};

export function answerEligibilityQuestion(question: string): QAAnswer {
  for (const rule of QA_RULES) {
    if (rule.pattern.test(question)) return rule.answer;
  }
  return FALLBACK_ANSWER;
}
