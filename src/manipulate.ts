import { GetTextTranslations } from "gettext-parser";

export interface RemoveByOptions {
  fuzzy?: boolean;
  obsolete?: boolean;
  untranslated?: boolean;
  translated?: boolean;
  translatedNotFuzzy?: boolean;
  fuzzyTranslated?: boolean;
  referenceContains?: string;
}

/**
 * remove entity by options
 */
export function removeByOptions(
  potrans: GetTextTranslations,
  options: RemoveByOptions | undefined
): GetTextTranslations {
  const fuzzyRegx = /\bfuzzy\b/;
  const obsoleteRegx = /\bobsolete\b/;
  const refRegMatch = options?.referenceContains
    ? /^\/([^\/]+)\/([igmsuy]*)/.exec(options?.referenceContains)
    : null;
  const refRegx = refRegMatch ? new RegExp(refRegMatch[1], refRegMatch[2]) : null;
  for (const [ctx, entries] of Object.entries(potrans.translations)) {
    for (const [msgid, entry] of Object.entries(entries)) {
      const msgstr = entry.msgstr.join("\n");
      // remove fuzzy
      if (options?.fuzzy && fuzzyRegx.test(entry.comments?.flag || "")) {
        delete potrans.translations[ctx][msgid];
      }
      // remove obsolete
      if (options?.obsolete && obsoleteRegx.test(entry.comments?.flag || "")) {
        delete potrans.translations[ctx][msgid];
      }
      // remove untranslated
      if (options?.untranslated && msgstr.length === 0) {
        delete potrans.translations[ctx][msgid];
      }
      // remove translated
      if (options?.translated && msgstr.length > 0) {
        delete potrans.translations[ctx][msgid];
      }
      // remove translated not fuzzy
      if (options?.translatedNotFuzzy && msgstr.length > 0 && !fuzzyRegx.test(entry.comments?.flag || "")) {
        delete potrans.translations[ctx][msgid];
      }
      // remove fuzzy translated
      if (options?.fuzzyTranslated && msgstr.length > 0 && fuzzyRegx.test(entry.comments?.flag || "")) {
        delete potrans.translations[ctx][msgid];
      }
      // remove reference contains
      if (options?.referenceContains) {
        if (refRegx) {
          if (entry.comments?.reference && refRegx.test(entry.comments?.reference)) {
            delete potrans.translations[ctx][msgid];
          }
        } else if (entry.comments?.reference?.includes(options?.referenceContains)) {
          delete potrans.translations[ctx][msgid];
        }
      }
    }
  }
  return potrans;
}
