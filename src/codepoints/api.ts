import type { CodepointMeta } from "./types";
import * as parse5 from "parse5";

// Generic fetch wrapper that retries on HTTP 500 up to maxAttempts times (default 5)
async function fetchRetry(url: string, init?: RequestInit, maxAttempts = 5): Promise<Response> {
  let attempt = 0;
  while (true) {
    const resp = await fetch(url, init);
    attempt++;
    if (resp.status !== 500 || attempt >= maxAttempts) return resp;
    // (Optional) could add small delay/backoff here; omitted per current requirements.
  }
}

export async function fetchRandomHex(): Promise<string> {
  const resp = await fetchRetry("https://codepoints.net/random", { redirect: "manual" });
  if (resp.status < 300 || resp.status >= 400) {
    throw new Error(`Unexpected status from /random: ${resp.status}`);
  }
  const location = resp.headers.get("Location") || "";
  const match = /\/U\+([0-9A-F]{4,6})/i.exec(location);
  if (!match) {
    throw new Error(`Could not extract hex from Location: ${location}`);
  }
  return match[1].toUpperCase();
}

export async function fetchSvg(hex: string): Promise<string | null> {
  const url = `https://codepoints.net/api/v1/glyph/${hex}`;
  const resp = await fetchRetry(url, { headers: { Accept: "image/svg+xml" } });
  // if (!resp.ok) throw new Error(`Failed to fetch SVG for ${hex}: ${resp.status}`);
  if (!resp.ok) return null;
  return await resp.text();
}

export async function fetchMeta(hex: string): Promise<CodepointMeta> {
  const url = `https://codepoints.net/api/v1/codepoint/${hex}`;
  const resp = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!resp.ok) throw new Error(`Failed to fetch meta for ${hex}: ${resp.status}`);
  return (await resp.json()) as CodepointMeta;
}

export async function fetchBlockSvg(meta: CodepointMeta): Promise<string | null> {
  if (!meta._?.description) { return null; }
  const matches = meta._.description.matchAll(/<svg viewBox=".+?LastResort.+?<\/svg>/ig);
  for (const match of matches) {
      const svgContent = match[0];
      if (svgContent.includes("notdef")) continue;
      const url = svgContent.match(/xlink:href="(.+)"/)?.[1];
      if (!url) return null;
      const [path, id] = `https://codepoints.net/${url}`.split("#");
      const resp = await fetchRetry(path);
      const respContent = await resp.text();

      // Parse the SVG content using parse5 (respContent has <svg> as root element)
      const svgElement = parse5.parseFragment(respContent).childNodes[0];
      if (!svgElement || svgElement.nodeName !== 'svg') continue;

      // Filter children to keep only the element with the specified id
      if (svgElement.childNodes) {
        svgElement.childNodes = svgElement.childNodes.filter((child: any) => {
          // Keep text nodes (whitespace, etc.)
          if (child.nodeName === '#text') return false;
          
          // Keep elements that have the matching id
          if (child.attrs) {
            const idAttr = child.attrs.find((attr: any) => attr.name === 'id');
            return idAttr && idAttr.value === id;
          }
          
          return false;
        });
      }

      // Serialize the modified SVG back to string
      const serializedSvg = parse5.serializeOuter(svgElement);
      return serializedSvg;
  }
  return null;
}

export async function fetchPlangothicSvg(hex: string): Promise<string | null> {
  const hexLower = hex.toLowerCase();
  const url = `https://seeki.vistudium.top/SVG/${hexLower}.svg`;
  const resp = await fetchRetry(url);
  if (resp.status !== 200) return null;
  let text = await resp.text();
  // Remove leading XML declaration and DOCTYPE if present
  text = text.replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, "");
  text = text.replace(/^\s*<!DOCTYPE[\s\S]*?>\s*/i, "");
  return text;
}