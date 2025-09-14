// Helper functions for matching and filtering candidates
// Clean up text for better matching
export function normalizeString(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // fix weird spacing
    .replace(/[^\w\s]/g, ''); // strip punctuation
}

// Check skills, languages, etc (semicolon-separated fields)
// Also handles regex like /Backend/i
export function matchesInSeparatedString(
  searchTerms: string | string[] | undefined,
  candidateValue: string | undefined
): boolean {
  if (!searchTerms || !candidateValue) return false;

  const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  const values = candidateValue.split(';').map(v => v.trim());
  const normalizedValues = values.map(v => normalizeString(v));

  return terms.some(term => {
    // Try regex first
    if (typeof term === 'string' && term.startsWith('/') && term.includes('/')) {
      try {
        const lastSlashIndex = term.lastIndexOf('/');
        const pattern = term.slice(1, lastSlashIndex);
        const flags = term.slice(lastSlashIndex + 1);
        const regex = new RegExp(pattern, flags);
        return values.some(value => regex.test(value));
      } catch {
        // Bad regex? Just do normal matching
        const normalizedTerm = normalizeString(term);
        return normalizedValues.some(value => value.includes(normalizedTerm));
      }
    }

    // Normal text matching
    const normalizedTerm = normalizeString(term);
    return normalizedValues.some(value => value.includes(normalizedTerm));
  });
}

// Check single text fields like name or location
// Also handles regex patterns
export function matchesInSingleString(
  searchTerms: string | string[] | undefined,
  candidateValue: string | undefined
): boolean {
  if (!searchTerms || !candidateValue) return false;

  const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  const normalizedValue = normalizeString(candidateValue);

  return terms.some(term => {
    // Try regex first
    if (typeof term === 'string' && term.startsWith('/') && term.includes('/')) {
      try {
        const lastSlashIndex = term.lastIndexOf('/');
        const pattern = term.slice(1, lastSlashIndex);
        const flags = term.slice(lastSlashIndex + 1);
        const regex = new RegExp(pattern, flags);
        return regex.test(candidateValue);
      } catch {
        // Bad regex? Just do normal matching
        return normalizedValue.includes(normalizeString(term));
      }
    }

    // Normal text matching
    return normalizedValue.includes(normalizeString(term));
  });
}

// Make sure candidate has ALL the required skills/languages
export function containsAllTerms(
  requiredTerms: string[] | undefined,
  candidateValue: string | undefined
): boolean {
  if (!requiredTerms || requiredTerms.length === 0) return true;
  if (!candidateValue) return false;

  const values = candidateValue.split(';').map(v => normalizeString(v.trim()));
  const normalizedTerms = requiredTerms.map(t => normalizeString(t));

  return normalizedTerms.every(term => values.some(value => value.includes(term)));
}

// Check if number is within min/max range
export function isInRange(value: number | undefined, min?: number, max?: number): boolean {
  if (value === undefined || value === null) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

// Convert "Yes"/"No" strings to true/false
export function parseBoolean(value: string | boolean): boolean {
  if (typeof value === 'boolean') return value;
  const normalized = normalizeString(value.toString());
  return normalized === 'yes' || normalized === 'true' || normalized === '1';
}

// Split skills string into array
export function getSkillsArray(skillsString: string | undefined): string[] {
  if (!skillsString) return [];
  return skillsString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

// Split languages string into array
export function getLanguagesArray(languagesString: string | undefined): string[] {
  if (!languagesString) return [];
  return languagesString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

// Split citizenships string into array
export function getCitizenshipsArray(citizenshipsString: string | undefined): string[] {
  if (!citizenshipsString) return [];
  return citizenshipsString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

// Split tags string into array
export function getTagsArray(tagsString: string | undefined): string[] {
  if (!tagsString) return [];
  return tagsString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}
