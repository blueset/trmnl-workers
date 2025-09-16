import { GCB_LABELS, SB_LABELS, WB_LABELS, BC_LABELS, BPT_LABELS, DT_LABELS, EA_LABELS, GC_LABELS, HST_LABELS, JT_LABELS, NT_LABELS, LB_LABELS, LB_DESCRIPTIONS, CCC_LABELS, CCC_DESCRIPTIONS, SCRIPT_LABELS } from "./consts";
import { CodepointMeta, Description, SVGInfo } from "./types";
import * as parse5 from 'parse5';

export function processSVG(svg: string | null, meta: CodepointMeta, blockSvg: string | null): SVGInfo[] {
    if (!svg) {
        if (blockSvg) {
            return [{ svg: blockSvg, font: "Last Resort" }];
        }
        return [];
    }

    const single = [{ svg, font: meta._?.imagesource || null }];

    let fragment: any;
    try {
        // Parse as fragment so the top-level <svg> is a direct child
        fragment = parse5.parseFragment(svg) as any;
    } catch {
        return single;
    }
    if (!fragment || !fragment.childNodes) return single;

    // Find the root <svg>
    const root = (fragment.childNodes as any[]).find(n => n.tagName === 'svg');
    if (!root) return single;

    const directChildren: any[] = (root.childNodes || []).filter((n: any) => n && n.tagName === 'svg');
    if (directChildren.length === 0) return single;

    const processed: SVGInfo[] = [];

    for (const child of directChildren) {
        // Work directly on child (safe – siblings independent)
        removeAnimate(child);

        // Ensure xmlns attribute present (tests expect it even if absent originally)
        if (!child.attrs) child.attrs = [];
        const hasXmlns = child.attrs.some((a: any) => a.name === 'xmlns');
        if (!hasXmlns) {
            child.attrs.push({ name: 'xmlns', value: 'http://www.w3.org/2000/svg' });
        }

        // Derive font variant from id last two chars (mirrors previous logic)
        const idAttr = (child.attrs.find((a: any) => a.name === 'id')?.value) || '';
        const variant = idAttr ? idAttr.slice(-2).toUpperCase() : '';
        const baseFont = meta._?.imagesource || '';
        const font = (baseFont ? `${baseFont} ${variant}` : variant).trim() || null;

        const serialized = parse5.serializeOuter(child).trim();
        processed.push({ svg: serialized, font });
    }

    return processed;
}

function removeAnimate(el: any) {
    if (!el || !el.childNodes) return;
    const next: any[] = [];
    for (const n of el.childNodes) {
        if (n && n.tagName) {
            if (n.tagName.toLowerCase && n.tagName.toLowerCase() === 'animate') {
                // skip (remove)
                continue;
            }
            removeAnimate(n);
        }
        next.push(n);
    }
    el.childNodes = next;
}

export function processDescriptions(meta: CodepointMeta): Description[] {
    const descriptions: Description[] = [];

    let raw = meta._?.description || '';
    if (raw.trim()) {
        raw = raw
            .replace(/(?=<p>\n  The <a href="https:\/\/cldr\.unicode\.org\/">CLDR project<\/a>)/, '\n<!-- CLDR -->\n')
            .replace(/(?=<p>\n  The <a href=\"https:\/\/www.unicode.org\/reports\/tr57\/\">Unikemet database<\/a>)/, '\n<!-- Unikemet -->\n')
            .replace(/(?=<p>\n  This character is designated as an emoji)/, '\n<!-- Emoji -->\n');
        // Parse as a fragment to obtain linear top-level node sequence
        const fragment = parse5.parseFragment(raw) as any;
        const toTitleCase = (s: string) => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1));
        interface Section { titleRaw: string; nodes: any[]; }
        const sections: Section[] = [];
        let current: Section | null = null;
        for (const node of fragment.childNodes || []) {
            if (node.nodeName === '#comment') {
                const name = (node.data || '').trim();
                if (name) {
                    current = { titleRaw: name, nodes: [] };
                    sections.push(current);
                }
            } else if (current) {
                current.nodes.push(node);
            }
        }

        const sanitizeTree = (node: any) => {
            if (!node) return;
            if (node.tagName) {
                const tagLower = node.tagName.toLowerCase();
                if (tagLower === 'svg') {
                    node.__remove = true;
                    return;
                }
                if (tagLower === 'a') {
                    node.tagName = 'u';
                }
                if (node.attrs) {
                    node.attrs = node.attrs.filter((a: any) => a.name.toLowerCase() !== 'class');
                    if (node.tagName === 'u') node.attrs = [];
                }
            }
            if (node.childNodes) {
                for (const c of node.childNodes) sanitizeTree(c);
                node.childNodes = node.childNodes.filter((c: any) => !c.__remove);
            }
        };

        for (const s of sections) {
            // Serialize original nodes then parse again to get a detached fragment
            const combinedHtml = s.nodes.map((n: any) => parse5.serializeOuter(n)).join('');
            const frag: any = parse5.parseFragment(combinedHtml);
            frag.childNodes.forEach((n: any) => sanitizeTree(n));
            frag.childNodes = frag.childNodes.filter((c: any) => !c.__remove);
            const html = parse5.serialize(frag).trim();
            descriptions.push({ title: toTitleCase(s.titleRaw), html });
        }
    }

    const wiki = meta._?.wikipedia;
    if (wiki?.abstract) {
        descriptions.push({ title: `Wikipedia (${wiki.lang})`, html: wiki.abstract.replace(/<p>[\w\s]+<\/p>[\w\s]+/, '') });
    }

    return descriptions;
}


/* Generate hex representations for number/number[] properties */
function convertToHex(value: number | number[] | undefined): string | string[] | undefined {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) {
        return value.map(num => num.toString(16).toUpperCase().padStart(4, '0'));
    } else {
        return value.toString(16).toUpperCase().padStart(4, '0');
    }
}

export function labelProperties(meta: CodepointMeta) {
    if (GCB_LABELS[meta.GCB]) {
        meta.GCB_NAME = GCB_LABELS[meta.GCB];
    }
    if (SB_LABELS[meta.SB]) {
        meta.SB_NAME = SB_LABELS[meta.SB];
    }
    if (WB_LABELS[meta.WB]) {
        meta.WB_NAME = WB_LABELS[meta.WB];
    }
    if (BC_LABELS[meta.bc]) {
        meta.bc_NAME = BC_LABELS[meta.bc];
    }
    if (BPT_LABELS[meta.bpt]) {
        meta.bpt_NAME = BPT_LABELS[meta.bpt];
    }
    if (DT_LABELS[meta.dt]) {
        meta.dt_NAME = DT_LABELS[meta.dt];
    }
    if (EA_LABELS[meta.ea]) {
        meta.ea_NAME = EA_LABELS[meta.ea];
    }
    if (GC_LABELS[meta.gc]) {
        meta.gc_NAME = GC_LABELS[meta.gc];
    }
    if (HST_LABELS[meta.hst]) {
        meta.hst_NAME = HST_LABELS[meta.hst];
    }
    if (JT_LABELS[meta.jt]) {
        meta.jt_NAME = JT_LABELS[meta.jt];
    }
    if (NT_LABELS[meta.nt]) {
        meta.nt_NAME = NT_LABELS[meta.nt];
    }
    if (LB_LABELS[meta.lb]) {
        meta.lb_NAME = LB_LABELS[meta.lb];
        meta.lb_DESCRIPTION = LB_DESCRIPTIONS[meta.lb];
    }
    if (CCC_LABELS[meta.ccc]) {
        meta.ccc_NAME = CCC_LABELS[meta.ccc];
        meta.ccc_DESCRIPTION = CCC_DESCRIPTIONS[meta.ccc];
    }
    if (SCRIPT_LABELS[meta.sc]) {
        meta.sc_NAME = SCRIPT_LABELS[meta.sc];
    }
    if (meta.scx?.length) {
        // scx can contain multiple script codes separated by spaces
        const scriptCodes = meta.scx;
        const scriptNames = scriptCodes?.map(code => SCRIPT_LABELS[code as keyof typeof SCRIPT_LABELS]).filter(Boolean);
        meta.scx_NAME = scriptNames.length > 0 ? scriptNames : null;
    }
    if (meta.cp !== undefined) { meta.cp_HEX = convertToHex(meta.cp) as string; }
    if (meta.dm !== undefined) meta.dm_HEX = convertToHex(meta.dm) as string[] | string;
    if (meta.slc !== undefined) meta.slc_HEX = convertToHex(meta.slc) as string[] | string;
    if (meta.lc !== undefined) meta.lc_HEX = convertToHex(meta.lc) as string[] | string;
    if (meta.suc !== undefined) meta.suc_HEX = convertToHex(meta.suc) as string[] | string;
    if (meta.uc !== undefined) meta.uc_HEX = convertToHex(meta.uc) as string[] | string;
    if (meta.stc !== undefined) meta.stc_HEX = convertToHex(meta.stc) as string[] | string;
    if (meta.tc !== undefined) meta.tc_HEX = convertToHex(meta.tc) as string[] | string;
    if (meta.cf !== undefined) meta.cf_HEX = convertToHex(meta.cf) as string[] | string;
    if (meta.FC_NFKC !== undefined) meta.FC_NFKC_HEX = convertToHex(meta.FC_NFKC) as string[] | string;
    if (meta.NFKC_CF !== undefined) meta.NFKC_CF_HEX = convertToHex(meta.NFKC_CF) as string[];
    if (meta.scf !== undefined) meta.scf_HEX = convertToHex(meta.scf) as string[] | string;
    
}