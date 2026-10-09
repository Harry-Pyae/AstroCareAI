import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { baselineExplanation, localizedDate, translate } from './index.ts';
import { computeBaselines } from '../lib/baseline.ts';

const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const en = read('./en.json');
const my = read('./my.json');
assert.deepEqual(Object.keys(en).sort(), Object.keys(my).sort(), 'Language key parity');
const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
for (const key of Object.keys(en)) {
  assert.ok(my[key].trim(), `Empty Myanmar translation: ${key}`);
  assert.deepEqual(placeholders(en[key]), placeholders(my[key]), `Placeholder mismatch: ${key}`);
}
const activeFiles = [
  '../components/LanguageSwitcher.tsx', '../components/layout/TopBar.tsx', '../components/layout/Nav.tsx', '../components/layout/Layout.tsx', '../components/layout/CrewSelectPage.tsx',
  '../screens/BriefScreen.tsx', '../screens/CheckinScreen.tsx', '../routes.tsx', '../components/qr/CrewQR.tsx', '../components/spaceweather/SpaceWeatherCard.tsx',
  '../components/brief/BaselineComparison.tsx', '../components/brief/DecisionBar.tsx', '../components/brief/TaskCard.tsx', '../components/brief/format.ts',
  '../components/brief/SelfReportCard.tsx', '../components/demo/DemoMenu.tsx', '../components/demo/ExploreDemoEntry.tsx', '../components/demo/DemoGuide.tsx',
];
for (const file of activeFiles) {
  const source = ts.createSourceFile(file, readFileSync(new URL(file, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      assert.ok(node.arguments[0].text in en, `Missing key ${node.arguments[0].text} in ${file}`);
    }
    if (ts.isJsxText(node)) {
      const text = node.text.trim();
      assert.ok(!/[A-Za-z]/.test(text) || ['ASTROCARE', 'EN'].includes(text), `Untranslated JSX text in ${file}: ${text}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
for (const member of read('../data/crew.json')) assert.ok(member.role in my);
for (const task of read('../data/tasks.json')) {
  assert.ok(task.title in my);
  for (const demand of task.attentionDemands) assert.ok(demand in my);
}
const observations = read('../data/observations.json');
for (const crewId of ['ac-cmdr-01', 'ac-eng-02', 'ac-sci-03']) {
  for (const result of computeBaselines(observations, crewId, new Date('2026-10-09T06:00:00Z'))) {
    const explanation = baselineExplanation(result, 'my');
    assert.ok(/[\u1000-\u109f]/.test(explanation));
    assert.ok(!/[{}]/.test(explanation));
    assert.equal(baselineExplanation(result, 'en'), result.explanation);
  }
}
assert.ok(translate('my', 'overview.change', { metric: 'အိပ်ချိန်', current: '5.84 h', delta: 20, direction: translate('my', 'below') }).includes('5.84 h'));
assert.ok(localizedDate('2026-10-09T06:00:00Z', 'my').includes('2026') === false); // default date intentionally omits year
assert.equal(translate('en', 'points'), 'points');
console.log(`PASS: ${Object.keys(en).length} bilingual keys, placeholder parity, all active JSX labels, seed task/role coverage, and dynamic baseline translations.`);
