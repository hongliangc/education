import type { BilingualStory, ReadingLevel } from "./types";
import { antsAndTheGrasshopper } from "./ants-and-the-grasshopper";
import { boyWhoCriedWolf } from "./boy-who-cried-wolf";
import { bremenTownMusicians } from "./bremen-town-musicians";
import { elvesAndTheShoemaker } from "./elves-and-the-shoemaker";
import { emperorsNewClothes } from "./emperors-new-clothes";
import { frogPrince } from "./frog-prince";
import { lionAndTheMouse } from "./lion-and-the-mouse";
import { northWindAndTheSun } from "./north-wind-and-the-sun";
import { townMouseAndCountryMouse } from "./town-mouse-and-country-mouse";
import { uglyDuckling } from "./ugly-duckling";

export interface ReadingStoryEntry {
  id: string;
  titleEn: string;
  titleZh: string;
  emoji: string;
  level: ReadingLevel;
  /** Implemented & playable. Inactive entries show as a coming-soon card. */
  active: boolean;
  /** Present only when active. */
  story?: BilingualStory;
}

export const READING_STORIES: ReadingStoryEntry[] = [
  { id: lionAndTheMouse.id, titleEn: lionAndTheMouse.titleEn, titleZh: lionAndTheMouse.titleZh, emoji: lionAndTheMouse.emoji, level: "fable", active: true, story: lionAndTheMouse },
  { id: boyWhoCriedWolf.id, titleEn: boyWhoCriedWolf.titleEn, titleZh: boyWhoCriedWolf.titleZh, emoji: boyWhoCriedWolf.emoji, level: "fable", active: true, story: boyWhoCriedWolf },
  { id: northWindAndTheSun.id, titleEn: northWindAndTheSun.titleEn, titleZh: northWindAndTheSun.titleZh, emoji: northWindAndTheSun.emoji, level: "fable", active: true, story: northWindAndTheSun },
  { id: antsAndTheGrasshopper.id, titleEn: antsAndTheGrasshopper.titleEn, titleZh: antsAndTheGrasshopper.titleZh, emoji: antsAndTheGrasshopper.emoji, level: "fable", active: true, story: antsAndTheGrasshopper },
  { id: townMouseAndCountryMouse.id, titleEn: townMouseAndCountryMouse.titleEn, titleZh: townMouseAndCountryMouse.titleZh, emoji: townMouseAndCountryMouse.emoji, level: "fable", active: true, story: townMouseAndCountryMouse },
  { id: elvesAndTheShoemaker.id, titleEn: elvesAndTheShoemaker.titleEn, titleZh: elvesAndTheShoemaker.titleZh, emoji: elvesAndTheShoemaker.emoji, level: "tale", active: true, story: elvesAndTheShoemaker },
  { id: bremenTownMusicians.id, titleEn: bremenTownMusicians.titleEn, titleZh: bremenTownMusicians.titleZh, emoji: bremenTownMusicians.emoji, level: "tale", active: true, story: bremenTownMusicians },
  { id: frogPrince.id, titleEn: frogPrince.titleEn, titleZh: frogPrince.titleZh, emoji: frogPrince.emoji, level: "tale", active: true, story: frogPrince },
  { id: uglyDuckling.id, titleEn: uglyDuckling.titleEn, titleZh: uglyDuckling.titleZh, emoji: uglyDuckling.emoji, level: "tale", active: true, story: uglyDuckling },
  { id: emperorsNewClothes.id, titleEn: emperorsNewClothes.titleEn, titleZh: emperorsNewClothes.titleZh, emoji: emperorsNewClothes.emoji, level: "tale", active: true, story: emperorsNewClothes },
];
