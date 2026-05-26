import { parseMeaning } from "../js/ui/formatMeaning.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const concrete = parseMeaning("n. 混凝土adj. 1具体的 2有形的,实在的");
assert(concrete.length === 2, "concrete blocks");
assert(concrete[0].pos === "n" && concrete[0].senses[0].text === "混凝土", "concrete n");
assert(concrete[1].pos === "adj" && concrete[1].senses.length === 2, "concrete adj senses");
assert(concrete[1].senses[0].num === "1" && concrete[1].senses[0].text === "具体的", "adj 1");
assert(concrete[1].senses[1].num === "2" && concrete[1].senses[1].text.includes("有形的"), "adj 2");

const recess = parseMeaning("n. 1休会期 2课间休息 3休庭 v.休会");
assert(recess.length === 2 && recess[0].senses.length === 3, "recess n senses");
assert(recess[1].pos === "v", "recess v");

const intern = parseMeaning("n. 实习生;实习医师");
assert(intern[0].senses.length === 2, "intern split");

console.log("meaning format: ok");
