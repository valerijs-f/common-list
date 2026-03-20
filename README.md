# Common Lists

A real-time, offline-capable shared list app built with [Vue 3](https://vuejs.org/), [Jazz](https://jazz.tools), and [community-jazz-vue](https://www.npmjs.com/package/community-jazz-vue) ([source](https://github.com/garden-co/jazz/tree/main/packages/community-jazz-vue/src)).

## Features

- Passkey sign-up
- Real-time sync across tabs and devices via Jazz Cloud
- Offline support with an online/offline toggle
- Drag-and-drop reordering via `useSortable`
- Dynamic page title with incomplete list item count
- Shareable URL — anyone with the link sees the same list
- Jazz Inspector for debugging CoValues in development

## Setup

```sh
npm install
```

```sh
cp .env.example .env
```

Add your API Key to `.env`

### Development

```sh
npm run dev
```

### Build

```sh
npm run build
```
