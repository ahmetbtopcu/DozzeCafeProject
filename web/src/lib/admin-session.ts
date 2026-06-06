"use client";

import { useSyncExternalStore } from "react";

const ADMIN_KEY_STORAGE = "nobetci_admin_key";
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStoredAdminKey() {
  if (typeof window === "undefined") {
    return "";
  }
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
}

export function storeAdminKey(key: string) {
  sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
  emitChange();
}

export function clearAdminKey() {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  emitChange();
}

export function useStoredAdminKey() {
  return useSyncExternalStore(subscribe, getStoredAdminKey, () => "");
}
