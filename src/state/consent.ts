// Marketing consent, as a record.
//
// The account exists to keep progress with a person; the mailing list is a
// separate question with its own unchecked box. What the box said, when it
// was ticked and which app asked are stored beside the answer, so the list can
// show its basis for every address on it. The record lives in the user's auth
// metadata, which needs no table of its own and is queryable from SQL:
//
//   select email, raw_user_meta_data->>'marketing_opt_in_at'
//   from auth.users
//   where raw_user_meta_data->>'marketing_opt_in' = 'true';
//
// The keys and wording are shared with CropASAP and the other Strange Systems
// apps, so one query covers every app's opt-ins.

export const CONSENT_TEXT = 'Get updates on new Strange Systems apps & occasional offers.';

export const CONSENT_SOURCE = 'keygrove';

export interface ConsentRecord {
  marketing_opt_in: boolean;
  marketing_opt_in_at: string | null;
  marketing_source: string;
  marketing_consent_text: string;
}

/** The metadata to store for an answer given now. Opting out clears the time. */
export function consentRecord(optedIn: boolean, now: Date = new Date()): ConsentRecord {
  return {
    marketing_opt_in: optedIn,
    marketing_opt_in_at: optedIn ? now.toISOString() : null,
    marketing_source: CONSENT_SOURCE,
    marketing_consent_text: CONSENT_TEXT,
  };
}

/** Whether metadata written by any Strange Systems app records an opt-in. */
export function hasOptedIn(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') return false;
  const value = (metadata as { marketing_opt_in?: unknown }).marketing_opt_in;
  return value === true || value === 'true';
}
