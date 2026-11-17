/**
 * Folder open/closed preferences travel with the rest of the user's GradeHub
 * data (and therefore with the JSON export). The v1 schema has no UI field;
 * missing preferences mean open, so older saved data remains compatible.
 */
export function isFolderOpen(data, kind, id) {
  const key = kind === 'year' ? 'collapsedYears' : 'collapsedTerms';
  const closed = data?.ui?.[key];
  return !Array.isArray(closed) || !closed.includes(id);
}

export function toggleFolder(data, kind, id) {
  if (kind !== 'year' && kind !== 'term') throw new Error('Unknown folder kind');
  const key = kind === 'year' ? 'collapsedYears' : 'collapsedTerms';
  if (!data.ui || typeof data.ui !== 'object' || Array.isArray(data.ui)) data.ui = {};
  const closed = Array.isArray(data.ui[key]) ? data.ui[key] : [];
  data.ui[key] = closed.includes(id)
    ? closed.filter(item => item !== id)
    : [...closed, id];
}

/** Exam details are collapsed by default. We persist expanded assessment IDs,
 * rather than their positions, so reordering scores does not reset the UI.
 */
export function isExamStatsExpanded(data, assessmentId) {
  return Array.isArray(data?.ui?.expandedExamStats) && data.ui.expandedExamStats.includes(assessmentId);
}

export function toggleExamStats(data, assessmentId) {
  if (!data.ui || typeof data.ui !== 'object' || Array.isArray(data.ui)) data.ui = {};
  const expanded = Array.isArray(data.ui.expandedExamStats) ? data.ui.expandedExamStats : [];
  data.ui.expandedExamStats = expanded.includes(assessmentId)
    ? expanded.filter(id => id !== assessmentId)
    : [...expanded, assessmentId];
}
