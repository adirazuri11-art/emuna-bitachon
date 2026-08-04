import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  countWords,
  sanitizeGiftMessage,
  validateGiftMessage,
  giftWrapCharge,
  GIFT_WRAP_PRICE,
  GIFT_WRAP_MAX_WORDS,
} from '../.test-build/gift-wrap.js';

const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');

// ---- countWords ----
test('single word = 1', () => assert.equal(countWords('שלום'), 1));
test('empty = 0', () => assert.equal(countWords(''), 0));
test('whitespace only = 0', () => assert.equal(countWords('   \n\t  '), 0));
test('double/multiple spaces collapse', () => assert.equal(countWords('מזל    טוב'), 2));
test('newlines separate words', () => assert.equal(countWords('מזל\nטוב\n\nלכם'), 3));
test('leading/trailing spaces trimmed', () => assert.equal(countWords('   מזל טוב   '), 2));
test('hebrew with attached punctuation = one word each', () =>
  assert.equal(countWords('מזל, טוב! ברכה.'), 3));
test('exactly 100 words', () => assert.equal(countWords(words(100)), 100));
test('101 words', () => assert.equal(countWords(words(101)), 101));
test('pasted text with zero-width chars normalized', () =>
  assert.equal(countWords('מזל​טוב ‍ לכם﻿'), 2));
test('nbsp treated as space', () => assert.equal(countWords('מזל טוב'), 2));

// ---- sanitize ----
test('strips html tags', () =>
  assert.equal(sanitizeGiftMessage('שלום <b>עולם</b>'), 'שלום עולם'));
test('strips script payload', () => {
  const out = sanitizeGiftMessage('<script>alert(1)</script>ברכה');
  assert.ok(!/[<>]/.test(out));
  assert.ok(out.includes('ברכה'));
});
test('preserves newlines and emoji', () => {
  const out = sanitizeGiftMessage('שורה1\nשורה2 🎁');
  assert.ok(out.includes('\n'));
  assert.ok(out.includes('🎁'));
});

// ---- validate ----
test('valid message ok', () => {
  const v = validateGiftMessage('מזל טוב לכם');
  assert.equal(v.ok, true);
  assert.equal(v.wordCount, 3);
});
test('empty message invalid', () => {
  const v = validateGiftMessage('   ');
  assert.equal(v.ok, false);
  assert.match(v.error, /לכתוב/);
});
test('100 words valid', () => assert.equal(validateGiftMessage(words(100)).ok, true));
test('101 words invalid', () => {
  const v = validateGiftMessage(words(101));
  assert.equal(v.ok, false);
  assert.match(v.error, /100 מילים/);
});
test('html-only becomes empty and is rejected', () => {
  const v = validateGiftMessage('<img src=x onerror=alert(1)>');
  assert.equal(v.ok, false);
});

// ---- pricing (server source of truth) ----
test('charge is 10 once when selected with items', () =>
  assert.equal(giftWrapCharge(true, true), GIFT_WRAP_PRICE));
test('charge 0 when not selected', () => assert.equal(giftWrapCharge(false, true), 0));
test('charge 0 when selected but cart empty', () => assert.equal(giftWrapCharge(true, false), 0));
test('price constant is 10 and max words 100', () => {
  assert.equal(GIFT_WRAP_PRICE, 10);
  assert.equal(GIFT_WRAP_MAX_WORDS, 100);
});
