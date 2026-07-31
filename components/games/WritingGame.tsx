"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildHanziSession,
  HANZI_CATALOG,
  HANZI_UNITS,
  HANZI_IDIOMS,
  resolveHanziStartingUnit,
  selectNextIdiom,
  type HanziSelectionMode,
  type HanziSession,
} from "@/content/hanzi";
import type { Grade } from "@/lib/grades";
import type { OnComplete } from "./types";
import { HanziIdiomLesson } from "./hanzi/HanziIdiomLesson";
import { HanziDailyLesson } from "./hanzi/HanziDailyLesson";
import { HanziLibraryProgress } from "./hanzi/HanziLibraryProgress";
import { HanziLearningHome } from "./hanzi/HanziLearningHome";
import { HanziPinyinLesson } from "./hanzi/HanziPinyinLesson";
import { HanziRecognitionRound } from "./hanzi/HanziRecognitionRound";
import { HanziStoryLesson } from "./hanzi/HanziStoryLesson";
import { HanziWritingPractice } from "./hanzi/HanziWritingPractice";
import { useHanziProgress } from "./hanzi/useHanziProgress";
import { useHanziIdiomProgress } from "./hanzi/useHanziIdiomProgress";
import { useHanziMasteryProgress } from "./hanzi/useHanziMasteryProgress";

type HanziMode = "menu" | "daily" | "recognition" | "pinyin" | "writing" | "story" | "idiom" | "library";

export function WritingGame({
  childId,
  grade,
  onComplete,
  onExit,
}: {
  childId: string;
  grade: Grade;
  onComplete: OnComplete;
  onExit: () => void;
}) {
  const [mode, setMode] = useState<HanziMode>("menu");
  const { progress, recordResult, recordExplanation } = useHanziProgress(childId);
  const { progress: idiomProgress, recordAnswer: recordIdiomAnswer, recordExplanation: recordIdiomExplanation } = useHanziIdiomProgress(childId);
  const { recordEvidence } = useHanziMasteryProgress(childId);
  const [idiomId, setIdiomId] = useState<string | null>(null);
  const [selectedHanziIds, setSelectedHanziIds] = useState<string[]>([]);
  const [selectionTouched, setSelectionTouched] = useState(false);
  const [selectionMode, setSelectionMode] = useState<HanziSelectionMode>("mainline");
  const [browsingUnitId, setBrowsingUnitId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<HanziSession | null>(null);
  const [learningItemId, setLearningItemId] = useState<string | null>(null);
  const currentUnit = useMemo(() => resolveHanziStartingUnit(progress), [progress]);
  const displayedUnit = HANZI_UNITS.find((unit) => unit.id === browsingUnitId) ?? currentUnit;
  const idiom = useMemo(() => HANZI_IDIOMS.find(({ id }) => id === idiomId) ?? selectNextIdiom(HANZI_IDIOMS, idiomProgress), [idiomId, idiomProgress]);
  const learningSession = useMemo(() => buildHanziSession({
    unitId: displayedUnit.id,
    selectedIds: selectedHanziIds,
    selectionMode,
    progress,
    grade,
  }), [displayedUnit.id, grade, progress, selectedHanziIds, selectionMode]);
  const dailyItems = learningSession.items.map(({ item }) => item);
  const browserSelectedIds = selectionTouched ? selectedHanziIds : dailyItems.map((item) => item.id);
  const sessionInUse = activeSession ?? learningSession;
  const activeItems = sessionInUse.items.map(({ item }) => item);

  const backToMenu = () => { setActiveSession(null); setMode("menu"); };
  const beginRecognition = (session: HanziSession = learningSession) => {
    setActiveSession(session);
    setMode("recognition");
  };
  const onStartSelection = (ids: readonly string[], nextSelectionMode: HanziSelectionMode) => {
    setSelectedHanziIds([...ids]); setSelectionTouched(true);
    setSelectionMode(nextSelectionMode);
    beginRecognition(buildHanziSession({ unitId: displayedUnit.id, selectedIds: ids, selectionMode: nextSelectionMode, progress, grade }));
  };
  const changeUnit = (unitId: string) => { setBrowsingUnitId(unitId); setSelectedHanziIds([]); setSelectionTouched(false); };
  const openCharacterLesson = (itemId: string, unitItemIds: readonly string[]) => {
    setLearningItemId(itemId);
    const unitIds = new Set(unitItemIds);
    const unitItems = HANZI_CATALOG.filter((item) => unitIds.has(item.id));
    setActiveSession({ unitId: displayedUnit.id, selectionMode: "free-practice", advancesMainline: false, items: unitItems.map((item) => ({ item, reason: "practice" })), distractorPool: [...HANZI_CATALOG] });
    setMode("daily");
  };
  const recordRecognitionResult = (hanziId: string, correct: boolean) => {
    recordResult(hanziId, correct);
    recordEvidence(hanziId, { capability: "recognition", gate: "UNDERSTAND", score: correct ? 100 : 0, independent: true, explanationPassed: correct });
  };
  const recordWritingResult = (hanziId: string, correct: boolean) => {
    recordResult(hanziId, correct);
    recordEvidence(hanziId, { capability: "writing", gate: "UNDERSTAND", score: correct ? 100 : 0, independent: true, explanationPassed: correct });
  };

  if (mode === "daily") {
    return <HanziDailyLesson items={activeItems} initialItemId={learningItemId ?? undefined} onLearned={(id) => recordRecognitionResult(id, true)} onExplained={recordExplanation} onPractice={() => beginRecognition(sessionInUse)} onWriting={() => setMode("writing")} onBack={backToMenu} />;
  }

  if (mode === "recognition") {
    return (
      <HanziRecognitionRound
        onResult={recordRecognitionResult}
        onComplete={onComplete}
        onExit={backToMenu}
        onChangeMode={() => setMode("writing")}
        roundSize={8}
        title="认字闯关"
        items={activeItems}
        distractorPool={sessionInUse.distractorPool}
      />
    );
  }

  if (mode === "pinyin") {
    return <HanziPinyinLesson childId={childId} onBack={backToMenu} />;
  }

  if (mode === "writing") {
    return (
      <HanziWritingPractice
        onResult={recordWritingResult}
        onComplete={onComplete}
        onExit={backToMenu}
        onChangeMode={() => setMode("recognition")}
        items={activeItems}
      />
    );
  }

  if (mode === "idiom" && idiom) {
    return <HanziIdiomLesson lesson={idiom} lessons={HANZI_IDIOMS} onSelectLesson={setIdiomId} onExplained={() => recordIdiomExplanation(idiom.id)} onAnswer={(correct) => recordIdiomAnswer(idiom.id, correct)} onComplete={() => setIdiomId(selectNextIdiom(HANZI_IDIOMS, idiomProgress, idiom.id)?.id ?? null)} onBack={backToMenu} />;
  }

  if (mode === "story" && dailyItems[0]) {
    return <HanziStoryLesson item={dailyItems[0]} onBack={backToMenu} />;
  }

  if (mode === "library") {
    return (
        <HanziLibraryProgress
          progress={progress}
          idiomProgress={idiomProgress}
          currentUnitId={displayedUnit.id}
          selectedIds={browserSelectedIds}
          onSelectionChange={(ids) => { setSelectedHanziIds(ids); setSelectionTouched(true); }}
          onStartSelection={onStartSelection}
          onBack={backToMenu}
        />
    );
  }

  return (
    <HanziLearningHome
      grade={grade}
      onStartDaily={() => { setLearningItemId(null); setActiveSession(learningSession); setMode("daily"); }}
      onStartRecognition={() => beginRecognition()}
      onStartPinyin={() => setMode("pinyin")}
      onStartWriting={() => setMode("writing")}
      onStartStory={() => setMode("story")}
      onStartIdiom={() => { setIdiomId(selectNextIdiom(HANZI_IDIOMS, idiomProgress, idiomId ?? undefined)?.id ?? null); setMode("idiom"); }}
      onOpenLibrary={() => setMode("library")}
      onExit={onExit}
      items={dailyItems}
      currentUnitTitle={displayedUnit.title}
      progress={progress}
      currentUnitId={displayedUnit.id}
      selectedIds={browserSelectedIds}
      onUnitChange={changeUnit}
      onSelectionChange={(ids) => { setSelectedHanziIds(ids); setSelectionTouched(true); }}
      onStartSelection={onStartSelection}
      onOpenCharacter={openCharacterLesson}
    />
  );
}
