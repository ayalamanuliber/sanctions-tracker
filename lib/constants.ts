export const BRAND = {
  colors: {
    primary: '#0066FF',
    primaryDark: '#004ACC',
    background: '#0A0A0A',
    surface: '#111111',
    surfaceHover: '#1a1a1a',
    border: 'rgba(255,255,255,0.08)',
    borderLight: '#e5e7eb',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    textMuted: 'rgba(255,255,255,0.35)',
  },
  severity: {
    'career-ending': { bg: '#7F1D1D', text: '#FCA5A5', border: '#DC2626' },
    'high':          { bg: '#1e3a5f', text: '#93c5fd', border: '#3b82f6' },
    'medium':        { bg: '#713F12', text: '#FDE047', border: '#CA8A04' },
    'low':           { bg: '#1A2E05', text: '#BEF264', border: '#65A30D' },
  },
} as const;

export const ESCALATION_DATA = [
  { amount: 2000,   label: "$2K",     year: "2024", case_name: "Smith v. Farwell" },
  { amount: 2500,   label: "$2.5K",   year: "2025", case_name: "5th Circuit" },
  { amount: 3000,   label: "$3K",     year: "2025", case_name: "Lindell Lawyers" },
  { amount: 5000,   label: "$5K",     year: "2023", case_name: "Mata v. Avianca" },
  { amount: 10000,  label: "$10K",    year: "2025", case_name: "Noland v. Land of Free" },
  { amount: 12000,  label: "$12K",    year: "2026", case_name: "Kansas Patent" },
  { amount: 30000,  label: "$30K",    year: "2026", case_name: "Whiting v. Athens" },
  { amount: 31100,  label: "$31.1K",  year: "2025", case_name: "Lacey v. State Farm" },
  { amount: 109700, label: "$109.7K", year: "2026", case_name: "Brigandi Record" },
];
