import type { Paise } from './money.ts';

/** One line of a computation sheet. `ref` carries the section and the rule ID it came from. */
export interface TraceLine {
  label: string;
  amount: Paise | null;
  ref: string;
  note?: string;
}

export class Trace {
  readonly lines: TraceLine[] = [];
  readonly warnings: string[] = [];

  add(label: string, amount: Paise | null, ref = '', note?: string): void {
    this.lines.push(note === undefined ? { label, amount, ref } : { label, amount, ref, note });
  }

  note(label: string, ref = ''): void {
    this.lines.push({ label, amount: null, ref });
  }

  warn(message: string): void {
    if (!this.warnings.includes(message)) this.warnings.push(message);
  }
}
