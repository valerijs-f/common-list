<script setup lang="ts">
import { PencilSquareIcon, ShareIcon } from "@heroicons/vue/24/outline";
import UiButton from "../ui/UiButton.vue";
import UiTextField from "../ui/UiTextField.vue";

defineProps<{
  displayListName: string;
  listDocumentLoaded: boolean;
  canEditListName: boolean;
  editingListName: boolean;
}>();

const listNameDraft = defineModel<string>("listNameDraft", { required: true });

const emit = defineEmits<{
  share: [];
  startRename: [];
  saveName: [];
  cancelRename: [];
}>();
</script>

<template>
  <div v-if="listDocumentLoaded && canEditListName && editingListName" class="space-y-2">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <UiTextField
          id="list-name-edit"
          v-model="listNameDraft"
          label="List name"
          label-class="sr-only"
          input-class="text-2xl font-bold"
          type="text"
          placeholder="List name"
        />
      </div>
      <UiButton
        variant="icon"
        type="button"
        class="shrink-0"
        aria-label="Share list"
        title="Share list"
        @click="emit('share')"
      >
        <ShareIcon class="h-5 w-5" aria-hidden="true" />
      </UiButton>
    </div>
    <div class="flex flex-wrap gap-2">
      <UiButton type="button" @click="emit('saveName')">Save name</UiButton>
      <UiButton variant="secondary" type="button" @click="emit('cancelRename')">
        Cancel
      </UiButton>
    </div>
  </div>
  <div v-else class="flex items-start justify-between gap-3">
    <h1 class="min-w-0 flex-1 truncate text-2xl font-bold text-white" :title="displayListName">
      {{ displayListName }}
    </h1>
    <div class="flex shrink-0 items-start gap-2">
      <UiButton
        v-if="canEditListName"
        variant="icon"
        type="button"
        aria-label="Rename list"
        title="Rename list"
        @click="emit('startRename')"
      >
        <PencilSquareIcon class="h-5 w-5" aria-hidden="true" />
      </UiButton>
      <UiButton
        variant="icon"
        type="button"
        aria-label="Share list"
        title="Share list"
        @click="emit('share')"
      >
        <ShareIcon class="h-5 w-5" aria-hidden="true" />
      </UiButton>
    </div>
  </div>
</template>
