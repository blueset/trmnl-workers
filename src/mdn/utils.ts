/**
 * @author Jan Andrle
 * @source https://github.com/jaandrle/randomMDN
 * @license MIT
 */

export const url_main = "https://developer.mozilla.org/en-US/";
export const url_web = url_main + "docs/Web";
export const url_sitemap =
  "https://developer.mozilla.org/sitemaps/en-us/sitemap.xml.gz";

// Type definitions converted from JSDoc
export type Baseline =
  | { baseline: false }
  | { baseline: "low"; baseline_low_date: string }
  | { baseline: "high"; baseline_low_date: string; baseline_high_date: string };

interface MDNDocSource {
    isActive: boolean;
    title?: string;
    link?: string;
    description?: string;
    updated?: string;
    github_file?: string;
    baseline?: Baseline | any;
    source?: {
        github_url?: string;
    };
    parents: {
        title: string;
        link: string;
    }[];
}

export interface ArticleObject {
  title: string;
  link: string;
  description: string;
  updated: string;
  github_file: string;
  baseline?: Baseline | any;
  parents: {
      title: string;
      link: string;
  }[];
}

let webDocUrls: string[] | undefined;

/** A very small, async-aware pipe implementation so the original usage
// `pipe(...fns)()` (which may include async functions) resolves as expected. */
function pipe(...fns: Array<(arg?: any) => any | Promise<any>>) {
  return async () => {
    let value: any = undefined;
    for (const fn of fns) {
      value = await fn(value);
    }
    return value;
  };
}

/** Returns a random MDN article (guaranteed to have a title) */
export async function randomMDN(): Promise<ArticleObject> {
  if (!webDocUrls) webDocUrls = await getWebDocUrls();
  const webDocUrls_len = webDocUrls.length;
  let candidate: Partial<ArticleObject> = {};
  while (!candidate.title)
    candidate = await pipe(
      () => webDocUrls_len * Math.random(),
      (random_number) => Math.floor(random_number),
      (random_integer) => webDocUrls![random_integer],
      parseArticle
    )();
  return candidate as ArticleObject;
}

async function getWebDocUrls(): Promise<string[]> {
  const sitemap = await fetch(url_sitemap, {
    headers: { "accept-encoding": "gzip" },
  }).then((res) => res.text());

  const matches = Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g));
  return matches
    .map((m) => m[1])
    .filter((u): u is string => typeof u === "string" && u.startsWith(url_web));
}

async function parseArticle(
  link: string
): Promise<ArticleObject | { title: null }> {
  const jsonEmpty = () => ({ isActive: false });
  const json: MDNDocSource = await fetch(link + "/index.json")
    .then((res: any) => res.json())
    .then((j: any) => j.doc || jsonEmpty())
    .catch(jsonEmpty);
  if (!json.isActive || isDeprecated(json)) return { title: null };

  const pluck = (key: string, o: Record<string, any> = json) => {
    return o[key] || "";
  };
  return {
    title: pluck("title"),
    link,
    description: String(pluck("summary")).replace(/\n */g, " "),
    updated: pluck("modified"),
    github_file: pluck("github_url", json.source || {}),
    baseline: pluck("baseline"),
    parents: pluck("parents"),
  };
}

function isDeprecated(obj: any): boolean {
  const opening = obj?.body?.[0];
  if (!opening) return true;
  const content = opening?.value?.content;
  if (!content) return true;
  return /class="notecard deprecated"/.test(content);
}
