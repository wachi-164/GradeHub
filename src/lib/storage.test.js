import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, isValidData, loadData, saveData } from './storage.js';
import { makeSampleData } from './grades.js';

test('A valid backup roundtrips with localStorage', () => {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };
  const original = makeSampleData();
  assert.equal(isValidData(original), true);
  saveData(original);
  assert.ok(memory.has(STORAGE_KEY));
  assert.deepEqual(loadData(), original);
});

test('Corrupted backup data is rejected', () => {
  assert.equal(isValidData({ version: 1, years: [{ id: 'x', number: 1 }] }), false);
  assert.equal(isValidData({ version: 2, years: [] }), false);
});


test('Group grading reference stats survive JSON backup without becoming a final GPA', async () => {
  const { createCourse, createYear, createSemester, cumulativeStats } = await import('./grades.js');
  const c = createCourse({name:'Statistics', credits:3, gradingMode:'group', groupGrade:'', classMeanGpa:2.85});
  c.groupStats.midterm.mean='47.3';
  c.groupStats.final.sd='12.1';
  const y=createYear(1), term=createSemester(1,'current');term.courses.push(c);y.semesters.push(term);
  const doc={version:1,years:[y]};
  assert.ok(isValidData(doc));
  const roundtrip=JSON.parse(JSON.stringify(doc));
  assert.equal(roundtrip.years[0].semesters[0].courses[0].groupStats.final.sd,'12.1');
  assert.equal(cumulativeStats(roundtrip).gpa,null);
});

test('Old backups without bonus fields remain valid, and new bonus fields survive roundtrip', async () => {
  const { createCourse, createYear, createSemester, evaluateCourse } = await import('./grades.js');
  const c = createCourse({name:'Math', credits:3});
  delete c.bonusPoints;
  delete c.bonusBreakdown;
  const y=createYear(1), t=createSemester(1,'current');
  t.courses.push(c); y.semesters.push(t);
  const old={version:1,years:[y]};
  assert.equal(isValidData(old), true);
  c.bonusBreakdown='+1+2';
  c.bonusPoints='2';
  assert.equal(isValidData(old), true);
  const exported=JSON.parse(JSON.stringify(old));
  assert.equal(exported.years[0].semesters[0].courses[0].bonusPoints,'2');
  assert.equal(evaluateCourse(exported.years[0].semesters[0].courses[0]).bonusPoints,2);
  c.bonusPoints='99999';
  assert.equal(isValidData(old),false);
});

test('v1.4 Bonus migration preserves earned points and notes without double-counting', async () => {
  const {normalizeData}=await import('./storage.js');
  const {createCourse,createYear,createSemester,evaluateCourse}=await import('./grades.js');
  const course=createCourse({name:'Old bonus',credits:3,maxScore:100,bonusBreakdown:'+1+2',bonusPoints:'3'});
  course.assessments=[{id:'m',label:'Total',maxPoints:100,earned:'77',status:'green'}];
  const sem=createSemester(1,'completed');sem.courses=[course];
  const year=createYear(1);year.semesters=[sem];
  const old={version:1,years:[year]};
  assert.equal(evaluateCourse(course).earned,80);
  const migrated=normalizeData(old);
  const saved=migrated.years[0].semesters[0].courses[0];
  assert.equal(saved.assessments.length,2);
  assert.equal(saved.assessments[1].type,'bonus');
  assert.equal(saved.assessments[1].breakdown,'+1+2');
  assert.equal(saved.assessments[1].earned,'3');
  assert.equal(evaluateCourse(saved).earned,80);
  assert.equal(evaluateCourse(saved).grade,'A');
  assert.equal(evaluateCourse(saved).totalAllocated,100);
  assert.equal(normalizeData(migrated).years[0].semesters[0].courses[0].assessments.length,2);
  assert.equal(isValidData(migrated),true);
});
