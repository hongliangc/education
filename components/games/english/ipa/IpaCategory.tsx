"use client";

import { useState } from "react";
import type { PhonemeGroup } from "@/content/english/ipa";
import { GroupGrid } from "./GroupGrid";
import { IpaLesson } from "./IpaLesson";

export function IpaCategory() {
  const [group, setGroup] = useState<PhonemeGroup | null>(null);

  if (group) {
    return <IpaLesson group={group} onExit={() => setGroup(null)} />;
  }

  return <GroupGrid onSelect={setGroup} />;
}
