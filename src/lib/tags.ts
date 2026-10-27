import { TAGS } from "./constants";
import type { Locale } from "./i18n/config";

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

const TAG_DESCRIPTIONS_DE: Record<Tag, string> = {
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

const TAG_DESCRIPTIONS_EN: Record<Tag, string> = {
  Survival:
    "Classic Minecraft: gather resources, build houses and survive the monsters. Find Survival servers with friends, a community and often custom plugins like jobs or land claims.",
  SMP: "SMP stands for Survival Multiplayer. On these servers you play together with a steady community in one world, often with few plugins and a lot of freedom.",
  Vanilla:
    "Minecraft the way Mojang made it: no mods and as few plugins as possible. Ideal if you are looking for the original feel in multiplayer.",
  Creative:
    "Unlimited blocks and no monsters: on Creative servers you build huge projects, join build contests or get your own plot.",
  SkyBlock:
    "You start on a tiny island in the sky and build an empire from very few resources. SkyBlock servers offer island rankings, shops and challenges.",
  OneBlock:
    "Everything starts with a single block that keeps regenerating. On OneBlock servers you unlock new biomes, mobs and items phase by phase.",
  Factions:
    "Found a faction, claim land and fight other teams. Factions servers are all about raids, alliances and PvP around your base.",
  Prison:
    "Start as a prisoner, mine ores and rank up step by step. Prison servers revolve around economy, ranks and the road to freedom.",
  Minigames:
    "Quick rounds in between: Minigame servers offer modes like BedWars, SkyWars, Build Battle or Murder Mystery.",
  BedWars:
    "Protect your bed, collect resources and destroy the other teams' beds. Find BedWars servers with leaderboards, stats and different team sizes.",
  SkyWars:
    "Every player starts on their own island, loots chests and fights for the win. SkyWars servers offer fast PvP rounds with kits and statistics.",
  PvP: "Your combat skills are what counts here. PvP servers offer arenas, duels, FFA and tournaments for everyone who wants to compete with other players.",
  Practice:
    "Train your PvP in duels and ranked matches. Practice servers offer different kits, Elo leaderboards and tournaments.",
  Hardcore:
    "One life, no second chance: on Hardcore servers death is final or punished hard. For everyone looking for real thrills.",
  Anarchy:
    "No rules and no admins stepping in. On Anarchy servers anything goes, from griefing to hacks. Not for the faint-hearted.",
  Towny:
    "Found a town, join a nation and engage in trade and politics. Towny servers combine Survival with city building and diplomacy.",
  Economy:
    "Earn money with jobs, shops and trading and build a fortune. Economy servers have their own economy with player markets and auctions.",
  Roleplay:
    "Slip into a role and experience stories with other players. Roleplay servers offer their own worlds, professions, cities and events.",
  Modded:
    "More than Vanilla: modded servers run modpacks on Forge or Fabric and add new tech, magic, dimensions and items to the game.",
  Pixelmon:
    "Catch, train and battle Pokémon in Minecraft. Pixelmon servers offer gyms, leaderboards and a world full of Pokémon.",
  Parkour:
    "Jump through challenging courses and chase personal bests. Parkour servers offer maps from easy to extremely hard.",
  "Hide and Seek":
    "Hide as a block or hunt down the other players. Hide and Seek servers offer fun rounds on lovingly built maps.",
  Crossplay:
    "Play with friends no matter if they are on Java or Bedrock. Crossplay servers can be joined from PC, console and phone.",
  Network:
    "Large networks with many game modes behind one address: lobby, minigames, survival and more. Ideal if you are looking for variety.",
};

/**
 * Intro text for each game mode landing page. Unique copy per page gives search engines
 * something to rank besides the server list itself.
 */
export function tagDescription(tag: Tag, locale: Locale) {
  return (locale === "en" ? TAG_DESCRIPTIONS_EN : TAG_DESCRIPTIONS_DE)[tag];
}
