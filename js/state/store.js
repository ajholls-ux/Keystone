// ==========================================================================
// Keystone Field Kit -- Store
//
// The ONLY module permitted to touch localStorage (Part 5 architecture
// rule). All views/components must go through the functions exported here.
// ==========================================================================

import { createEmptyState, SCHEMA_VERSION } from "./schema.js";

const STORAGE_KEY = "keystone_field_kit_state";

let state = null;
const listeners = new Set();

/**
 * Reads persisted state from localStorage. Defensive: iOS Safari can evict
 * storage under pressure, and storage access itself can throw (e.g. private
 * browsing edge cases). Any failure falls back to a fresh empty state rather
 * than crashing the app mid-assessment.
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION) {
      // v8 -> v9: evidence entries may include questionId when captured on a question.
      // v7 -> v8: questionResponses gain optional `observed` and `learned`.
      // Older `response` is still read as learned in the UI. Additive only.
      // No destructive migration. Accept any save that has organisations.
      return parsed && parsed.organisations ? parsed : createEmptyState();
    }
    return parsed;
  } catch (err) {
    console.error("Keystone: failed to load persisted state, starting fresh.", err);
    return createEmptyState();
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Write failure (e.g. storage full/blocked) should not crash the app.
    // The in-memory state remains correct for the rest of this session.
    console.error("Keystone: failed to persist state.", err);
  }
}

function notify() {
  listeners.forEach((fn) => fn(state));
}

/** Initialises the store. Call once, at app startup. */
export function initStore() {
  state = loadFromStorage();
}

/** Returns the current state. Treat as read-only -- never mutate directly. */
export function getState() {
  return state;
}

/**
 * Applies an updater function to the state, persists the result, and
 * notifies subscribers. This is the only sanctioned way to mutate state.
 */
export function updateState(updaterFn) {
  state = updaterFn(state) || state;
  persist();
  notify();
}

/** Subscribe to state changes. Returns an unsubscribe function. */
export function subscribe(listenerFn) {
  listeners.add(listenerFn);
  return () => listeners.delete(listenerFn);
}

/**
 * Exports the full state as a downloadable JSON file -- the assessor's
 * backup mechanism against data loss (Part 5).
 */
export function exportBackup() {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `keystone-backup-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restores state from a previously exported backup file.
 * Caller is responsible for confirming this destructive action with the
 * assessor before invoking it.
 */
export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.organisations)) {
          throw new Error("File does not match Keystone backup format.");
        }
        state = parsed;
        persist();
        notify();
        resolve(state);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

