// Built-in English fallback messages for the design-system chrome.
//
// The real catalogs live in `messages/{locale}.json` and are authored
// separately; they may not exist yet, and when they do they are deep-merged
// OVER these defaults (see src/i18n/request.ts). Keep this file limited to
// strings the layout/components need to render sensibly on a bare checkout —
// page-level copy belongs in the message catalogs.
export const defaultMessages = {
  common: {
    appName: "HackDash",
  },
  header: {
    home: "HackDash — home",
    searchPlaceholder: "Search projects, dashboards, people…",
    searchLabel: "Search",
    logIn: "Log in",
    logOut: "Log out",
  },
  footer: {
    tagline: "The living wall for hackathon projects.",
    openSource: "Open source, made with the Media Party community.",
  },
  home: {
    title: "Make your hackathon's work visible.",
    subtitle:
      "One wall of projects per event — during the weekend and long after.",
  },
  theme: {
    label: "Theme",
    system: "System theme",
    light: "Light theme",
    dark: "Dark theme",
  },
  locale: {
    label: "Language",
  },
  status: {
    brainstorming: "Brainstorming",
    wireframing: "Wireframing",
    building: "Building",
    researching: "Researching",
    prototyping: "Prototyping",
    releasing: "Releasing",
    stage: "stage {current} of {total}",
  },
} as const;

export type DefaultMessages = typeof defaultMessages;
