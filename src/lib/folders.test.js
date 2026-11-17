import test from 'node:test';
import assert from 'node:assert/strict';
import { isFolderOpen, toggleFolder, isExamStatsExpanded, toggleExamStats } from './folders.js';
import { makeSampleData } from './grades.js';
import { isValidData, loadData, saveData } from './storage.js';

test('Year and term collapse survives saving, route changes, and reloading', () => {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };
  const original = makeSampleData();
  const yid = original.years[0].id;
  const tid = original.years[0].semesters[0].id;
  assert.equal(isFolderOpen(original, 'year', yid), true);
  assert.equal(isFolderOpen(original, 'term', tid), true);
  toggleFolder(original, 'year', yid);
  toggleFolder(original, 'term', tid);
  saveData(original);
  const restored = loadData();
  assert.equal(isValidData(restored), true);
  assert.equal(isFolderOpen(restored, 'year', yid), false);
  assert.equal(isFolderOpen(restored, 'term', tid), false);
  toggleFolder(restored, 'year', yid);
  assert.equal(isFolderOpen(restored, 'year', yid), true);
  assert.equal(isFolderOpen(restored, 'term', tid), false);
});

test('Old backups with no ui field default to expanded', () => {
  const older = makeSampleData();
  assert.equal(isFolderOpen(older, 'year', older.years[0].id), true);
  assert.equal(isFolderOpen(older, 'term', older.years[0].semesters[0].id), true);
});


test('Midterm and Final details start hidden and expand independently', () => {
  const data = makeSampleData();
  assert.equal(isExamStatsExpanded(data, 'midterm-a1'), false);
  assert.equal(isExamStatsExpanded(data, 'final-b2'), false);
  toggleExamStats(data, 'midterm-a1');
  assert.equal(isExamStatsExpanded(data, 'midterm-a1'), true);
  assert.equal(isExamStatsExpanded(data, 'final-b2'), false);
  toggleExamStats(data, 'final-b2');
  assert.equal(isExamStatsExpanded(data, 'midterm-a1'), true);
  assert.equal(isExamStatsExpanded(data, 'final-b2'), true);
  toggleExamStats(data, 'midterm-a1');
  assert.equal(isExamStatsExpanded(data, 'midterm-a1'), false);
  assert.equal(isExamStatsExpanded(data, 'final-b2'), true);
});

test('Expanded exam details and optional exam stats survive a reload', () => {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };
  const data = makeSampleData();
  const course = data.years[0].semesters[0].courses[0];
  const examId = 'an-assessment-id';
  course.groupStats = {midterm: {min:'7', max:'30', mean:'19.5', sd:'4.5', n:'60'}, final: {min:'',max:'',mean:'',sd:'',n:''}};
  toggleExamStats(data, examId);
  saveData(data);
  const restored = loadData();
  assert.equal(isExamStatsExpanded(restored, examId), true);
  assert.equal(restored.years[0].semesters[0].courses[0].groupStats.midterm.mean, '19.5');
  assert.equal(isExamStatsExpanded(restored, 'another-assessment-id'), false);
});
