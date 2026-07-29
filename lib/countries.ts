type CountryMeta = {
  code: string | null;
  name: string;
  numeric: string | null;
};

const COUNTRY_META: Record<string, CountryMeta> = {
  AE: { code: "AE", name: "United Arab Emirates", numeric: "784" },
  Argentina: { code: "AR", name: "Argentina", numeric: "032" },
  Australia: { code: "AU", name: "Australia", numeric: "036" },
  Austria: { code: "AT", name: "Austria", numeric: "040" },
  Belgium: { code: "BE", name: "Belgium", numeric: "056" },
  Brazil: { code: "BR", name: "Brazil", numeric: "076" },
  Canada: { code: "CA", name: "Canada", numeric: "124" },
  Chile: { code: "CL", name: "Chile", numeric: "152" },
  China: { code: "CN", name: "China", numeric: "156" },
  Colombia: { code: "CO", name: "Colombia", numeric: "170" },
  "Costa Rica": { code: "CR", name: "Costa Rica", numeric: "188" },
  "Czech Republic": { code: "CZ", name: "Czech Republic", numeric: "203" },
  Denmark: { code: "DK", name: "Denmark", numeric: "208" },
  France: { code: "FR", name: "France", numeric: "250" },
  GB: { code: "GB", name: "United Kingdom", numeric: "826" },
  Germany: { code: "DE", name: "Germany", numeric: "276" },
  "Hong Kong": { code: "HK", name: "Hong Kong", numeric: "344" },
  India: { code: "IN", name: "India", numeric: "356" },
  Ireland: { code: "IE", name: "Ireland", numeric: "372" },
  Israel: { code: "IL", name: "Israel", numeric: "376" },
  Italy: { code: "IT", name: "Italy", numeric: "380" },
  Kenya: { code: "KE", name: "Kenya", numeric: "404" },
  Netherlands: { code: "NL", name: "Netherlands", numeric: "528" },
  "New Zealand": { code: "NZ", name: "New Zealand", numeric: "554" },
  "Northern Cyprus (KKTC)": {
    code: "CY",
    name: "Northern Cyprus (KKTC)",
    numeric: "196",
  },
  "Papua New Guinea": {
    code: "PG",
    name: "Papua New Guinea",
    numeric: "598",
  },
  Poland: { code: "PL", name: "Poland", numeric: "616" },
  Portugal: { code: "PT", name: "Portugal", numeric: "620" },
  Qatar: { code: "QA", name: "Qatar", numeric: "634" },
  "Russian Federation": { code: "RU", name: "Russian Federation", numeric: "643" },
  Singapore: { code: "SG", name: "Singapore", numeric: "702" },
  "South Africa": { code: "ZA", name: "South Africa", numeric: "710" },
  "South Korea": { code: "KR", name: "South Korea", numeric: "410" },
  Spain: { code: "ES", name: "Spain", numeric: "724" },
  Tanzania: { code: "TZ", name: "Tanzania", numeric: "834" },
  "The Bahamas": { code: "BS", name: "The Bahamas", numeric: "044" },
  "Trinidad & Tobago": {
    code: "TT",
    name: "Trinidad & Tobago",
    numeric: "780",
  },
  Uganda: { code: "UG", name: "Uganda", numeric: "800" },
  US: { code: "US", name: "United States", numeric: "840" },
  Zimbabwe: { code: "ZW", name: "Zimbabwe", numeric: "716" },
  "International Arbitration": {
    code: null,
    name: "International Arbitration",
    numeric: null,
  },
  UNKNOWN: { code: null, name: "Country not recorded", numeric: null },
};

function regionalFlag(code: string | null) {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((character) => 127397 + character.charCodeAt(0)),
  );
}

export function countryMeta(value: string | null | undefined): CountryMeta {
  if (!value) return COUNTRY_META.UNKNOWN;
  return (
    COUNTRY_META[value] || {
      code: null,
      name: value,
      numeric: null,
    }
  );
}

export function countryFlag(value: string | null | undefined) {
  return regionalFlag(countryMeta(value).code);
}

export function countryDisplayName(value: string | null | undefined) {
  return countryMeta(value).name;
}

export function countryNumericCode(value: string | null | undefined) {
  return countryMeta(value).numeric;
}

export function countryOptionLabel(
  value: string | null | undefined,
  count?: number,
) {
  const suffix = typeof count === "number" ? ` (${count.toLocaleString()})` : "";
  return `${countryFlag(value)} ${countryDisplayName(value)}${suffix}`;
}
