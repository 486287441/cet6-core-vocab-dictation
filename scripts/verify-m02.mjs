import { createBatchSession } from "../js/state.js";

function makeBatch(n) {
  return Array.from({ length: n }, (_, i) => ({
    word: `w${i}`,
    meaning: `m${i}`,
  }));
}

function playAll(session, rememberFn, maxSteps = 500) {
  let steps = 0;
  while (!session.isBatchComplete()) {
    if (steps++ > maxSteps) throw new Error("playAll: exceeded max steps");
    const w = session.getCurrentWord();
    if (!w) throw new Error("playAll: no current word but batch not complete");
    session.judge(rememberFn(w));
    if (!session.canAdvance()) throw new Error(`cannot advance at ${w.word}`);
    session.advance();
  }
}

function runRound(session, remember) {
  let steps = 0;
  while (!session.isBatchComplete()) {
    if (steps++ > 500) throw new Error("runRound: exceeded max steps");
    const w = session.getCurrentWord();
    if (!w) throw new Error("runRound: no current word but batch not complete");
    session.judge(remember(w));
    if (!session.canAdvance()) throw new Error(`cannot advance at ${w.word}`);
    session.advance();
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// 1 — 50 词全「记得」，一轮通关
{
  const s = createBatchSession(makeBatch(50));
  playAll(s, () => true);
  assert(s.isBatchComplete(), "test1: should complete");
  assert(s.getRound() === 1, "test1: should finish in round 1");
  assert(s.getEverForgottenList().length === 0, "test1: no forgotten");
}

// 2 — 前两轮全「不记得」，第三轮起全「记得」
{
  const s = createBatchSession(makeBatch(50));
  runRound(s, () => s.getRound() >= 3);
  assert(s.isBatchComplete(), "test2: should complete");
  assert(s.getRound() === 3, "test2: should finish in round 3");
  assert(s.getEverForgottenList().length === 50, "test2: all were forgotten once");
}

// 3 — 前 25 记得、后 25 不记得，第二轮全记得
{
  const s = createBatchSession(makeBatch(50));
  runRound(s, (w) => {
    const index = Number(w.word.slice(1));
    return s.getRound() === 1 ? index < 25 : true;
  });
  assert(s.isBatchComplete(), "test3: should complete");
  assert(s.getRound() === 2, "test3: should finish in round 2");
  const forgotten = s.getEverForgottenList().map((x) => x.word);
  assert(forgotten.length === 25, "test3: 25 ever forgotten");
  assert(forgotten[0] === "w25" && forgotten[24] === "w49", "test3: w25–w49");
}

// 4 — 曾不记得后改记得，仍在 everForgotten
{
  const s = createBatchSession(makeBatch(3));
  runRound(s, (w) => (s.getRound() === 1 ? w.word !== "w0" : true));
  assert(s.isBatchComplete(), "test4: should complete");
  assert(s.getEverForgottenList().length === 1, "test4: still lists w0");
  assert(s.getEverForgottenList()[0].word === "w0", "test4: w0");
}

console.log("M02 verify: all 4 tests passed");
