export const TAGS = [
  "Survival",
  "SMP",
  "Vanilla",
  "Creative",
  "SkyBlock",
  "OneBlock",
  "Factions",
  "Prison",
  "Minigames",
  "BedWars",
  "SkyWars",
  "PvP",
  "Practice",
  "Hardcore",
  "Anarchy",
  "Towny",
  "Economy",
  "Roleplay",
  "Modded",
  "Pixelmon",
  "Parkour",
  "Hide and Seek",
  "Crossplay",
  "Network",
] as const;

export const MAX_TAGS = 6;

export const COUNTRIES: Record<string, string> = {
  DE: "Deutschland",
  AT: "Österreich",
  CH: "Schweiz",
  NL: "Niederlande",
  FR: "Frankreich",
  PL: "Polen",
  GB: "Vereinigtes Königreich",
  US: "USA",
  CA: "Kanada",
  INT: "International",
};

export const REPORT_REASONS: Record<string, string> = {
  offline: "Server ist dauerhaft offline",
  wrong_info: "Falsche Angaben",
  vote_abuse: "Vote-Manipulation",
  inappropriate: "Unangemessene Inhalte",
  other: "Sonstiges",
};

export const PAGE_SIZE = 20;

/** Every visitor can vote once per server in this window. */
export const VOTE_COOLDOWN_HOURS = 24;
