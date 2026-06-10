/** types.test.tsx — compile-time guarantees. tsc must pass (i.e. every @ts-expect-error fires). */
import * as z from "zod";
import { text, select, number, check, type Profile } from "../examples/profile";
import * as insane from "../src";
import type { FieldProps } from "../src";

/* Self-initializing widgets (value: T | undefined) bind freely. */
const t1 = text(z.string());
const t2 = text(z.string().min(3).meta({ title: "ok" }));
const n1 = number(z.number().int().min(18));

/* Strict widgets (value: T): schema must say what blank means. */
const c1 = check(z.boolean().default(false));
const s1 = select(z.enum(["a", "b"]).default("a"));
const s2 = select(z.string().default("x"));
const SelectWidget = (_p: FieldProps<string>) => null;
const s3 = insane.field({ schema: z.enum(["a", "b"]), widget: SelectWidget, initial: "a" }); // explicit initial also satisfies

// @ts-expect-error — strict widget, no default, no initial: must not compile
const bad1 = select(z.enum(["a", "b"]));
// @ts-expect-error — .optional() is not a concrete renderable initial
const bad2 = select(z.string().optional());
// @ts-expect-error — a bare boolean leaves "unchecked" undefined: checkbox demands .default(false)
const bad3 = check(z.boolean());

/* The returned value is plain Zod: chaining + inference stay native. */
const refined = t1.min(2).max(40);
type S1 = z.infer<typeof s1>;
const v1: S1 = "a";
// @ts-expect-error — enum inference is exact
const v1bad: S1 = "c";

/* Composition inference: decorations never reach the data type. */
type P = z.output<typeof Profile>;
const p: P = {
  id: "x",
  name: "Ada",
  email: "a@b.co",
  age: 30,
  role: "guest",
  newsletter: false,
  address: { city: "BCN", zip: "08001" },
  contacts: [{ email: "a@b.co", primary: true }],
  nickname: undefined,
};
// @ts-expect-error — wrong field type is a compile error
const pBad: P = { ...p, age: "thirty" };

/* FieldProps pins the widget body type. */
const w = (q: FieldProps<string>) => {
  // @ts-expect-error — value is string, not number
  const n: number = q.value;
  return null;
};

/* Fragment composition inference: concatenated shapes flow through z.infer. */
const FragA = insane.group({ x: text(z.string()) });
const FragB = insane.group({ y: number(z.number()) });
const AB = insane.group(FragA, FragB);
const ab: z.infer<typeof AB> = { x: "1", y: 2 };
// @ts-expect-error — concatenation is exact: no extra keys
const abBad: z.infer<typeof AB> = { x: "1", y: 2, z: true };

void [t2, n1, c1, refined, v1, s2, s3, p, w, bad1, bad2, bad3, v1bad, pBad, ab, abBad];
