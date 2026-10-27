import { TAGS } from "./constants";

export type Tag = (typeof TAGS)[number];

/** URL segment of a game mode landing page, e.g. "Hide and Seek" -> "hide-and-seek". */
export function tagSlug(tag: Tag) {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function tagFromSlug(slug: string): Tag | undefined {
  return TAGS.find((tag) => tagSlug(tag) === slug);
}

export function tagHref(tag: Tag) {
  return `/spielmodus/${tagSlug(tag)}`;
}

/** Narrows a stored tag string to a known game mode. */
export function knownTag(value: string | undefined): Tag | undefined {
  return TAGS.find((tag) => tag === value);
}

/**
 * Intro text for each game mode landing page. Unique copy per page gives search engines
 * something to rank besides the server list itself.
 */
export const TAG_DESCRIPTIONS: Record<Tag, string> = {
  Survival:
    "Klassisches Minecraft: Rohstoffe sammeln, Häuser bauen und gegen Monster überleben. Hier findest du Survival Server mit Freunden, Community und oft eigenen Plugins wie Jobs oder Grundstücksschutz.",
  SMP: "SMP steht für Survival Multiplayer. Auf diesen Servern spielst du gemeinsam mit einer festen Community in einer Welt, oft mit wenig Plugins und viel Freiheit.",
  Vanilla:
    "Minecraft so, wie Mojang es gemacht hat: ohne Mods und mit möglichst wenig Plugins. Ideal, wenn du das ursprüngliche Spielgefühl im Multiplayer suchst.",
  Creative:
    "Unbegrenzte Blöcke und keine Monster: Auf Creative Servern baust du riesige Projekte, nimmst an Bauwettbewerben teil oder bekommst dein eigenes Plot.",
  SkyBlock:
    "Du startest auf einer kleinen Insel im Himmel und baust dir mit wenigen Ressourcen ein Imperium auf. SkyBlock Server bieten Insel-Rankings, Shops und Challenges.",
  OneBlock:
    "Alles beginnt mit einem einzigen Block, der sich immer wieder erneuert. Auf OneBlock Servern schaltest du Phase für Phase neue Biome, Mobs und Items frei.",
  Factions:
    "Gründe eine Fraktion, sichere dir Land und kämpfe gegen andere Teams. Factions Server setzen auf Raids, Bündnisse und PvP rund um eure Basis.",
  Prison:
    "Starte als Gefangener, baue Erze in Minen ab und steige Rang für Rang auf. Prison Server drehen sich um Wirtschaft, Ränge und den Weg in die Freiheit.",
  Minigames:
    "Schnelle Runden für zwischendurch: Auf Minigame Servern erwarten dich Spielmodi wie BedWars, SkyWars, Build Battle oder Murder Mystery.",
  BedWars:
    "Schütze dein Bett, sammle Ressourcen und zerstöre die Betten der anderen Teams. Finde BedWars Server mit Ranglisten, Stats und verschiedenen Team-Größen.",
  SkyWars:
    "Jeder Spieler startet auf einer eigenen Insel, plündert Kisten und kämpft um den Sieg. SkyWars Server bieten schnelle PvP-Runden mit Kits und Statistiken.",
  PvP: "Hier zählt dein Können im Kampf. PvP Server bieten Arenen, Duelle, FFA und Turniere für alle, die sich mit anderen Spielern messen wollen.",
  Practice:
    "Trainiere dein PvP in Duellen und Ranked-Matches. Practice Server bieten verschiedene Kits, Elo-Ranglisten und Turniere.",
  Hardcore:
    "Ein Leben, keine zweite Chance: Auf Hardcore Servern ist der Tod endgültig oder wird hart bestraft. Für alle, die echten Nervenkitzel suchen.",
  Anarchy:
    "Keine Regeln, keine Admins, die eingreifen. Auf Anarchy Servern ist alles erlaubt, von Griefing bis Hacks. Nichts für schwache Nerven.",
  Towny:
    "Gründe eine Stadt, schließe dich einer Nation an und betreibe Handel und Politik. Towny Server verbinden Survival mit Städtebau und Diplomatie.",
  Economy:
    "Verdiene Geld mit Jobs, Shops und Handel und baue dir ein Vermögen auf. Economy Server haben eine eigene Wirtschaft mit Spielermärkten und Auktionen.",
  Roleplay:
    "Schlüpfe in eine Rolle und erlebe Geschichten mit anderen Spielern. Roleplay Server bieten eigene Welten, Berufe, Städte und Events.",
  Modded:
    "Mehr als Vanilla: Modded Server laufen mit Modpacks wie Forge oder Fabric und bringen neue Technik, Magie, Dimensionen und Items ins Spiel.",
  Pixelmon:
    "Fange, trainiere und kämpfe mit Pokémon in Minecraft. Pixelmon Server bieten Arenen, Ranglisten und eine Welt voller Pokémon.",
  Parkour:
    "Springe dich durch anspruchsvolle Parcours und jage Bestzeiten. Parkour Server bieten Maps von einfach bis extrem schwer.",
  "Hide and Seek":
    "Verstecke dich als Block oder suche die anderen Spieler. Hide and Seek Server bieten lustige Runden auf liebevoll gebauten Maps.",
  Crossplay:
    "Spiele mit Freunden, egal ob sie auf Java oder Bedrock unterwegs sind. Crossplay Server sind mit PC, Konsole und Handy erreichbar.",
  Network:
    "Große Netzwerke mit vielen Spielmodi unter einer Adresse: Lobby, Minigames, Survival und mehr. Ideal, wenn du Abwechslung suchst.",
};
