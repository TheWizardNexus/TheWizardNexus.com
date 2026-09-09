import DBOPFS from 'arcane-os/modules/DBOPFS.js';
import {sendMailReport} from 'arcane-os/mail';
import {contactAllowance} from './contact-policy.js';

const MAIL_ENDPOINT = 'https://mail.precrisis.ai:4433/v1/mail';
const CONTACT_TABLE = 'website_contact';
const CONTACT_LOCK = 'wizard-nexus-contact-send';
const form = document.querySelector('#contact-form');
const submit = document.querySelector('#contact-submit');
const status = document.querySelector('#contact-status');
const allowance = document.querySelector('#contact-allowance');
const draftStatus = document.querySelector('#contact-draft-status');
const fields = ['email', 'subject', 'message'];
const page = new AbortController();
const db = new DBOPFS();
let ready = false;
let busy = false;
let allowanceTimer;
let draftWrites = Promise.resolve();
let draftRevision = 0;

// A new document gets a new file, including tabs that inherit sessionStorage.
const draftSessionKey = 'wizard-nexus-contact-draft';
const draftId = crypto.randomUUID();
const draftKey = `draft-${draftId}.json`;
const previousDraftKey = savedDraftKey();

form.addEventListener('submit', submitContact);
form.addEventListener('input', saveDraft);
window.addEventListener('online', refreshContact);
window.addEventListener('offline', refreshContact);
window.addEventListener('focus', refreshContact);
window.addEventListener('pageshow', refreshContact);
window.addEventListener('pagehide', closeContact);
initializeContact().catch(reportInitializationFailure);

function savedDraftKey() {
    try {
        const id = sessionStorage.getItem(draftSessionKey);
        return id ? `draft-${id}.json` : null;
    } catch (error) {
        console.error('Contact draft session could not be retained.', error);
        return null;
    }
}

function readDraft() {
    return {
        email: form.elements.email.value,
        subject: form.elements.subject.value,
        message: form.elements.message.value
    };
}

function showStatus(message, state = '') {
    if (page.signal.aborted) return;
    status.textContent = message;
    status.dataset.state = state;
}

async function initializeContact() {
    const revision = draftRevision;
    await db.readyPromise;
    const saved = previousDraftKey ? await db.get(CONTACT_TABLE, previousDraftKey, true) : null;
    if (page.signal.aborted) return;
    const empty = fields.every(function emptyDraftField(field) {
        return form.elements[field].value === '';
    });
    if (saved && revision === 0 && revision === draftRevision && empty) {
        for (const field of fields) {
            form.elements[field].value = saved[field];
        }
        draftStatus.textContent = 'Your draft is saved on this device.';
    }
    ready = true;
    if (!navigator.locks?.request) {
        throw new Error('This browser cannot coordinate the contact limit across tabs. Use a browser with Web Locks support.');
    }
    await updateAllowance();
    if (navigator.onLine) {
        await connectMail();
        showStatus('Ready. Replies will go to the email address you enter.');
    } else {
        showStatus('You are offline. Write your draft here, then reconnect to send it.');
    }
}

function reportInitializationFailure(error) {
    console.error('Contact setup failed.', error);
    showStatus(`Contact is unavailable: ${error.message} Your text remains in the form.`, 'error');
    if (!ready || !navigator.locks?.request) submit.disabled = true;
}

function saveDraft() {
    draftRevision += 1;
    const draft = readDraft();
    const revision = draftRevision;
    draftStatus.textContent = 'Saving draft on this device…';
    // Every authored draft write finishes in order, without dropping input.
    draftWrites = draftWrites.catch(reportDraftFailure).then(
        async function storeContactDraft() {
            await db.readyPromise;
            await db.set(CONTACT_TABLE, draftKey, draft);
            sessionStorage.setItem(draftSessionKey, draftId);
            if (!page.signal.aborted && revision === draftRevision) {
                draftStatus.textContent = 'Draft saved on this device. Sending requires a connection.';
            }
        }
    );
    draftWrites.catch(reportDraftFailure);
}

function reportDraftFailure(error) {
    console.error('Contact draft could not be saved.', error);
    if (!page.signal.aborted) {
        draftStatus.textContent = `Draft could not be saved: ${error.message} Keep this page open to retain your text.`;
    }
}

async function readLedger() {
    return await db.get(CONTACT_TABLE, 'ledger.json', true) || {entries: []};
}

async function updateAllowance() {
    if (!ready || page.signal.aborted) return;
    const ledger = await readLedger();
    if (page.signal.aborted) return;
    const current = contactAllowance(ledger.entries);
    const unconfirmed = current.reservedToday - current.acceptedToday;
    const next = current.allowed ? '' : ` Next message: ${new Date(current.nextAllowedAt).toLocaleString()}.`;
    allowance.textContent = `${current.acceptedToday} accepted in the past 24 hours; ${current.remaining} remaining. ${current.acceptedTotal} accepted in total on this browser.${unconfirmed ? ` ${unconfirmed} pending or unconfirmed submission(s) also reserve an allowance.` : ''}${next}`;
    submit.disabled = busy || !navigator.onLine || !navigator.locks?.request || !current.allowed;
    clearTimeout(allowanceTimer);
    if (!current.allowed) {
        allowanceTimer = setTimeout(refreshContact, Math.max(1, current.nextAllowedAt - Date.now()));
    }
}

function refreshContact() {
    if (!ready || page.signal.aborted) return;
    updateAllowance().catch(reportInitializationFailure);
    if (!busy && !navigator.onLine) {
        showStatus('You are offline. Your saved draft stays here. Reconnect to send it.');
    }
}

async function connectMail() {
    // Establish reachability before reserving a slot. The POST still owns acceptance.
    const response = await fetch(
        MAIL_ENDPOINT,
        {method: 'OPTIONS', signal: page.signal}
    );
    if (!response.ok) {
        throw new Error('The email service is unavailable for this website. Please try again later.');
    }
}

async function submitContact(event) {
    event.preventDefault();
    if (busy || !ready || !form.reportValidity()) return;
    busy = true;
    submit.disabled = true;
    showStatus('Preparing your message…');
    const draft = readDraft();
    saveDraft();
    const revision = draftRevision;

    try {
        await draftWrites;
        await navigator.locks.request(
            CONTACT_LOCK,
            {signal: page.signal},
            async function sendWithinContactAllowance() {
                const ledger = await readLedger();
                const current = contactAllowance(ledger.entries);
                if (!current.allowed) {
                    showStatus(`Your next message can be sent at ${new Date(current.nextAllowedAt).toLocaleString()}. Your draft is saved.`);
                    return;
                }
                if (!navigator.onLine) {
                    showStatus('You are offline. Your draft is saved. Reconnect to send it.');
                    return;
                }
                await connectMail();
                page.signal.throwIfAborted();
                const entry = {
                    id: crypto.randomUUID(),
                    submittedAt: Date.now(),
                    status: 'sending'
                };
                ledger.entries.push(entry);
                // Reserve durably before the POST so navigation or lost replies cannot reset limits.
                await db.set(CONTACT_TABLE, 'ledger.json', ledger);
                showStatus('Sending your message…');
                try {
                    page.signal.throwIfAborted();
                    const result = await sendMailReport(
                        {
                            appName: 'The Wizard Nexus website',
                            endpoint: MAIL_ENDPOINT,
                            reportKey: entry.id,
                            report: {
                                from: 'The Wizard Nexus website <twin@mail.precrisis.ai>',
                                to: ['connect+website@thewizardnexus.com'],
                                reply_to: draft.email,
                                subject: draft.subject,
                                text: draft.message,
                                type: 'report'
                            },
                            signal: page.signal
                        }
                    );
                    entry.settledAt = Date.now();
                    if (result.sent) {
                        entry.status = 'accepted';
                        entry.acceptedAt = entry.settledAt;
                    } else {
                        entry.status = 'uncertain';
                    }
                } catch (error) {
                    // Generic gateway failures and unstructured responses leave delivery unknown.
                    const rejection = error.details?.error;
                    const rejected = error.statusCode >= 400
                        && typeof rejection?.code === 'string'
                        && rejection.code !== 'mail_gateway_error'
                        && rejection.uncertain === false;
                    entry.status = rejected ? 'rejected' : 'uncertain';
                    entry.settledAt = Date.now();
                    console.error('Contact delivery failed.', error);
                }
                try {
                    await db.set(CONTACT_TABLE, 'ledger.json', ledger);
                } catch (error) {
                    console.error('Contact delivery status could not be saved.', error);
                    showStatus(
                        entry.status === 'accepted'
                            ? 'The provider accepted your message. Its local status could not be saved; the reserved allowance remains. Please avoid sending it again.'
                            : 'The final delivery status could not be saved. Your draft and reserved allowance remain on this device.',
                        'error'
                    );
                    return;
                }
                if (entry.status === 'accepted') {
                    showStatus('The email provider accepted your message for connect+website@thewizardnexus.com. Thank you for getting in touch.', 'success');
                    if (!page.signal.aborted && revision === draftRevision) {
                        form.reset();
                        saveDraft();
                    }
                } else if (entry.status === 'rejected') {
                    showStatus('The email service rejected the message. Your draft is saved and the allowance was restored.', 'error');
                } else {
                    showStatus('Delivery is unconfirmed. Your draft is saved and this submission counts toward the limit. Please avoid sending the same message again until you know its outcome.', 'error');
                }
            }
        );
    } catch (error) {
        console.error('Contact submission could not complete.', error);
        showStatus(`The contact operation could not finish: ${error.message} Your text remains in the form.`, 'error');
    } finally {
        busy = false;
        await updateAllowance().catch(reportInitializationFailure);
    }
}

function closeContact(event) {
    if (event.persisted) return;
    clearTimeout(allowanceTimer);
    page.abort();
}
