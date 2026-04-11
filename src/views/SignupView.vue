<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { ClipboardDocumentListIcon } from "@heroicons/vue/24/outline";
import { usePasskeyAuth } from "community-jazz-vue";
import { readErrorMessage } from "../auth/passkeyAuthErrors";
import { APP_DISPLAY_NAME } from "../appDisplayName";
import UiButton from "../components/ui/UiButton.vue";
import UiTextField from "../components/ui/UiTextField.vue";

const route = useRoute();
const router = useRouter();

const auth = usePasskeyAuth({
  appName: APP_DISPLAY_NAME,
});

const username = ref("");
const error = ref<string | null>(null);

const isSignedIn = computed(() => auth.value.state === "signedIn");

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
          {{ APP_DISPLAY_NAME }}
        </h1>
      </div>

      <p class="text-gray-400 text-sm text-center mb-6">
        Create an account with a passkey to sync your lists (Face ID, Touch ID,
        or device PIN).
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

      <p class="mt-6 text-center text-sm text-gray-500">
        Already have an account?
        <RouterLink
          :to="{ name: 'login', query: route.query }"
          class="text-blue-400 hover:text-blue-300 ml-1"
        >
          Log in
        </RouterLink>
      </p>

      <p class="mt-4 text-center text-sm text-gray-500">
        <RouterLink :to="{ name: 'about' }" class="text-blue-400 hover:text-blue-300">
          About this app
        </RouterLink>
      </p>
    </div>
  </div>
</template>
