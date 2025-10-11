import { parseProtobufText } from './protobuf-parser';
import {
    getSampleText, 
    fetchGitHubContents,
    enrichAxesWithRegistry,
    getFontQualities,
    type GitHubContent,
    type MetadataInfo
} from './utils';

// Cache for all subfolders
let allSubfoldersCache: GitHubContent[] | null = null;

async function getRandomFontFolder(githubToken?: string): Promise<MetadataInfo> {
    // Check cache first
    if (!allSubfoldersCache) {
        const folders = [
            'https://api.github.com/repos/google/fonts/contents/apache',
            'https://api.github.com/repos/google/fonts/contents/ofl',
            'https://api.github.com/repos/google/fonts/contents/ufl'
        ];
        
        // Fetch all subfolders from all three directories
        const allSubfoldersPromises = folders.map(url => fetchGitHubContents(url, githubToken));
        const allSubfoldersResults = await Promise.all(allSubfoldersPromises);
        
        // Combine all subfolders and filter to only include directories
        allSubfoldersCache = allSubfoldersResults
            .flat()
            .filter(item => item.type === 'dir');
    }
    
    const allSubfolders = allSubfoldersCache;
    
    if (allSubfolders.length === 0) {
        throw new Error('No subfolders found');
    }
    
    // Shuffle and try to find one with METADATA.pb
    const shuffled = [...allSubfolders].sort(() => Math.random() - 0.5);
    
    for (const folder of shuffled) {
        try {
            // Check if METADATA.pb exists
            const metadataUrl = `https://api.github.com/repos/google/fonts/contents/${folder.path}/METADATA.pb`;
            const metadataResponse = await fetch(metadataUrl, {
                headers: {
                    'User-Agent': 'trmnl-workers',
                    'Accept': 'application/vnd.github.v3+json',
                    ...(githubToken ? { 'Authorization': `Bearer ${githubToken}` } : {})
                }
            });
            
            if (metadataResponse.ok) {
                const metadataFile: GitHubContent = await metadataResponse.json();
                
                // Fetch the actual content
                if (metadataFile.download_url) {
                    const contentResponse = await fetch(metadataFile.download_url, {
                        headers: githubToken ? { 'Authorization': `Bearer ${githubToken}` } : {}
                    });
                    const content = await contentResponse.text();
                    
                    // Parse the protobuf text format
                    const parsed = parseProtobufText(content);

                    // Get sample text
                    const sampleText = await getSampleText(parsed, githubToken);
                    if (sampleText) {
                        parsed.sample_text = sampleText;
                    }

                    // Enrich axes with registry data
                    if (parsed.axes?.length) {
                        parsed.axes = await enrichAxesWithRegistry(parsed.axes);
                    }

                    // Get font qualities from families.csv
                    const qualities = await getFontQualities(parsed.name);
                    if (qualities.length > 0) {
                        parsed.qualities = qualities;
                    }

                    const css = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(parsed.name)}&display=swap`;

                    return {
                        name: folder.name,
                        path: folder.path,
                        metadata: parsed,
                        css
                    };
                }
            }
        } catch (error) {
            // Continue to next folder if this one fails
            continue;
        }
    }
    
    throw new Error('No folder with METADATA.pb found');
}

export default {
    async fetch(request: Request, env: { GITHUB_TOKEN?: string }): Promise<Response> {
        try {
            const fontInfo = await getRandomFontFolder(env.GITHUB_TOKEN);
            
            return new Response(JSON.stringify(fontInfo, null, 2), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
        } catch (error) {
            return new Response(JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    },
}