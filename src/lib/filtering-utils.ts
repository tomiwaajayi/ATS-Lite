// Filtering utilities inspired by MCP approach but reimplemented differently
/**
 * Text normalization for consistent comparisons
 */
export function normalizeString(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // normalize whitespace
    .replace(/[^\w\s]/g, ''); // remove punctuation
}

/**
 * Check if any search terms match within a semicolon-separated string field
 * Supports regex patterns in /pattern/flags format
 */
export function matchesInSeparatedString(
  searchTerms: string | string[] | undefined,
  candidateValue: string | undefined
): boolean {
  if (!searchTerms || !candidateValue) return false;

  const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  const values = candidateValue.split(';').map(v => v.trim());
  const normalizedValues = values.map(v => normalizeString(v));

  return terms.some(term => {
    // Handle regex patterns
    if (typeof term === 'string' && term.startsWith('/') && term.includes('/')) {
      try {
        const lastSlashIndex = term.lastIndexOf('/');
        const pattern = term.slice(1, lastSlashIndex);
        const flags = term.slice(lastSlashIndex + 1);
        const regex = new RegExp(pattern, flags);
        return values.some(value => regex.test(value));
      } catch {
        // Fall back to string matching if regex is invalid
        const normalizedTerm = normalizeString(term);
        return normalizedValues.some(value => value.includes(normalizedTerm));
      }
    }

    // Regular string matching
    const normalizedTerm = normalizeString(term);
    return normalizedValues.some(value => value.includes(normalizedTerm));
  });
}

/**
 * Check if search terms match a single string field (like location or name)
 * Supports regex patterns in /pattern/flags format
 */
export function matchesInSingleString(
  searchTerms: string | string[] | undefined,
  candidateValue: string | undefined
): boolean {
  if (!searchTerms || !candidateValue) return false;

  const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  const normalizedValue = normalizeString(candidateValue);

  return terms.some(term => {
    // Handle regex patterns
    if (typeof term === 'string' && term.startsWith('/') && term.includes('/')) {
      try {
        const lastSlashIndex = term.lastIndexOf('/');
        const pattern = term.slice(1, lastSlashIndex);
        const flags = term.slice(lastSlashIndex + 1);
        const regex = new RegExp(pattern, flags);
        return regex.test(candidateValue);
      } catch {
        // Fall back to string matching if regex is invalid
        return normalizedValue.includes(normalizeString(term));
      }
    }

    // Regular string matching
    return normalizedValue.includes(normalizeString(term));
  });
}

/**
 * Check if ALL search terms are present in a semicolon-separated string field
 */
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

/**
 * Check numeric range conditions
 */
export function isInRange(value: number | undefined, min?: number, max?: number): boolean {
  if (value === undefined || value === null) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

/**
 * Convert boolean-like strings to actual booleans for filtering
 */
export function parseBoolean(value: string | boolean): boolean {
  if (typeof value === 'boolean') return value;
  const normalized = normalizeString(value.toString());
  return normalized === 'yes' || normalized === 'true' || normalized === '1';
}

/**
 * Get array of skills from semicolon-separated string
 */
export function getSkillsArray(skillsString: string | undefined): string[] {
  if (!skillsString) return [];
  return skillsString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Get array of languages from semicolon-separated string
 */
export function getLanguagesArray(languagesString: string | undefined): string[] {
  if (!languagesString) return [];
  return languagesString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Get array of citizenships from semicolon-separated string
 */
export function getCitizenshipsArray(citizenshipsString: string | undefined): string[] {
  if (!citizenshipsString) return [];
  return citizenshipsString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Get array of tags from semicolon-separated string
 */
export function getTagsArray(tagsString: string | undefined): string[] {
  if (!tagsString) return [];
  return tagsString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}
