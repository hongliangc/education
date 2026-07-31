import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("idiom hook uses a child-scoped local storage key", () => {
  const source = readFileSync("components/games/hanzi/useHanziIdiomProgress.ts", "utf8");

  assert.match(source, /mlk-hanzi-idiom-progress/);
  assert.match(source, /childId/);
  assert.match(source, /recordIdiomResult/);
});

test("idiom lesson exposes story and quiz actions", () => {
  const source = readFileSync("components/games/hanzi/HanziIdiomLesson.tsx", "utf8");

  assert.match(source, /成语典故/);
  assert.match(source, /看典故/);
  assert.match(source, /做小测/);
  assert.match(source, /onAnswer/);
  assert.match(source, /onComplete/);
  assert.match(source, /播报题目和选项/);
  assert.match(source, /SpeechController/);
  assert.match(source, /学习记录已更新/);
  assert.match(source, /quizIndex/);
  assert.match(source, /lesson\.quiz\.length/);
  assert.match(source, /speechRef\.current\?\.stop\(\)/);
});

test("hanzi learning home presents the explicit current unit and actions", () => {
  const source = readFileSync("components/games/hanzi/HanziLearningHome.tsx", "utf8");

  assert.match(source, /currentUnitTitle/);
  assert.match(source, /items\.length/);
  assert.match(source, /汉字学习/);
  assert.match(source, /onStartRecognition/);
  assert.match(source, /onStartWriting/);
  assert.match(source, /onStartIdiom/);
  assert.match(source, /onStartPinyin/);
  assert.match(source, /onOpenLibrary/);
  assert.doesNotMatch(source, /<HanziLibraryProgress/);
});

test("writing game gives every child mode a route back to the hanzi home", () => {
  const source = readFileSync("components/games/WritingGame.tsx", "utf8");

  assert.match(source, /HanziLearningHome/);
  assert.match(source, /HanziIdiomLesson/);
  assert.match(source, /HanziPinyinLesson/);
  assert.match(source, /HanziDailyLesson/);
  assert.match(source, /HanziStoryLesson/);
  assert.match(source, /HanziLibraryProgress/);
  assert.match(source, /"daily"/);
  assert.match(source, /"pinyin"/);
  assert.match(source, /"story"/);
  assert.match(source, /"library"/);
  assert.match(source, /onBack=\{backToMenu\}/);
  assert.match(source, /onExit=\{backToMenu\}/);
});

test("hanzi recognition owns and stops its speech controller", () => {
  const source = readFileSync("components/games/hanzi/HanziRecognitionRound.tsx", "utf8");

  assert.match(source, /SpeechController/);
  assert.match(source, /speechRef/);
  assert.match(source, /speechRef\.current\?\.stop\(\)/);
  assert.match(source, /return \(\) =>/);
  assert.doesNotMatch(source, /choice\.pinyin/);
  assert.doesNotMatch(source, /choice\.label/);
});

test("hanzi writing stops character audio when leaving", () => {
  const source = readFileSync("components/games/hanzi/HanziWritingPractice.tsx", "utf8");

  assert.match(source, /SpeechController/);
  assert.match(source, /speechRef/);
  assert.match(source, /speechRef\.current\?\.stop\(\)/);
  assert.match(source, /return \(\) =>/);
});

test("pinyin learning starts with a foundation stage before character pinyin", () => {
  const source = readFileSync("components/games/hanzi/HanziPinyinLesson.tsx", "utf8") + readFileSync("components/games/hanzi/PinyinFoundationBoard.tsx", "utf8");

  assert.match(source, /foundation/);
  assert.match(source, /第一阶段/);
  assert.match(source, /第二阶段/);
  assert.match(source, /单韵母/);
  assert.match(source, /声调例字/);
  assert.match(source, /PinyinFoundationBoard/);
  assert.match(source, /它们拼成什么/);
  assert.match(source, /第二阶段完成/);
  assert.doesNotMatch(source, /% lesson\.length/);
  assert.match(source, /shufflePinyinChoices/);
  assert.match(source, /全部朗读/);
  assert.match(source, /PINYIN_SYLLABLES/);
});

test("approved hanzi redesign keeps the real curriculum and interactive learning views", () => {
  const home = readFileSync("components/games/hanzi/HanziLearningHome.tsx", "utf8");
  const curriculum = readFileSync("components/games/hanzi/HanziCurriculumBrowser.tsx", "utf8");
  const pinyin = readFileSync("components/games/hanzi/PinyinFoundationBoard.tsx", "utf8");
  const idiom = readFileSync("components/games/hanzi/HanziIdiomLesson.tsx", "utf8");
  const game = readFileSync("components/games/WritingGame.tsx", "utf8");

  assert.match(home, /继续上次学习/);
  assert.match(home, /课程目录/);
  assert.match(curriculum, /全选/);
  assert.match(curriculum, /清空/);
  assert.match(curriculum, /进入单字学习/);
  assert.match(pinyin, /四声练习/);
  assert.match(pinyin, /一声/);
  assert.match(pinyin, /四声/);
  assert.match(idiom, /读成语/);
  assert.match(idiom, /听典故/);
  assert.match(idiom, /成语目录/);
  assert.match(idiom, /onSelectLesson/);
  assert.match(game, /lessons=\{HANZI_IDIOMS\}/);
  assert.match(game, /onSelectLesson=\{setIdiomId\}/);
});

test("hanzi home consumes the approved storybook slice assets", () => {
  const home = readFileSync("components/games/hanzi/HanziLearningHome.tsx", "utf8");

  assert.match(home, /\/ui\/hanzi\/storybook-v3/);
  for (const asset of ["title-plaque.webp", "mission-frame.png", "icon-hanzi.webp", "icon-pinyin.webp", "icon-idiom.webp"]) {
    assert.match(home, new RegExp(asset.replace(".", "\\.")));
  }
});

test("writing practice supports both character and word lessons", () => {
  const source = readFileSync("components/games/hanzi/HanziWritingPractice.tsx", "utf8") + readFileSync("components/games/hanzi/HanziWordWritingPractice.tsx", "utf8");

  assert.match(source, /单字练习/);
  assert.match(source, /词语练习/);
  assert.match(source, /重点词语/);
  assert.match(source, /当前要写/);
});

test("hanzi library uses content entry cards instead of one long page", () => {
  const source = readFileSync("components/games/hanzi/HanziLibraryProgress.tsx", "utf8") + readFileSync("components/games/hanzi/HanziLibraryExtras.tsx", "utf8");
  const wiring = readFileSync("components/games/WritingGame.tsx", "utf8");

  assert.match(source, /我的汉字/);
  assert.match(source, /我的组词/);
  assert.match(source, /我的成语/);
  assert.match(source, /LibrarySection/);
  assert.match(source, /选择学习内容/);
  assert.match(source, /返回内容分类/);
  assert.match(source, /IdiomProgressMap/);
  assert.match(source, /HANZI_IDIOMS/);
  assert.match(wiring, /idiomProgress=\{idiomProgress\}/);
  assert.match(wiring, /currentUnitId=\{displayedUnit\.id\}/);
});

test("hanzi curriculum browser selects purposeful units instead of grade buckets", () => {
  const browser = readFileSync("components/games/hanzi/HanziCurriculumBrowser.tsx", "utf8");
  const card = readFileSync("components/games/hanzi/HanziUnitCard.tsx", "utf8");
  const library = readFileSync("components/games/hanzi/HanziLibraryProgress.tsx", "utf8");
  const game = readFileSync("components/games/WritingGame.tsx", "utf8");

  assert.match(browser, /启蒙认字/);
  assert.match(browser, /生活表达/);
  assert.match(browser, /阅读进阶/);
  assert.match(browser, /自主阅读/);
  assert.match(browser + card, /推荐下一课/);
  assert.match(browser, /已选.*字/);
  assert.match(browser, /disabled=\{selectedIds\.length === 0\}/);
  assert.match(card, /全组选取/);
  assert.match(card, /onToggleChar/);
  assert.match(library, /HanziCurriculumBrowser/);
  assert.match(game, /selectedHanziIds/);
  assert.match(game, /onStartSelection/);
});

test("recognition and writing persist separate mastery evidence", () => {
  const game = readFileSync("components/games/WritingGame.tsx", "utf8");
  const masteryHook = readFileSync("components/games/hanzi/useHanziMasteryProgress.ts", "utf8");

  assert.match(game, /useHanziMasteryProgress/);
  assert.match(game, /capability: "recognition"/);
  assert.match(game, /capability: "writing"/);
  assert.match(masteryHook, /mlk-hanzi-mastery/);
  assert.match(masteryHook, /recordHanziEvidence/);
  assert.match(masteryHook, /loadedKey/);
  assert.match(masteryHook, /loadedKey !== storageKey/);
});

test("recognition freezes its session instead of restarting after progress updates", () => {
  const game = readFileSync("components/games/WritingGame.tsx", "utf8");
  const recognition = readFileSync("components/games/hanzi/HanziRecognitionRound.tsx", "utf8");

  assert.match(game, /activeSession/);
  assert.match(game, /setActiveSession/);
  assert.match(game, /beginRecognition/);
  assert.doesNotMatch(recognition, /restart\(\);[\s\S]*\}, \[items\]\)/);
});

test("answer handlers stop narration before applying feedback", () => {
  const recognition = readFileSync("components/games/hanzi/HanziRecognitionRound.tsx", "utf8");
  const pinyin = readFileSync("components/games/hanzi/HanziPinyinLesson.tsx", "utf8");
  const writing = readFileSync("components/games/hanzi/HanziWritingPractice.tsx", "utf8");

  assert.match(recognition, /const choose[\s\S]*speechRef\.current\?\.stop\(\)/);
  assert.match(pinyin, /onSelect/);
  assert.match(pinyin, /stopSpeech\(\)/);
  assert.match(writing, /const next[\s\S]*speechRef\.current\?\.stop\(\)/);
});

test("daily lesson automatically narrates each learning card", () => {
  const source = readFileSync("components/games/hanzi/HanziDailyLesson.tsx", "utf8");

  assert.match(source, /useEffect\(\(\) => \{/);
  assert.match(source, /listen\(\)/);
  assert.match(source, /我讲完了/);
  assert.match(source, /onExplained/);
  assert.match(source, /认一认/);
  assert.match(source, /写一写/);
});

test("hanzi child lessons share one screen header and semantic progress colors", () => {
  const lessonFiles = [
    "HanziDailyLesson.tsx",
    "HanziRecognitionRound.tsx",
    "HanziWritingPractice.tsx",
    "HanziWordWritingPractice.tsx",
    "HanziStoryLesson.tsx",
    "HanziPinyinLesson.tsx",
    "HanziIdiomLesson.tsx",
  ];
  for (const file of lessonFiles) {
    const source = readFileSync(`components/games/hanzi/${file}`, "utf8");
    assert.match(source, /HanziShell|HanziScreenHeader/, `${file} should use the shared header`);
  }

  const browser = readFileSync("components/games/hanzi/HanziCurriculumBrowser.tsx", "utf8");
  assert.match(browser, /new-content/);
  assert.match(browser, /learning/);
  assert.match(browser, /review/);
  assert.match(browser, /known/);
});

test("hanzi home matches the approved single-screen directory preview", () => {
  const page = readFileSync("app/(game)/play/[module]/page.tsx", "utf8");
  const modal = readFileSync("components/GameModal.tsx", "utf8");
  const home = readFileSync("components/games/hanzi/HanziLearningHome.tsx", "utf8");
  const browser = readFileSync("components/games/hanzi/HanziCurriculumBrowser.tsx", "utf8");
  const card = readFileSync("components/games/hanzi/HanziLearningCardPanel.tsx", "utf8");

  assert.match(page, /hideHeader=\{slug === "writing"\}/);
  assert.match(page, /wide=\{slug === "writing"\}/);
  assert.match(modal, /hideHeader/);
  assert.match(home, /今天学.*个字/);
  assert.match(home, /h-\[min\(/);
  assert.doesNotMatch(home, /LearningCard/);
  assert.match(browser, /mlk-hanzi-last-unit/);
  assert.match(browser, /String\(index \+ 1\)\.padStart\(2, "0"\)/);
  assert.match(browser, /🔖/);
  assert.match(card, /fixed inset-0/);
});

test("hanzi home shows direct lesson entries and pinyin controls have safe spacing", () => {
  const home = readFileSync("components/games/hanzi/HanziLearningHome.tsx", "utf8");
  const pinyin = readFileSync("components/games/hanzi/PinyinFoundationBoard.tsx", "utf8");
  const lesson = readFileSync("components/games/hanzi/HanziPinyinLesson.tsx", "utf8");
  const shell = readFileSync("components/games/hanzi/HanziShell.tsx", "utf8");

  for (const label of ["汉字学习", "拼音乐园", "成语"]) {
    assert.match(home, new RegExp(label));
  }
  assert.doesNotMatch(home, /toolsOpen/);
  assert.match(home, /学习入口/);
  assert.match(lesson, /HanziShell/);
  assert.match(shell, /px-2.*sm:px-6/);
  assert.match(pinyin, /min-h-11/);
  assert.match(pinyin, /px-5/);
});

test("hanzi learning uses four first-level destinations and a dedicated character page", () => {
  const home = readFileSync("components/games/hanzi/HanziLearningHome.tsx", "utf8");
  const daily = readFileSync("components/games/hanzi/HanziDailyLesson.tsx", "utf8");
  const game = readFileSync("components/games/WritingGame.tsx", "utf8");

  assert.equal((home.match(/<LessonEntry/g) ?? []).length, 3);
  assert.match(home, /label="汉字学习"/);
  assert.match(home, /label="拼音乐园"/);
  assert.match(home, /label="成语"/);
  assert.doesNotMatch(home, /label="故事"/);
  assert.match(daily, /组词/);
  assert.match(daily, /例句/);
  assert.match(daily, /写一写/);
  assert.match(daily, /onWriting/);
  assert.match(game, /onWriting=\{\(\) => setMode\("writing"\)\}/);
});

test("clicking a curriculum character opens that character in the dedicated lesson", () => {
  const browser = readFileSync("components/games/hanzi/HanziCurriculumBrowser.tsx", "utf8");
  const home = readFileSync("components/games/hanzi/HanziLearningHome.tsx", "utf8");
  const game = readFileSync("components/games/WritingGame.tsx", "utf8");
  const daily = readFileSync("components/games/hanzi/HanziDailyLesson.tsx", "utf8");

  assert.match(browser, /onOpenCharacter\(item\.id, items\.map/);
  assert.doesNotMatch(browser, /setSelectedItem\(item\)/);
  assert.match(home, /onOpenCharacter=\{onOpenCharacter\}/);
  assert.match(game, /openCharacterLesson/);
  assert.match(game, /initialItemId=\{learningItemId/);
  assert.match(daily, /initialItemId/);
});

test("writing and pinyin use the approved dense learning-workspace layouts", () => {
  const writing = readFileSync("components/games/hanzi/HanziWritingPractice.tsx", "utf8");
  const pinyin = readFileSync("components/games/hanzi/PinyinFoundationBoard.tsx", "utf8");

  assert.match(writing, /md:grid-cols-\[minmax\(0,0\.8fr\)_minmax\(0,1\.4fr\)_minmax\(0,0\.9fr\)\]/);
  assert.match(writing, /笔顺提示/);
  assert.match(writing, /笔画进度/);
  assert.match(writing, /当前任务/);
  assert.match(pinyin, /lg:grid-cols-\[18rem_minmax\(0,1fr\)\]/);
  assert.match(pinyin, /学习顺序/);
  assert.match(pinyin, /学习进度/);
});

test("other hanzi child lessons use the same bounded viewport shell", () => {
  for (const file of ["HanziRecognitionRound.tsx", "HanziWordWritingPractice.tsx", "HanziStoryLesson.tsx", "HanziIdiomLesson.tsx"]) {
    const source = readFileSync(`components/games/hanzi/${file}`, "utf8");
    assert.match(source, /HanziShell/, `${file} should fill the learning workspace`);
  }
});

test("thin story content is folded into hanzi learning and tones have distinct fallbacks", () => {
  const home = readFileSync("components/games/hanzi/HanziLearningHome.tsx", "utf8");
  const pinyin = readFileSync("components/games/hanzi/PinyinFoundationBoard.tsx", "utf8");
  const daily = readFileSync("components/games/hanzi/HanziDailyLesson.tsx", "utf8");
  const idiom = readFileSync("components/games/hanzi/HanziIdiomLesson.tsx", "utf8");

  assert.equal((home.match(/<LessonEntry/g) ?? []).length, 3);
  assert.doesNotMatch(home, /label="故事"/);
  assert.match(pinyin, /playPinyinClip\(tone\.path\)/);
  assert.match(pinyin, /pinyinToneAudioPath/);
  assert.match(pinyin, /tone\.character/);
  assert.match(daily, /sm:grid-cols-\[minmax\(0,1fr\)_minmax\(12rem,.85fr\)\]/);
  assert.match(daily, /HanziShell/);
  assert.match(idiom, /lg:grid-cols-2/);
});

test("the character lesson uses a short two-column rail and fills the hero horizontally", () => {
  const daily = readFileSync("components/games/hanzi/HanziDailyLesson.tsx", "utf8");
  assert.match(daily, /sm:grid-cols-\[minmax\(0,1fr\)_minmax\(12rem,.85fr\)\]/);
  assert.match(daily, /aria-label="本单元汉字"/);
  assert.match(daily, /grid-cols-3/);
  assert.match(daily, /记忆提示/);
});

test("finals use tone examples while initials keep their short base sound", () => {
  const board = readFileSync("components/games/hanzi/PinyinFoundationBoard.tsx", "utf8");
  assert.match(board, /toneChoices/);
  assert.match(board, /pinyinToneExamples/);
  assert.match(board, /声母本身没有声调/);
  assert.match(board, /toneChoices\.map/);
});

test("every hanzi learning mode uses the implementation-grade storybook shell", () => {
  const shell = readFileSync("components/games/hanzi/HanziShell.tsx", "utf8");
  assert.match(shell, /world-bg-mobile-v1/);
  assert.match(shell, /world-bg-desktop-v1/);
  assert.match(shell, /aria-label="学习进度"/);
  assert.match(shell, /env\(safe-area-inset-bottom\)/);

  for (const file of [
    "HanziDailyLesson.tsx",
    "HanziRecognitionRound.tsx",
    "HanziWritingPractice.tsx",
    "HanziWordWritingPractice.tsx",
    "HanziStoryLesson.tsx",
    "HanziPinyinLesson.tsx",
    "HanziIdiomLesson.tsx",
    "HanziLibraryProgress.tsx",
  ]) {
    const source = readFileSync(`components/games/hanzi/${file}`, "utf8");
    assert.match(source, /HanziShell/, `${file} should use HanziShell`);
  }
});
