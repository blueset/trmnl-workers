import { parseProtobufText } from './protobuf-parser';

export interface GitHubContent {
    name: string;
    path: string;
    type: string;
    download_url?: string;
}

export interface MetadataInfo {
    name: string;
    path: string;
    metadata: Record<string, any>;
    css: string;
}

export function getGitHubHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
        'User-Agent': 'trmnl-workers',
        'Accept': 'application/vnd.github.v3+json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

export async function fetchAndParseTextproto(path: string, githubToken?: string): Promise<Record<string, any> | null> {
    // Check cache first
    if (textprotoCache.has(path)) {
        return textprotoCache.get(path)!;
    }
    
    try {
        const url = `https://raw.githubusercontent.com/google/fonts/main/${path}`;
        const response = await fetch(url, {
            headers: githubToken ? { 'Authorization': `Bearer ${githubToken}` } : {}
        });
        
        if (!response.ok) {
            textprotoCache.set(path, null);
            return null;
        }
        
        const content = await response.text();
        const parsed = parseProtobufText(content);
        textprotoCache.set(path, parsed);
        return parsed;
    } catch (error) {
        textprotoCache.set(path, null);
        return null;
    }
}

export async function getSampleText(metadata: Record<string, any>, githubToken?: string): Promise<string | undefined> {
    // If sample_text already exists, return it
    if (metadata.sample_text) {
        return metadata.sample_text;
    }
    
    // Try primary_language
    if (metadata.primary_language) {
        const langData = await fetchAndParseTextproto(`lang/Lib/gflanguages/data/languages/${metadata.primary_language}.textproto`, githubToken);
        if (langData?.sample_text) {
            return langData.sample_text;
        }
    }
    
    // Try primary_script
    if (metadata.primary_script) {
        try {
            // Fetch the languages directory to find matching files
            // Use cached directory listing
            if (!languageDirectoryCache) {
                // Step 1: Get the root tree object ID
                const repoResponse = await fetch('https://api.github.com/repos/google/fonts', {
                    headers: getGitHubHeaders(githubToken)
                });
                
                if (repoResponse.ok) {
                    const repoData: any = await repoResponse.json();
                    const defaultBranch = repoData.default_branch || 'main';
                    
                    // Get the commit to find the tree SHA
                    const commitResponse = await fetch(`https://api.github.com/repos/google/fonts/commits/${defaultBranch}`, {
                        headers: getGitHubHeaders(githubToken)
                    });
                    
                    if (commitResponse.ok) {
                        const commitData: any = await commitResponse.json();
                        const treeSha = commitData.commit.tree.sha;
                        
                        // Step 2: Get file list using tree API
                        const treeResponse = await fetch(`https://api.github.com/repos/google/fonts/git/trees/${treeSha}?recursive=1`, {
                            headers: getGitHubHeaders(githubToken)
                        });
                        
                        if (treeResponse.ok) {
                            const treeData: any = await treeResponse.json();
                            // Filter for files in the languages directory
                            const languageFiles = treeData.tree
                                .filter((item: any) => 
                                    item.path.startsWith('lang/Lib/gflanguages/data/languages/') &&
                                    item.path.endsWith('.textproto') &&
                                    item.type === 'blob'
                                )
                                .map((item: any) => ({
                                    name: item.path.split('/').pop(),
                                    path: item.path,
                                    type: 'file'
                                }));
                            languageDirectoryCache = languageFiles;
                        }
                    }
                }
            }
            
            if (languageDirectoryCache) {
                const pattern = new RegExp(`${metadata.primary_script}\\.textproto$`, 'ig');
                
                // Find all matching files
                const matchingFiles = languageDirectoryCache.filter(file => pattern.test(file.name));
                // console.log('Matching language files:', matchingFiles);
                // Try each matching file until we find one with sample_text
                for (const file of matchingFiles) {
                    const langData = await fetchAndParseTextproto(`lang/Lib/gflanguages/data/languages/${file.name}`, githubToken);
                    // console.log('Checked language file:', file.name, langData);
                    if (langData?.sample_text) {
                        metadata.primary_language = file.name.replace('.textproto', '');
                        return langData.sample_text;
                    }
                }
            }
        } catch (error) {
            // Continue to fallback
        }
    }
    
    // Fallback to en_Latn
    const fallbackData = await fetchAndParseTextproto('lang/Lib/gflanguages/data/languages/en_Latn.textproto', githubToken);
    metadata.primary_language = 'en_Latn';
    return fallbackData?.sample_text;
}

export async function fetchGitHubContents(url: string, githubToken?: string): Promise<GitHubContent[]> {
    // Check cache first
    if (githubContentsCache.has(url)) {
        return githubContentsCache.get(url)!;
    }
    
    const response = await fetch(url, {
        headers: getGitHubHeaders(githubToken)
    });
    
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}, ${response.statusText}, ${await response.text()}. ${Array.from(response.headers.entries()).map(([key, value]) => `${key}: ${value}`).join(', ')}`);
    }
    
    const contents: GitHubContent[] = await response.json();
    githubContentsCache.set(url, contents);
    return contents;
}

interface AxisRegistryEntry {
    tag: string;
    name: string;
    description: string;
    [key: string]: any;
}

// Cache variables
let axisRegistryCache: AxisRegistryEntry[] | null = null;
let languageDirectoryCache: GitHubContent[] | null = null;
let textprotoCache: Map<string, Record<string, any> | null> = new Map();
let githubContentsCache: Map<string, GitHubContent[]> = new Map();
let familiesCsvCache: string | null = null;

export async function getAxisRegistry(): Promise<AxisRegistryEntry[]> {
    if (axisRegistryCache) {
        return axisRegistryCache;
    }
    
    try {
        const response = await fetch('https://raw.githubusercontent.com/fontsource/google-font-metadata/refs/heads/main/data/axis-registry.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch axis registry: ${response.status}`);
        }
        axisRegistryCache = await response.json();
        return axisRegistryCache!;
    } catch (error) {
        console.error('Error fetching axis registry:', error);
        return [];
    }
}

export async function enrichAxesWithRegistry(axes: any[]): Promise<any[]> {
    if (!axes || axes.length === 0) {
        return axes;
    }
    
    const registry = await getAxisRegistry();
    
    return axes.map(axis => {
        const registryEntry = registry.find(entry => 
            axis.tag?.toLowerCase() === entry.tag?.toLowerCase()
        );
        
        if (registryEntry) {
            return { ...registryEntry, ...axis };
        }
        return axis;
    });
}

export async function getFamiliesCsv(): Promise<string> {
    if (familiesCsvCache) {
        return familiesCsvCache;
    }
    
    try {
        const response = await fetch('https://raw.githubusercontent.com/google/fonts/refs/heads/main/tags/all/families.csv');
        if (!response.ok) {
            throw new Error(`Failed to fetch families.csv: ${response.status}`);
        }
        familiesCsvCache = await response.text();
        return familiesCsvCache!;
    } catch (error) {
        console.error('Error fetching families.csv:', error);
        return '';
    }
}

export async function getFontQualities(fontName: string): Promise<Array<{type: string, quality: string, score: number}>> {
    const csv = await getFamiliesCsv();
    if (!csv) {
        return [];
    }
    
    const lines = csv.split('\n');
    const qualities: Array<{type: string, quality: string, score: number}> = [];
    
    for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) continue;
        
        // Simple CSV parsing (assuming no commas in fields)
        const cols = line.split(',');
        
        // Check if col[0] matches the font name
        if (cols[0] && cols[0].trim() === fontName) {
            // col[2] should be in format like "type/quality"
            if (cols[2] && cols[3]) {
                const pathParts = cols[2].trim().split('/');
                if (pathParts.length >= 3) {
                    qualities.push({
                        type: pathParts[1],
                        quality: pathParts[2],
                        score: parseFloat(cols[3].trim())
                    });
                }
            }
        }
    }
    
    return qualities;
}
