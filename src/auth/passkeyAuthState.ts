import { ref } from "vue";

/** Mirrors `usePasskeyAuth` state for use in navigation guards. */
export const passkeySignedIn = ref(false);

/** Set true after the first sync from Jazz passkey auth (avoids guard flash). */
export const passkeyAuthResolved = ref(false);
