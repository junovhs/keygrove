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
  /** Reference pace for the 'swift' XP bonus only — never a gate. For ladders this is the first rung. */
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

/** Stars come from accuracy and rhythm only. `swiftWpm` is the pace that earns the full XP bonus. */
export interface Gate {
  passAcc: number;
  star2Acc: 97;
  star3Acc: 100;
  star2Rhythm: 0.6;
  star3Rhythm: 0.8;
  swiftWpm: number;
}

/** Bigram movement class under one typing method (research/typing-movements, movement-atlas v2). */
export type MovementClass = 'alternate_hands' | 'same_hand_different_fingers' | 'same_finger_different_key' | 'same_key';
/** One of the v1 technical targets exported from the research candidate sets (provisional, DEC-16). */
export interface TechnicalTransition {
  bigram: string;
  /** Smallest share of all bigram occurrences across the three corpora. */
  minShare: number;
  stability: 'universal';
  classByMethod: Readonly<Record<string, MovementClass>>;
  /** Key-to-key travel in key widths when both keys share a finger under Traditional; 0 otherwise. */
  sameFingerTravel: number;
}
/** A common 3–4 letter chunk practised only inside words in v1. */
export interface Chunk {
  ngram: string;
  minShare: number;
  stability: 'universal' | 'two-corpus';
  features: readonly string[];
}
