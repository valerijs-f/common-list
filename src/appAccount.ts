import { Group, co, z } from "jazz-tools";

export const AppRoot = co.map({
  visitedListIds: co.list(z.string()),
});

export const AppAccount = co
  .account({
    root: AppRoot,
    profile: co.profile({ name: z.string() }),
  })
  .withMigration(async (account, creationProps) => {
    if (!account.$jazz.has("root")) {
      account.$jazz.set("root", { visitedListIds: [] });
    }

    const { root } = await account.$jazz.ensureLoaded({ resolve: { root: true } });
    if (root.$isLoaded && !root.$jazz.has("visitedListIds")) {
      root.$jazz.set("visitedListIds", []);
    }

    if (!account.$jazz.has("profile")) {
      const profileGroup = Group.create();
      profileGroup.addMember("everyone", "reader");
      const name =
        creationProps?.name?.trim().length ? creationProps.name.trim() : "User";
      account.$jazz.set(
        "profile",
        co.profile({ name: z.string() }).create({ name }, { owner: profileGroup }),
      );
    }
  });
