import { DOMParser } from '@xmldom/xmldom';

export default {
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const mode = url.searchParams.get('mode') || 'popdeals';
        
        const feedUrl = `https://slickdeals.net/newsearch.php?mode=${mode}&searcharea=deals&searchin=first&rss=1`;
        const response = await fetch(feedUrl);
        const text = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/xml");
        const items = doc.getElementsByTagName("item");
        
        const result = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const title = item.getElementsByTagName("title")[0]?.textContent || "";
            
            // Use getElementsByTagNameNS for content:encoded if possible, otherwise fallback to tag name search
            let contentEncoded = "";
            const contentEncodedNode = item.getElementsByTagNameNS("http://purl.org/rss/1.0/modules/content/", "encoded")[0] 
                                    || item.getElementsByTagName("content:encoded")[0];
            if (contentEncodedNode) {
                contentEncoded = contentEncodedNode.textContent || "";
            }
            
            // Parse content for image and thumbScore
            const imgMatch = contentEncoded.match(/<img src="([^"]+)"/);
            const image = imgMatch ? imgMatch[1] : "";
            
            const scoreMatch = contentEncoded.match(/Thumb Score:\s*([+-]?\d+)/);
            const thumbScore = scoreMatch ? scoreMatch[1] : undefined;
            
            // Remove image tags and thumb score from HTML content
            let cleanedHtml = contentEncoded.replace(/<img[^>]*>/gi, "");
            cleanedHtml = cleanedHtml.replace(/Thumb Score:\s*[+-]?\d+/gi, "");
            
            // Parse title
            const { name, price, note } = parseTitle(title);
            
            // Content text (strip tags)
            const contentText = cleanedHtml.replace(/<[^>]+>/g, "").trim();
            
            result.push({
                name,
                price: price || undefined,
                note: note || undefined,
                image,
                thumbScore,
                content: {
                    html: cleanedHtml,
                    text: contentText
                }
            });
        }
        
        return new Response(JSON.stringify(result), {
            headers: { "content-type": "application/json" }
        });
    }
}

export function parseTitle(title: string) {
    let name = title;
    let price = "";
    let note = "";

    let remainingText = title;
    
    // Step 1: Extract ONLY specific trailing notes (shipping, deals)
    // DO NOT extract parentheticals or w/ patterns - those are part of the product name!
    const trailingNotePatterns = [
        // Free shipping variants
        /\s+\+\s+Free\s+(?:Shipping|S\/H|S&H|Store\s+Pickup)(?:\s+(?:w\/|on)(?:\s+Prime\s+or\s+on)?\s+[^$+&]+)?$/i,
        // & More (sometimes with shipping)
        /\s+&\s+More(?:\s+\+\s+Free\s+[^$]+)?$/i,
        // Subscribe & Save
        /\s+w\/\s+Subscribe\s+&\s+Save$/i,
        // Other specific deal terms that are NOTES not product features
        /\s+w\/\s+\d+-Yr\s+[\w\s]+(?:Care\+?)?$/i, // w/ 2-Yr Samsung Care+
        /\s+w\/\s+Amazon\s+Prime$/i,
        /\s+w\/\s+Text\s+Signup$/i,
        // Shipping costs (not free)
        /\s+\+\s+\$[\d.]+\s+Shipping$/i,
        // Shipping thresholds
        /\s+\+\s+Free\s+S\/H\s+(?:Orders|on)\s+\$[\d+]+$/i,
    ];
    
    // Apply trailing note patterns repeatedly to extract all
    let changed = true;
    while (changed) {
        changed = false;
        for (const pattern of trailingNotePatterns) {
            const match = remainingText.match(pattern);
            if (match) {
                const extractedNote = match[0].trim();
                note = note ? `${extractedNote} ${note}` : extractedNote;
                remainingText = remainingText.slice(0, match.index).trim();
                changed = true;
                break;
            }
        }
    }
    
    // Step 2: Find the price position (but don't extract yet)
    const pricePatterns = [
        // Multi-item bundle prices "X for $Y"
        /\s+(\d+\s+(?:Pack|Packs)\s+for\s+\$[\d,]+)$/i,
        /\s+(\d+\s+for\s+\$[\d,]+)$/i,
        // Complex monthly prices
        /\s+(from\s+\$[\d,]+(?:\.\d{2})?\/mos\s+for\s+\d+\s+mos)$/i,
        // "$X + extras" (price with additional info like cash back)
        /\s+(\$[\d,]+(?:\.\d{2})?\s+\+\s+\d+%\s+[^$&+()\s]+(?:\s+[^$&+()\s]+)*)$/i,
        // "$X per Month", "$X/month", "$X/yr"
        /\s+(\$\d+(?:\.\d{2})?\s+per\s+\w+)$/i,
        /\s+(\$[\d,]+(?:\.\d{2})?\/(?:month|yr|mos))$/i,
        // "$X Each"
        /\s+(\$[\d,]+(?:\.\d{2})?\s+Each)$/i,
        // "from $X each"
        /\s+(from\s+\$[\d,]+(?:\.\d{2})?\s+each)$/i,
        // "$X or Less"
        /\s+(\$[\d,]+(?:\.\d{2})?\s+or\s+(?:Less|less))$/i,
        // "from $X" (must come after "from $X each")
        /\s+(from\s+\$[\d,]+(?:\.\d{2})?)$/i,
        // "$X Off", "$X Statement Credit"
        /\s+(\$\d+\s+(?:Off|Statement\s+Credit))$/i,
        // "Up to X% Off", "X% Off"
        /\s+((?:[Uu]p\s+to\s+)?(?:\$[\d,]+(?:\.\d{2})?|\d+%)\s+Off(?:\s+[^$()\s]+(?:\s+[^$()\s]+)*)?)$/i,
        /\s+(\d+%\s+Off(?:\s+[^$()\s]+(?:\s+[^$()\s]+)*)?)$/i,
        // "X% Cash Back"
        /\s+(\d+%\s+Cash\s+Back)$/i,
        // Special phrases "$X in Walmart Cash", "Get $X..."
        /\s+(\$\d+\s+in\s+[^$&()+]+)$/i,
        /\s+(Get\s+\$\d+\s+[^$&()+]+)$/i,
        // Basic "$X" - MUST come after all more complex patterns
        /\s+(\$[\d,]+(?:\.\d{2})?)$/,
        // Special case patterns that look like prices
        /\s+(\(See\s+Official\s+Rules\))$/i,
        // "Free"
        /\s+(Free(?:\s+to\s+Claim)?)$/i,
    ];
    
    let priceStartIndex = -1;
    let priceMatch: RegExpMatchArray | null = null;
    
    for (const pattern of pricePatterns) {
        priceMatch = remainingText.match(pattern);
        if (priceMatch && priceMatch.index !== undefined) {
            priceStartIndex = priceMatch.index;
            price = priceMatch[1].trim();
            break;
        }
    }
    
    // Step 3: Extract post-price content (parenthetical notes, restrictions after the price)
    if (priceStartIndex >= 0) {
        // Extract the text before price position - this becomes the product name
        const beforePrice = remainingText.slice(0, priceStartIndex).trim();
        // Extract text after price position - these could be notes/restrictions
        const afterPriceText = remainingText.slice(priceStartIndex + (priceMatch?.[0].length || 0)).trim();
        
        // Extract post-price notes from the middle zone (between price and trailing notes)
        // These are typically parentheticals or restrictions
        const postPriceNotePatterns = [
            /^(\([^)]+\))/,  // Parenthetical at start (after price was removed)
            /^(In-Store\s+(?:Only|Pick\s+Up\s+Only))/i,
            /^(Digital\s+Delivery)/i,
            /^(Valid\s+[^$+&]+)/i,
        ];
        
        let postPriceNote = "";
        for (const pattern of postPriceNotePatterns) {
            const match = afterPriceText.match(pattern);
            if (match) {
                postPriceNote = match[1].trim();
                break;
            }
        }
        
        if (postPriceNote) {
            note = note ? `${postPriceNote} ${note}` : postPriceNote;
        }
        
        remainingText = beforePrice;
    }
    
    // Step 4: Everything remaining is the product name
    name = remainingText || title;

    return {
        name,
        price,
        note,
    };
}