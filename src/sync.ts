import { compilePo, parsePo } from "./utils";

export async function sync(po: string, pot: string) {
  const potrans = await parsePo(po);
  const potrans2 = await parsePo(pot);

  for (const [ctx, entries] of Object.entries(potrans2.translations)) {
    // copy msgstr from potrans to potrans2
    for (const [msgid, _] of Object.entries(entries)) {
      if (
        potrans.translations[ctx] &&
        potrans.translations[ctx][msgid] &&
        potrans.translations[ctx][msgid].msgstr[0]
      ) {
        potrans2.translations[ctx][msgid] = potrans.translations[ctx][msgid];
      }
    }
  }
  potrans.translations = potrans2.translations;
  await compilePo(potrans, po);
}
