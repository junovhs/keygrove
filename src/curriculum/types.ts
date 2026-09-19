/** One stage of a trail: pure new-key rhythm, blended with the old set, or real words. */
export type StageName = 'drill' | 'mix' | 'words';
export const STAGES: readonly StageName[] = ['drill', 'mix', 'words'];

/** Which generator family produces a trail's text. */
export type TextKind =
  | 'rhythm' | 'words' | 'lower-sentences' | 'caps' | 'sentences'
  | 'numbers' | 'symbols' | 'bigrams' | 'top' | 'quotes' | 'long' | 'code';

export type GroveId = 'roots' | 'home' | 'canopy' | 'undergrowth' | 'bark' | 'rings' | 'flow' | 'code';

/** A world on the map. Gate numbers here are defaults; a trail may override. */
export interface Grove {
  id: GroveId;
  n: number;
  name: string;
  blurb: string;
  /** Accuracy (0–100) required to pass any stage in this grove. */
  passAcc: number;
  /** WPM for ★★ (★★★ = ×1.2). For ladders this is the first rung. */
  wpmTarget: number;
  /** Flow grove: per-star WPM rungs. */
  ladder?: readonly number[];
  /** Optional groves branch off the main path and never gate it. */
  optional?: boolean;
  /** For an optional grove: the checkpoint trail that opens it. */
  opensAfter?: string;
}

/** A level. `newKeys` are the literal characters introduced; `shift` marks the Shift trail. */
export interface Trail {
  id: string;
  n: number;
  grove: GroveId;
  name: string;
  newKeys: string;
  shift?: boolean;
  space?: boolean;
  checkpoint?: boolean;
  kind: TextKind;
  /** Target length in characters for the words stage. */
  length: number;
  blurb?: string;
  passAcc?: number;
  wpmTarget?: number;
}

export interface Gate {
  passAcc: number;
  star2Wpm: number;
  star3Wpm: number;
  star2Acc: 97;
  star3Acc: 100;
}
