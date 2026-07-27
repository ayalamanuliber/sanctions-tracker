export function splitFilterValues(value?: string | null): string[] {
  return (value || "")
    .split(/[,;|]+|\s+\+\s+|\s+or\s+/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function looseNormalize(value?: string | null): string {
  return (value || "")
    .toLowerCase()
    .replace(/\band\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesAnyText(value: string | undefined | null, query?: string | null): boolean {
  const terms = splitFilterValues(query);
  if (terms.length === 0) return true;
  const normalizedValue = looseNormalize(value);
  return terms.some((term) => {
    const normalizedTerm = looseNormalize(term);
    return normalizedTerm.length > 0 && normalizedValue.includes(normalizedTerm);
  });
}

export function matchesTool(value: string | undefined | null, query?: string | null, summary?: string | null): boolean {
  const terms = splitFilterValues(query);
  if (terms.length === 0) return true;
  const haystack = looseNormalize([value, summary].filter(Boolean).join(" "));
  return terms.some((term) => {
    const normalizedTerm = looseNormalize(term);
    return normalizedTerm.length > 0 && haystack.includes(normalizedTerm);
  });
}

export function courtAliases(query?: string | null): string[] {
  const normalized = looseNormalize(query);
  if (!normalized) return [];

  const aliases = new Set([normalized]);
  const districtMatch = normalized.match(/^district\s+(?:of\s+)?(.+)$/);
  if (districtMatch?.[1]) aliases.add(districtMatch[1]);

  const isNewJerseyDistrict = /\bd\s+new jersey\b|\bdistrict\s+of\s+new jersey\b|\bd n j\b|\bdnj\b/.test(normalized);
  if (isNewJerseyDistrict) {
    aliases.add("d new jersey");
    aliases.add("district of new jersey");
    aliases.add("dn j");
    aliases.add("d n j");
  } else if (/\bnew jersey\b|\bnj\b/.test(normalized)) {
    aliases.add("new jersey");
  }
  const newYorkDistrict = normalized.match(/^(?:district of )?(southern|eastern|northern|western) district(?: of)? new york$/)?.[1]
    || normalized.match(/^(s|e|n|w) d new york$/)?.[1]
    || normalized.match(/^(s|e|n|w) d n y$/)?.[1]
    || normalized.match(/^(s|e|n|w)dny$/)?.[1];
  if (newYorkDistrict) {
    const direction = newYorkDistrict.length === 1
      ? { s: "southern", e: "eastern", n: "northern", w: "western" }[newYorkDistrict]
      : newYorkDistrict;
    const initial = direction?.slice(0, 1);
    if (direction && initial) {
      aliases.add(`${direction} district of new york`);
      aliases.add(`${initial} d new york`);
      aliases.add(`${initial} d n y`);
      aliases.add(`${initial}dny`);
    }
  } else if (/\bnew york\b|\bny\b/.test(normalized)) {
    aliases.add("new york");
  }

  return [...aliases].filter(Boolean);
}

export function matchesCourt(value: string | undefined | null, query?: string | null): boolean {
  const aliases = courtAliases(query);
  if (aliases.length === 0) return true;
  const normalizedValue = looseNormalize(value);
  return aliases.some((alias) => normalizedValue.includes(alias) || alias.includes(normalizedValue));
}

export function removeQueryParam(pathname: string, current: Record<string, string | undefined>, key: string): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(current)) {
    if (name === key || !value) continue;
    query.set(name, value);
  }
  const qs = query.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
