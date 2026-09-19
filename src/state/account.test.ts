import { describe, expect, test } from 'vitest';
import { readSupabaseConfig, sessionStorageKey, shippedConfig } from './supabase';
import { CONSENT_SOURCE, CONSENT_TEXT, consentRecord, hasOptedIn } from './consent';
import { linkProblem, withoutLinkProblem } from '../ui/account';

describe('supabase config', () => {
  test('an empty pair means no account service; a half-set pair is a mistake', () => {
    expect(readSupabaseConfig({})).toBeNull();
    expect(readSupabaseConfig({ url: '', publishableKey: ' ' })).toBeNull();
    expect(() => readSupabaseConfig({ url: 'https://x.supabase.co' })).toThrow(/both/);
    expect(() => readSupabaseConfig({ publishableKey: 'sb_publishable_x' })).toThrow(/both/);
  });

  test('plain http is only allowed for local development', () => {
    expect(() => readSupabaseConfig({ url: 'http://x.supabase.co', publishableKey: 'sb_publishable_x' })).toThrow(/HTTPS/);
    expect(readSupabaseConfig({ url: 'http://localhost:54321/', publishableKey: 'sb_publishable_x' }))
      .toEqual({ url: 'http://localhost:54321', publishableKey: 'sb_publishable_x' });
    expect(() => readSupabaseConfig({ url: 'not a url', publishableKey: 'sb_publishable_x' })).toThrow(/valid URL/);
  });

  test('a secret key never reaches a browser bundle', () => {
    const url = 'https://x.supabase.co';
    expect(() => readSupabaseConfig({ url, publishableKey: 'sb_secret_abc' })).toThrow(/secret/);
    expect(() => readSupabaseConfig({ url, publishableKey: 'service_role_key' })).toThrow(/secret/);
    const b64url = (json: string): string => btoa(json).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
    const serviceJwt = `eyJhbGciOiJIUzI1NiJ9.${b64url('{"role":"service_role"}')}.sig`;
    expect(() => readSupabaseConfig({ url, publishableKey: serviceJwt })).toThrow(/secret/);
    const anonJwt = `eyJhbGciOiJIUzI1NiJ9.${b64url('{"role":"anon"}')}.sig`;
    expect(readSupabaseConfig({ url, publishableKey: anonJwt })?.publishableKey).toBe(anonJwt);
  });

  test('the shipped configuration is the shared Strange Systems project and its storage key follows the ref', () => {
    const config = shippedConfig();
    expect(config).not.toBeNull();
    expect(config!.url).toMatch(/^https:\/\/[a-z]+\.supabase\.co$/);
    expect(config!.publishableKey).toMatch(/^sb_publishable_/);
    expect(sessionStorageKey(config!)).toBe(`sb-${new URL(config!.url).hostname.split('.')[0]}-auth-token`);
  });
});

describe('marketing consent', () => {
  test('is recorded with its wording, time and source; opting out clears the time', () => {
    const at = new Date('2026-09-18T12:00:00Z');
    expect(consentRecord(true, at)).toEqual({
      marketing_opt_in: true,
      marketing_opt_in_at: '2026-09-18T12:00:00.000Z',
      marketing_source: CONSENT_SOURCE,
      marketing_consent_text: CONSENT_TEXT,
    });
    expect(consentRecord(false, at).marketing_opt_in_at).toBeNull();
    expect(CONSENT_SOURCE).toBe('keygrove');
    // The sentence is shared with CropASAP so one query covers every app's list.
    expect(CONSENT_TEXT).toBe('Get updates on new Strange Systems apps & occasional offers.');
  });

  test('an opt-in is read from metadata written by any sibling app', () => {
    expect(hasOptedIn({ marketing_opt_in: true })).toBe(true);
    expect(hasOptedIn({ marketing_opt_in: 'true' })).toBe(true);
    expect(hasOptedIn({ marketing_opt_in: false })).toBe(false);
    expect(hasOptedIn({})).toBe(false);
    expect(hasOptedIn(null)).toBe(false);
  });
});

describe('emailed links', () => {
  test('a broken link is explained in plain words, from the query or the hash', () => {
    const expired = 'error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
    expect(linkProblem(`?${expired}`, '')).toMatch(/already used or has expired.*sign in with your password/);
    expect(linkProblem('', `#${expired}`)).toMatch(/already used or has expired/);
    expect(linkProblem('?error=server_error&error_code=unexpected_failure', '')).toMatch(/could not be used/);
    expect(linkProblem('', '')).toBeNull();
    expect(linkProblem('?code=abc', '#access_token=x')).toBeNull();
    expect(withoutLinkProblem(`?${expired}`, `#${expired}`)).toEqual({ search: '', hash: '' });
    expect(withoutLinkProblem('?keep=1&error_code=otp_expired', '#type=recovery&error=x')).toEqual({ search: '?keep=1', hash: '#type=recovery' });
  });
});
