/** Writes sample reports to docs/samples/ using the same renderer as the browser. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { run } from '../tests/helpers';
import { buildView } from '../engine';
import { buildReport } from '../ui/report/pdf';
import { ROOT } from './lib/load-rules';

const font = (f: string) => readFileSync(join(ROOT, 'public', 'fonts', f)).toString('binary');
const assets = {
  fonts: { regular: font('Inter-Regular.ttf'), semibold: font('Inter-SemiBold.ttf'), extrabold: font('Inter-ExtraBold.ttf') },
  logo: 'data:image/png;base64,' + readFileSync(join(ROOT, 'public', 'assets', 'bizmatrix-logo.png')).toString('base64'),
};

const samples: [string, Record<string, unknown>, [string, string][], string][] = [
  [
    'mandatory-trader',
    { constitution: 'partnership', aggregate_turnover_lakh: 50, premises_type: 'rented_registered_agreement' },
    [['Business type', 'Partnership firm'], ['State / UT', 'Maharashtra'], ['You sell', 'Goods'], ['Turnover (this FY)', 'More than ₹40 lakh'], ['Where you sell', 'Only within my State'], ['Special cases', 'None'], ['Premises', 'Rented, registered agreement']],
    'More than ₹40 lakh',
  ],
  [
    'not-required-consultant',
    { supply_nature: 'services_only', aggregate_turnover_lakh: 15 },
    [['Business type', 'Proprietorship'], ['State / UT', 'Maharashtra'], ['You sell', 'Services'], ['Turnover (this FY)', '₹10 – 20 lakh'], ['Where you sell', 'Only within my State'], ['Special cases', 'None']],
    '₹10 – 20 lakh',
  ],
  [
    'confirm-points',
    { supply_nature: 'services_only', aggregate_turnover_lakh: 15, interstate_taxable_supply: true, makes_exports: true, premises_type: 'owned' },
    [['Business type', 'Proprietorship'], ['State / UT', 'Maharashtra'], ['You sell', 'Services'], ['Turnover (this FY)', '₹10 – 20 lakh'], ['Where you sell', 'Exports outside India'], ['Special cases', 'None'], ['Premises', 'Owned']],
    '₹10 – 20 lakh',
  ],
];

const dir = join(ROOT, 'docs', 'samples');
mkdirSync(dir, { recursive: true });
for (const [name, over, inputs, band] of samples) {
  const { facts, a, checklist } = run(over as never);
  const doc = buildReport(buildView(facts, a, checklist), inputs, band, assets);
  writeFileSync(join(dir, `${name}.pdf`), Buffer.from(doc.output('arraybuffer')));
}
console.log('✓ wrote sample reports to docs/samples/');
