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

export async function fetchAndParseTextproto(path: string): Promise<Record<string, any> | null> {
    // Check cache first
    if (textprotoCache.has(path)) {
        return textprotoCache.get(path)!;
    }
    
    try {
        const url = `https://raw.githubusercontent.com/google/fonts/main/${path}`;
        const response = await fetch(url);
        
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

export async function getSampleText(metadata: Record<string, any>): Promise<string | undefined> {
    // If sample_text already exists, return it
    if (metadata.sample_text) {
        return metadata.sample_text;
    }
    
    // Try primary_language
    if (metadata.primary_language) {
        const langData = await fetchAndParseTextproto(`lang/Lib/gflanguages/data/languages/${metadata.primary_language}.textproto`);
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
                const response = await fetch('https://api.github.com/repos/google/fonts/contents/lang/Lib/gflanguages/data/languages', {
                    headers: {
                        'User-Agent': 'trmnl-workers',
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    languageDirectoryCache = await response.json();
                }
            }
            
            if (languageDirectoryCache) {
                const pattern = new RegExp(`^\\w+_${metadata.primary_script}\\.textproto$`);
                
                // Find all matching files
                const matchingFiles = languageDirectoryCache.filter(file => pattern.test(file.name));
                
                // Try each matching file until we find one with sample_text
                for (const file of matchingFiles) {
                    const langData = await fetchAndParseTextproto(`lang/Lib/gflanguages/data/languages/${file.name}`);
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
    const fallbackData = await fetchAndParseTextproto('lang/Lib/gflanguages/data/languages/en_Latn.textproto');
    metadata.primary_language = 'en_Latn';
    return fallbackData?.sample_text;
}

export async function fetchGitHubContents(url: string): Promise<GitHubContent[]> {
    // Check cache first
    if (githubContentsCache.has(url)) {
        return githubContentsCache.get(url)!;
    }
    
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'trmnl-workers',
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
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
