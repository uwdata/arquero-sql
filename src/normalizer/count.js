import { internal, op } from "arquero";

export function normalizeCount(verb) {
  if (verb.verb === "count") {
    const as =
      ("options" in verb && "as" in verb.options && verb.option.as) || "count";
    return internal.Verbs.rollup({ [as]: op.count() });
  } else {
    return verb;
  }
}
