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

// Labels live in the dictionaries (`countries`, `reportReasons`); these are the stored keys.
export const COUNTRIES = ["DE", "AT", "CH", "NL", "FR", "PL", "GB", "US", "CA", "INT"] as const;

export const REPORT_REASONS = ["offline", "wrong_info", "vote_abuse", "inappropriate", "other"] as const;

export const PAGE_SIZE = 20;

/** Every visitor can vote once per server in this window. */
export const VOTE_COOLDOWN_HOURS = 24;
