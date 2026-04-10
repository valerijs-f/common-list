<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ClipboardDocumentListIcon } from "@heroicons/vue/24/outline";
import { usePasskeyAuth } from "community-jazz-vue";
import { PASSKEY_APP_NAME, PASSKEY_HOSTNAME } from "../auth/passkeyConfig";
import UiButton from "../components/ui/UiButton.vue";
import UiTextField from "../components/ui/UiTextField.vue";

const route = useRoute();
const router = useRouter();

const auth = usePasskeyAuth({
  appName: PASSKEY_APP_NAME,
  appHostname: PASSKEY_HOSTNAME,
});

const username = ref("");
const error = ref<string | null>(null);

const isSignedIn = computed(() => auth.value.state === "signedIn");

function firstSentence(message: string): string {
  const trimmed = message.trim();
  const dot = trimmed.indexOf(".");
  if (dot === -1) return trimmed;
  return trimmed.slice(0, dot + 1).trim();
}

function readErrorMessage(err: unknown): string {
  let raw: string;
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: unknown }).cause;
    raw = cause instanceof Error ? cause.message : err.message;
  } else {
    raw = "Something went wrong";
  }
  return firstSentence(raw);
}

async function handleSignUp() {
  if (!username.value.trim()) {
    error.value = "Name is required";
    return;
  }
  error.value = null;
  try {
    await auth.value.signUp(username.value.trim());
  } catch (err) {
    error.value = readErrorMessage(err);
  }
}

async function handleLogIn() {
  error.value = null;
  try {
    await auth.value.logIn();
  } catch (err) {
    error.value = readErrorMessage(err);
  }
}

function redirectAfterAuth() {
  const raw = route.query.redirect;
  const target =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")
      ? raw
      : "/lists";
  void router.replace(target);
}

watch(
  isSignedIn,
  (signed) => {
    if (signed) redirectAfterAuth();
  },
  { immediate: true },
);
</script>

<template>
  <div
    class="min-h-screen bg-gray-950 flex items-center justify-center px-4"
  >
    <div
      class="w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl p-8 shadow-xl"
    >
      <div class="flex items-center gap-2 justify-center mb-6">
        <ClipboardDocumentListIcon
          class="h-8 w-8 shrink-0 text-blue-500"
          aria-hidden="true"
        />
        <h1 class="text-xl font-semibold text-white tracking-tight text-center">
          {{ PASSKEY_APP_NAME }}
        </h1>
      </div>

      <p class="text-gray-400 text-sm text-center mb-6">
        Sign in with a passkey to sync your lists (Face ID, Touch ID, or device PIN).
      </p>

      <div
        v-if="error"
        class="mb-4 text-sm text-red-400 text-center"
        role="alert"
      >
        {{ error }}
      </div>

      <form class="space-y-3" @submit.prevent="handleSignUp">
        <UiTextField
          v-model="username"
          type="text"
          placeholder="Display name"
          autocomplete="name"
        />
        <UiButton type="submit" full-width>
          Sign up with passkey
        </UiButton>
      </form>

      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-700" />
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-gray-900 px-2 text-gray-500">or</span>
        </div>
      </div>

      <UiButton variant="secondary" full-width type="button" @click="handleLogIn">
        Log in with existing account
      </UiButton>
    </div>
  </div>
</template>
