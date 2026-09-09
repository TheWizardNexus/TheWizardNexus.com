import test from 'node:test';
import assert from 'node:assert/strict';
import {contactAllowance} from '../contact-policy.js';

const NOW = Date.parse('2026-09-09T12:00:00.000Z');
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function acceptedMessage(acceptedAt) {
    return {status: 'accepted', submittedAt: acceptedAt, acceptedAt};
}

test('an empty contact history allows the first message and offers three daily slots', function emptyContactHistory() {
    const allowance = contactAllowance([], NOW);

    assert.equal(allowance.allowed, true);
    assert.equal(allowance.remaining, 3);
    assert.equal(allowance.acceptedToday, 0);
    assert.equal(allowance.acceptedTotal, 0);
    assert.equal(allowance.reservedToday, 0);
});

test('a second message becomes eligible at exactly fifteen minutes after acceptance', function contactIntervalBoundary() {
    const entries = [acceptedMessage(NOW)];
    const before = contactAllowance(entries, NOW + 15 * MINUTE - 1);
    const atBoundary = contactAllowance(entries, NOW + 15 * MINUTE);

    assert.equal(before.allowed, false);
    assert.equal(before.nextAllowedAt, NOW + 15 * MINUTE);
    assert.equal(atBoundary.allowed, true);
    assert.equal(atBoundary.remaining, 2);
});

test('three messages exhaust the rolling day until the oldest reaches exactly twenty-four hours', function contactDayBoundary() {
    const entries = [
        acceptedMessage(NOW - DAY + MINUTE),
        acceptedMessage(NOW - 2 * HOUR),
        acceptedMessage(NOW - HOUR)
    ];
    const blocked = contactAllowance(entries, NOW);
    const before = contactAllowance(entries, NOW + MINUTE - 1);
    const atBoundary = contactAllowance(entries, NOW + MINUTE);

    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.equal(blocked.acceptedToday, 3);
    assert.equal(blocked.nextAllowedAt, NOW + MINUTE);
    assert.equal(before.allowed, false);
    assert.equal(atBoundary.allowed, true);
    assert.equal(atBoundary.remaining, 1);
    assert.equal(atBoundary.acceptedToday, 2);
    assert.equal(atBoundary.acceptedTotal, 3);
});

test('using the slot released by the oldest message keeps the next rolling-day expiry', function contactSlidingWindow() {
    const entries = [
        acceptedMessage(NOW - HOUR),
        acceptedMessage(NOW - DAY + 2 * HOUR),
        acceptedMessage(NOW - DAY + HOUR)
    ];
    const firstExpiry = NOW + HOUR;

    assert.equal(contactAllowance(entries, firstExpiry).allowed, true);
    entries.push(acceptedMessage(firstExpiry));
    const afterNewMessage = contactAllowance(entries, firstExpiry);

    assert.equal(afterNewMessage.allowed, false);
    assert.equal(afterNewMessage.remaining, 0);
    assert.equal(afterNewMessage.nextAllowedAt, NOW + 2 * HOUR);
    assert.equal(contactAllowance(entries, NOW + 2 * HOUR - 1).allowed, false);
    assert.equal(contactAllowance(entries, NOW + 2 * HOUR).allowed, true);
});

test('sending and uncertain messages reserve slots without increasing accepted counts', function uncertainContactReservations() {
    const entries = [
        acceptedMessage(NOW - 2 * HOUR),
        {status: 'sending', submittedAt: NOW - HOUR},
        {status: 'uncertain', submittedAt: NOW - 30 * MINUTE, settledAt: NOW - MINUTE}
    ];
    const allowance = contactAllowance(entries, NOW);
    const uncertainOnly = contactAllowance([entries[2]], NOW);

    assert.equal(allowance.allowed, false);
    assert.equal(allowance.remaining, 0);
    assert.equal(allowance.reservedToday, 3);
    assert.equal(allowance.acceptedToday, 1);
    assert.equal(allowance.acceptedTotal, 1);
    assert.equal(uncertainOnly.allowed, false);
    assert.equal(uncertainOnly.nextAllowedAt, NOW + 14 * MINUTE);
    assert.equal(uncertainOnly.acceptedToday, 0);
});

test('an explicit rejection restores its slot without restarting the contact interval', function rejectedContactReservation() {
    const rejected = {status: 'sending', submittedAt: NOW};
    const entries = [
        acceptedMessage(NOW - 2 * HOUR),
        acceptedMessage(NOW - HOUR),
        rejected
    ];

    assert.equal(contactAllowance(entries, NOW).allowed, false);
    rejected.status = 'rejected';
    rejected.settledAt = NOW + MINUTE;
    const allowance = contactAllowance(entries, NOW + MINUTE);

    assert.equal(allowance.allowed, true);
    assert.equal(allowance.remaining, 1);
    assert.equal(allowance.reservedToday, 2);
    assert.equal(allowance.acceptedTotal, 2);
});

test('accepted history remains counted after daily slots expire', function historicalAcceptedCount() {
    const entries = [
        acceptedMessage(NOW - 7 * DAY),
        acceptedMessage(NOW - DAY),
        acceptedMessage(NOW - HOUR),
        {status: 'rejected', submittedAt: NOW - 3 * DAY, settledAt: NOW - 3 * DAY},
        {status: 'uncertain', submittedAt: NOW - 2 * DAY, settledAt: NOW - 2 * DAY}
    ];
    const allowance = contactAllowance(entries, NOW);

    assert.equal(allowance.allowed, true);
    assert.equal(allowance.acceptedTotal, 3);
    assert.equal(allowance.acceptedToday, 1);
    assert.equal(allowance.reservedToday, 1);
    assert.equal(allowance.remaining, 2);
    assert.equal(entries.length, 5);
});
