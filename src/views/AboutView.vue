<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ClipboardDocumentListIcon } from "@heroicons/vue/24/outline";
import { APP_DISPLAY_NAME } from "../appDisplayName";
import UiBackLink from "../components/ui/UiBackLink.vue";

const feedbackMailto = `mailto:val.codes.info%2Bsharedlist@gmail.com?subject=${encodeURIComponent(
  `${APP_DISPLAY_NAME} — feedback`,
)}&body=${encodeURIComponent(
  `Hi,\n\nI'm writing about ${APP_DISPLAY_NAME}:\n\n`,
)}`;
</script>

<template>
  <div class="min-h-dvh bg-gray-950 px-4 pb-10 pt-[env(safe-area-inset-top,0px)]">
    <div class="mx-auto flex w-full max-w-md flex-col gap-6 pt-6">
      <UiBackLink />
      <div class="flex items-center gap-2">
        <ClipboardDocumentListIcon
          class="h-8 w-8 shrink-0 text-blue-500"
          aria-hidden="true"
        />
        <h1 class="text-xl font-semibold tracking-tight text-white">
          About {{ APP_DISPLAY_NAME }}
        </h1>
      </div>

      <div class="rounded-xl border border-gray-700 bg-gray-900 p-6 space-y-8">
        <section class="space-y-2">
          <h2 class="text-sm font-medium text-gray-300">What it does</h2>
          <p class="text-sm leading-relaxed text-gray-400">
            {{ APP_DISPLAY_NAME }} is a simple shared checklist. You can create lists, add
            items, tick them off, and open the same list on another device. Anyone with a
            list link can open it and add their own items alongside yours.
          </p>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-medium text-gray-300">How your data is stored</h2>
          <p class="text-sm leading-relaxed text-gray-400">
            Your account is secured with a passkey (Face ID, Touch ID, Windows Hello, or your
            device PIN). Lists and items are kept in sync using
            <a
              href="https://jazz.tools"
              class="text-blue-400 underline decoration-blue-500/40 underline-offset-2 hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            >Jazz</a>
            - data is associated with your account and synced when you are signed in, rather
            than living only in this browser tab.
          </p>
          <p class="text-sm leading-relaxed text-gray-500">
            Each list is reachable by its URL. Treat links like a shared document: anyone
            with the link can view the list and edit items they add.
          </p>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-medium text-gray-300">How to sign up</h2>
          <ol class="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-400">
            <li>
              Open
              <RouterLink
                :to="{ name: 'signup' }"
                class="text-blue-400 underline decoration-blue-500/40 underline-offset-2 hover:text-blue-300"
              >Sign up</RouterLink>
              (or use the link on the sign-in screen).
            </li>
            <li>Enter a display name so collaborators can see who added an item.</li>
            <li>
              When prompted, register a passkey on this device. You can sign in again later
              with the same passkey (or add one on another device, depending on your
              platform).
            </li>
          </ol>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-medium text-gray-300">How to use the app</h2>
          <ol class="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-400">
            <li>
              After signing in you land on your lists. Tap <span class="text-gray-300">+</span>
              in the bottom bar to create a list, then open it to add items.
            </li>
            <li>
              Inside a list, use the same <span class="text-gray-300">+</span> button to add
              lines, tap a row to open details, and use the header actions to share the link
              or tidy completed items.
            </li>
            <li>
              Lists you have opened before appear on the home screen for quick access. If you
              are the list creator, you can open list settings from the header to rename or
              delete the list.
            </li>
          </ol>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-medium text-gray-300">Bug reports and feedback</h2>
          <p class="text-sm leading-relaxed text-gray-400">
            For bug reports, suggestions, or any other requests, you can email the developer
            at
            <a
              :href="feedbackMailto"
              class="break-all text-blue-400 underline decoration-blue-500/40 underline-offset-2 hover:text-blue-300"
            >val.codes.info+sharedlist@gmail.com</a>.
          </p>
        </section>

        <p class="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          <RouterLink
            :to="{ name: 'list' }"
            class="text-blue-400 hover:text-blue-300"
          >Continue to the app</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
