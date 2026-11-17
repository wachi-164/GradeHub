import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { examKeyForAssessment, createCourse } from './grades.js';

const source = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

test('Midterm and Final rows are identified in all grading modes', () => {
  for (const gradingMode of ['automatic', 'manual', 'group']) {
    const course = createCourse({ name: 'Testing', credits: 3, gradingMode });
    course.assessments = [
      { id: 'mid', label: 'Midterm', maxPoints: 30, earned: '19' },
      { id: 'fin', label: 'Final', maxPoints: 70, earned: '' },
    ];
    assert.equal(examKeyForAssessment(course.assessments[0]), 'midterm');
    assert.equal(examKeyForAssessment(course.assessments[1]), 'final');
    assert.equal(examKeyForAssessment({ label: 'Quiz 1' }), null);
    assert.equal(examKeyForAssessment({ label: 'Mid Term' }), 'midterm');
    assert.equal(examKeyForAssessment({ label: 'Mid-term' }), 'midterm');
  }
});

test('The JSX renders the exam button and stats regardless of course grading mode', () => {
  assert.equal((source.match(/\{examKeyForAssessment\(item\) &&/g) ?? []).length, 2);
  assert.doesNotMatch(source, /course\.gradingMode === 'group' && examKeyForAssessment\(item\)/);
  assert.match(source, /className="exam-details-toggle"/);
  assert.match(source, /onClick=\{\(\) => onToggleExamStats\(item\.id\)\}/);
  assert.match(source, /hidden=\{!expandedExamStats\.includes\(item\.id\)\}/);
  assert.match(styles, /\.assessment-inline-stats\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});
