import { GCB_LABELS, SB_LABELS, WB_LABELS, BC_LABELS, BPT_LABELS, DT_LABELS, EA_LABELS, GC_LABELS, HST_LABELS, JT_LABELS, NT_LABELS, LB_LABELS, LB_DESCRIPTIONS, CCC_LABELS, CCC_DESCRIPTIONS, SCRIPT_LABELS } from "./consts";

export interface CodepointMeta {
  /** Code point number in decimal */
  cp: number;
  /** Code point number in hexadecimal (uppercase, without leading "U+") */
  cp_HEX: string;
  /** Age - When the code point was designated/assigned in successive versions of the Unicode Standard */
  age: string;
  /** Name - The official Unicode character name */
  na: string;
  /** Unicode 1 Name - Old name as published in Unicode 1.0 (only when significantly different) */
  na1: string;
  /** General Category - Character type classification (Lu, Ll, Lt, Lm, Lo, Mn, Mc, etc.) */
  gc: keyof typeof GC_LABELS;
  /** Human-friendly name for the General Category property */
  gc_NAME: typeof GC_LABELS[keyof typeof GC_LABELS];
  /** Canonical Combining Class - Classes used for the Canonical Ordering Algorithm */
  ccc: string;
  /** Human-friendly name for the Canonical Combining Class property */
  ccc_NAME: string;
  /** Human-friendly description for the Canonical Combining Class property */
  ccc_DESCRIPTION: string;
  /** Bidi Class - Categories required by the Unicode Bidirectional Algorithm */
  bc: keyof typeof BC_LABELS;
  /** Human-friendly name for the Bidi Class property */
  bc_NAME: typeof BC_LABELS[keyof typeof BC_LABELS];
  /** Bidi Mirrored - Whether the character is "mirrored" in bidirectional text */
  Bidi_M: boolean;
  /** Bidi Control - Format control characters with specific functions in the Unicode Bidirectional Algorithm */
  Bidi_C: boolean;
  /** Decomposition Type - Type of character decomposition (canonical, compatibility, etc.) */
  dt: keyof typeof DT_LABELS;
  /** Human-friendly name for the Decomposition Type property */
  dt_NAME: typeof DT_LABELS[keyof typeof DT_LABELS];
  /** Composition Exclusion - Characters excluded from composition in normalization */
  CE: boolean;
  /** Full Composition Exclusion - Characters excluded from composition including derivable sets */
  Comp_Ex: boolean;
  /** NFC Quick Check - Quick check property for NFC normalization */
  NFC_QC: string;
  /** NFD Quick Check - Quick check property for NFD normalization */
  NFD_QC: string;
  /** NFKC Quick Check - Quick check property for NFKC normalization */
  NFKC_QC: string;
  /** NFKD Quick Check - Quick check property for NFKD normalization */
  NFKD_QC: string;
  /** Expands On NFC (deprecated) - Characters that expand to more than one character in NFC */
  XO_NFC: boolean;
  /** Expands On NFD (deprecated) - Characters that expand to more than one character in NFD */
  XO_NFD: boolean;
  /** Expands On NFKC (deprecated) - Characters that expand to more than one character in NFKC */
  XO_NFKC: boolean;
  /** Expands On NFKD (deprecated) - Characters that expand to more than one character in NFKD */
  XO_NFKD: boolean;
  /** Numeric Type - Type of numeric character (None, Decimal, Digit, Numeric) */
  nt: keyof typeof NT_LABELS;
  /** Human-friendly name for the Numeric Type property */
  nt_NAME: typeof NT_LABELS[keyof typeof NT_LABELS];
  /** Numeric Value - The numeric value of the character if it represents a number */
  nv?: number | string | null;
  /** Joining Type - Basic Arabic and Syriac character shaping properties */
  jt: keyof typeof JT_LABELS;
  /** Human-friendly name for the Joining Type property */
  jt_NAME: typeof JT_LABELS[keyof typeof JT_LABELS];
  /** Joining Group - Arabic and Syriac joining group classification */
  jg: string;
  /** Join Control - Format control characters for cursive joining and ligation */
  Join_C: boolean;
  /** Line Break - Properties for line breaking algorithm */
  lb: keyof typeof LB_LABELS;
  /** Human-friendly name for the Line Break property */
  lb_NAME: typeof LB_LABELS[keyof typeof LB_LABELS];
  /** Human-friendly description for the Line Break property */
  lb_DESCRIPTION: typeof LB_DESCRIPTIONS[keyof typeof LB_DESCRIPTIONS];
  /** East Asian Width - Width properties for East Asian typography (F, H, W, Na, A, N) */
  ea: keyof typeof EA_LABELS;
  /** Human-friendly name for the East Asian Width property */
  ea_NAME: typeof EA_LABELS[keyof typeof EA_LABELS];
  /** Uppercase - Characters with the Uppercase property */
  Upper: boolean;
  /** Lowercase - Characters with the Lowercase property */
  Lower: boolean;
  /** Other Uppercase - Used in deriving the Uppercase property */
  OUpper: boolean;
  /** Other Lowercase - Used in deriving the Lowercase property */
  OLower: boolean;
  /** Case Ignorable - Characters ignored for casing purposes */
  CI: boolean;
  /** Cased - Characters considered to be uppercase, lowercase or titlecase */
  Cased: boolean;
  /** Changes When Casefolded - Characters whose normalized forms are not stable under case folding */
  CWCF: boolean;
  /** Changes When Casemapped - Characters which may change when they undergo case mapping */
  CWCM: boolean;
  /** Changes When Lowercased - Characters whose normalized forms are not stable under toLowercase */
  CWL: boolean;
  /** Changes When NFKC Casefolded - Characters not identical to their NFKC_Casefold mapping */
  CWKCF: boolean;
  /** Changes When Titlecased - Characters whose normalized forms are not stable under toTitlecase */
  CWT: boolean;
  /** Changes When Uppercased - Characters whose normalized forms are not stable under toUppercase */
  CWU: boolean;
  /** ISO Comment (deprecated) - ISO 10646 comment field (no longer contains non-null values) */
  isc: string;
  /** Hangul Syllable Type - Values L, V, T, LV, and LVT for Hangul processing */
  hst: keyof typeof HST_LABELS;
  /** Human-friendly name for the Hangul Syllable Type property */
  hst_NAME: typeof HST_LABELS[keyof typeof HST_LABELS];
  /** Jamo Short Name - Short names for Hangul Jamo, used in syllable name derivation */
  JSN: string;
  /** Indic Syllabic Category - Structural categories of syllabic components in Indic scripts */
  InSC: string;
  /** Indic Matra Category - Categories for Indic vowel signs and related marks */
  InMC: string | null;
  /** Indic Positional Category - Placement categories for dependent vowels and marks in Indic scripts */
  InPC: string;
  /** ID Start - Characters that can start programming identifiers */
  IDS: boolean;
  /** Other ID Start - Used to maintain backward compatibility of ID Start */
  OIDS: boolean;
  /** XID Start - Extended characters that can start identifiers */
  XIDS: boolean;
  /** ID Continue - Characters that can continue programming identifiers */
  IDC: boolean;
  /** Other ID Continue - Used to maintain backward compatibility of ID Continue */
  OIDC: boolean;
  /** XID Continue - Extended characters that can continue identifiers */
  XIDC: boolean;
  /** Pattern Syntax - Characters used for pattern syntax */
  Pat_Syn: boolean;
  /** Pattern White Space - Characters used as white space in patterns */
  Pat_WS: boolean;
  /** Dash - Punctuation characters explicitly called out as dashes */
  Dash: boolean;
  /** Hyphen (deprecated) - Dashes used to mark connections between word pieces */
  Hyphen: boolean;
  /** Quotation Mark - Punctuation characters that function as quotation marks */
  QMark: boolean;
  /** Terminal Punctuation - Punctuation characters that generally mark the end of textual units */
  Term: boolean;
  /** STerm - Sentence Terminal, used in text segmentation */
  STerm: boolean;
  /** Diacritic - Characters that linguistically modify the meaning of another character */
  Dia: boolean;
  /** Extender - Characters whose principal function is to extend preceding alphabetic characters */
  Ext: boolean;
  /** Soft Dotted - Characters with a "soft dot" that disappears when accents are added */
  SD: boolean;
  /** Alphabetic - Characters with the Alphabetic property */
  Alpha: boolean;
  /** Other Alphabetic - Used in deriving the Alphabetic property */
  OAlpha: boolean;
  /** Math - Characters with the Math property */
  Math: boolean;
  /** Other Math - Used in deriving the Math property */
  OMath: boolean;
  /** Hex Digit - Characters commonly used for hexadecimal number representation */
  Hex: boolean;
  /** ASCII Hex Digit - ASCII characters commonly used for hexadecimal numbers */
  AHex: boolean;
  /** Default Ignorable Code Point - Characters that should be ignored in rendering unless explicitly supported */
  DI: boolean;
  /** Other Default Ignorable Code Point - Used in deriving the Default_Ignorable_Code_Point property */
  ODI: boolean;
  /** Logical Order Exception - Southeast Asian spacing vowel letters that use visual order display */
  LOE: boolean;
  /** White Space - Characters treated as white space for parsing */
  WSpace: boolean;
  /** Grapheme Base - Property used in grapheme base definition */
  Gr_Base: boolean;
  /** Grapheme Extend - Property used to define grapheme extender */
  Gr_Ext: boolean;
  /** Other Grapheme Extend - Used in deriving the Grapheme_Extend property */
  OGr_Ext: boolean;
  /** Grapheme Link (deprecated) - Formerly used for grapheme cluster boundaries */
  Gr_Link: boolean;
  /** Grapheme Cluster Break - Property for grapheme cluster boundary determination */
  GCB: keyof typeof GCB_LABELS;
  /** Human-friendly name for the Grapheme Cluster Break property */
  GCB_NAME: typeof GCB_LABELS[keyof typeof GCB_LABELS];
  /** Word Break - Property for word boundary determination */
  WB: keyof typeof WB_LABELS;
  /** Human-friendly name for the Word Break property */
  WB_NAME: typeof WB_LABELS[keyof typeof WB_LABELS];
  /** Sentence Break - Property for sentence boundary determination */
  SB: keyof typeof SB_LABELS;
  /** Human-friendly name for the Sentence Break property */
  SB_NAME: typeof SB_LABELS[keyof typeof SB_LABELS];
  /** Ideographic - CJKV ideographs ("Chinese characters") */
  Ideo: boolean;
  /** Unified Ideograph - Exact set of Unified CJK Ideographs */
  UIdeo: boolean;
  /** IDS Binary Operator - Used in Ideographic Description Sequences */
  IDSB: boolean;
  /** IDS Trinary Operator - Used in Ideographic Description Sequences */
  IDST: boolean;
  /** Radical - Used in Ideographic Description Sequences */
  Radical: boolean;
  /** Deprecated - Characters whose usage is strongly discouraged */
  Dep: boolean;
  /** Variation Selector - Characters that are Variation Selectors */
  VS: boolean;
  /** Noncharacter Code Point - Code points permanently reserved for internal use */
  NChar: boolean;
  /** kAccountingNumeric - Value when used in accounting numerals (fraud prevention) */
  kAccountingNumeric: string | null;
  /** kAlternateHanYu - Alternate position in Han Yu Da Zi Dian */
  kAlternateHanYu: string | null;
  /** kAlternateJEF - Alternate JEF code */
  kAlternateJEF: string | null;
  /** kAlternateKangXi - Alternate position in Kang Xi Dictionary */
  kAlternateKangXi: string | null;
  /** kAlternateMorohashi - Alternate index in Morohashi dictionary */
  kAlternateMorohashi: string | null;
  /** kBigFive - Big Five encoding mapping */
  kBigFive: string | null;
  /** kCCCII - CCCII encoding mapping */
  kCCCII: string | null;
  /** kCNS1986 - CNS 11643-1986 encoding mapping */
  kCNS1986: string | null;
  /** kCNS1992 - CNS 11643-1992 encoding mapping */
  kCNS1992: string | null;
  /** kCangjie - Cangjie input method code */
  kCangjie: string | null;
  /** kCantonese - Cantonese pronunciation using jyutping romanization */
  kCantonese: string | null;
  /** kCheungBauer - Data from Cheung & Bauer Cantonese dictionary */
  kCheungBauer: string | null;
  /** kCheungBauerIndex - Position in Cheung & Bauer dictionary */
  kCheungBauerIndex: string | null;
  /** kCihaiT - Position in Cihai dictionary */
  kCihaiT: string | null;
  /** kCompatibilityVariant - Compatibility decomposition for this ideograph */
  kCompatibilityVariant: string | null;
  /** kCowles - Index in Cowles Cantonese dictionary */
  kCowles: string | null;
  /** kDaeJaweon - Position in Dae Jaweon (Korean) dictionary */
  kDaeJaweon: string | null;
  /** kDefinition - English definition for the character */
  kDefinition: string | null;
  /** kEACC - EACC encoding mapping */
  kEACC: string | null;
  /** kFenn - Data from Fenn's Chinese-English dictionary */
  kFenn: string | null;
  /** kFennIndex - Position in Fenn's dictionary */
  kFennIndex: string | null;
  /** kFourCornerCode - Four-corner input method code(s) */
  kFourCornerCode: string | null;
  /** kFrequency - Rough frequency measurement (1=most common, 5=least common) */
  kFrequency: string | null;
  /** kGB0 - GB 2312-80 encoding mapping */
  kGB0: string | null;
  /** kGB1 - GB 12345-90 encoding mapping */
  kGB1: string | null;
  /** kGB3 - GB 7589-87 encoding mapping */
  kGB3: string | null;
  /** kGB5 - GB 7590-87 encoding mapping */
  kGB5: string | null;
  /** kGB7 - GB 8565-89 encoding mapping */
  kGB7: string | null;
  /** kGB8 - GB 8565-89 encoding mapping */
  kGB8: string | null;
  /** kGradeLevel - Primary grade level in Hong Kong school system */
  kGradeLevel: string | null;
  /** kGSR - Position in Karlgren's Grammata Serica Recensa */
  kGSR: string | null;
  /** kHangul - Modern Korean pronunciation in Hangul */
  kHangul: string | null;
  /** kHanYu - Position in Hanyu Da Zidian dictionary */
  kHanYu: string | null;
  /** kHanyuPinlu - Pronunciations and frequencies from Modern Chinese Frequency Dictionary */
  kHanyuPinlu: string | null;
  /** kHanyuPinyin - Hanyu Pinyin readings from Hanyu Da Zidian */
  kHanyuPinyin: string | null;
  /** kHDZRadBreak - Hanyu Da Zidian radical break indicator */
  kHDZRadBreak: string | null;
  /** kHKGlyph - Index in Hong Kong standard character shapes */
  kHKGlyph: string | null;
  /** kHKSCS - Hong Kong Supplementary Character Set mapping */
  kHKSCS: string | null;
  /** kIBMJapan - IBM Japanese encoding mapping */
  kIBMJapan: string | null;
  /** kIICore - Indicates character is in IICore minimal ideograph set */
  kIICore: string | null;
  /** kIRGDaeJaweon - Official IRG position in Dae Jaweon dictionary */
  kIRGDaeJaweon: string | null;
  /** kIRGDaiKanwaZiten - Official IRG position in Dai Kanwa Ziten */
  kIRGDaiKanwaZiten: string | null;
  /** kIRGHanyuDaZidian - Official IRG position in Hanyu Da Zidian */
  kIRGHanyuDaZidian: string | null;
  /** kIRGKangXi - Official IRG position in Kang Xi Dictionary */
  kIRGKangXi: string | null;
  /** kIRG_GSource - IRG "G" source mapping (PRC and Singapore standards) */
  kIRG_GSource: string | null;
  /** kIRG_HSource - IRG "H" source mapping (Hong Kong Supplementary Character Set) */
  kIRG_HSource: string | null;
  /** kIRG_JSource - IRG "J" source mapping (Japanese standards) */
  kIRG_JSource: string | null;
  /** kIRG_KPSource - IRG "KP" source mapping (North Korea standards) */
  kIRG_KPSource: string | null;
  /** kIRG_KSource - IRG "K" source mapping (South Korea standards) */
  kIRG_KSource: string | null;
  /** kIRG_MSource - IRG "M" source mapping (Macao Character Set) */
  kIRG_MSource: string | null;
  /** kIRG_TSource - IRG "T" source mapping (Taiwan standards) */
  kIRG_TSource: string | null;
  /** kIRG_USource - IRG "U" source mapping (Unicode-specific ideographs) */
  kIRG_USource: string | null;
  /** kIRG_VSource - IRG "V" source mapping (Vietnam standards) */
  kIRG_VSource: string | null;
  /** kJHJ - Position in Japanese dictionary */
  kJHJ: string | null;
  /** kJIS0213 - JIS X 0213-2000 encoding mapping */
  kJIS0213: string | null;
  /** kJa - Japanese reading */
  kJa: string | null;
  /** kJapaneseKun - Japanese kun (native) pronunciation */
  kJapaneseKun: string | null;
  /** kJapaneseOn - Sino-Japanese on pronunciation */
  kJapaneseOn: string | null;
  /** kJis0 - JIS X 0208-1990 encoding mapping */
  kJis0: string | null;
  /** kJis1 - JIS X 0212-1990 encoding mapping */
  kJis1: string | null;
  /** kKPS0 - KPS 9566-97 encoding mapping */
  kKPS0: string | null;
  /** kKPS1 - KPS 10721-2000 encoding mapping */
  kKPS1: string | null;
  /** kKSC0 - KS X 1001:1992 encoding mapping */
  kKSC0: string | null;
  /** kKSC1 - KS X 1002:1991 encoding mapping */
  kKSC1: string | null;
  /** kKangXi - Position in Kang Xi Dictionary */
  kKangXi: string | null;
  /** kKarlgren - Index in Karlgren's Analytic Dictionary */
  kKarlgren: string | null;
  /** kKorean - Korean pronunciation using Yale romanization */
  kKorean: string | null;
  /** kLau - Index in Lau's Cantonese-English Dictionary */
  kLau: string | null;
  /** kMainlandTelegraph - PRC telegraph code */
  kMainlandTelegraph: string | null;
  /** kMandarin - Most customary pinyin reading */
  kMandarin: string | null;
  /** kMatthews - Index in Mathews' Chinese-English Dictionary */
  kMatthews: string | null;
  /** kMeyerWempe - Index in Meyer-Wempe Cantonese dictionary */
  kMeyerWempe: string | null;
  /** kMorohashi - Index in Morohashi dictionary (Dai Kanwa Ziten) */
  kMorohashi: string | null;
  /** kNelson - Index in Nelson's Japanese-English Character Dictionary */
  kNelson: string | null;
  /** kOtherNumeric - Numeric value in specialized contexts */
  kOtherNumeric: string | null;
  /** kPhonetic - Phonetic index from Casey's Ten Thousand Characters */
  kPhonetic: string | null;
  /** kPrimaryNumeric - Value when used in standard number writing */
  kPrimaryNumeric: string | null;
  /** kPseudoGB1 - Pseudo-GB1 code for non-standard characters */
  kPseudoGB1: string | null;
  /** kRSAdobe_Japan1_6 - Adobe-Japan1-6 glyph information with radical-stroke data */
  kRSAdobe_Japan1_6: string | null;
  /** kRSJapanese - Japanese radical/stroke count */
  kRSJapanese: string | null;
  /** kRSKanWa - Morohashi radical/stroke count */
  kRSKanWa: string | null;
  /** kRSKangXi - KangXi radical/stroke count */
  kRSKangXi: string | null;
  /** kRSKorean - Korean radical/stroke count */
  kRSKorean: string | null;
  /** kRSMerged - Merged radical/stroke information */
  kRSMerged: string | null;
  /** kRSUnicode - Standard Unicode radical/stroke count */
  kRSUnicode: string | null;
  /** kSBGY - Position in Song Ben Guang Yun medieval dictionary */
  kSBGY: string | null;
  /** kSemanticVariant - Unicode values for semantic variants */
  kSemanticVariant: string | null;
  /** kSimplifiedVariant - Unicode values for simplified Chinese variants */
  kSimplifiedVariant: string | null;
  /** kSpecializedSemanticVariant - Unicode values for context-specific semantic variants */
  kSpecializedSemanticVariant: string | null;
  /** kTaiwanTelegraph - Taiwanese telegraph code */
  kTaiwanTelegraph: string | null;
  /** kTang - Tang dynasty pronunciation */
  kTang: string | null;
  /** kTotalStrokes - Total stroke count including radical */
  kTotalStrokes: string | null;
  /** kTraditionalVariant - Unicode values for traditional Chinese variants */
  kTraditionalVariant: string | null;
  /** kVietnamese - Vietnamese pronunciation in Quốc ngữ */
  kVietnamese: string | null;
  /** kXHC1983 - Pinyin readings from Xiandai Hanyu Cidian */
  kXHC1983: string | null;
  /** kWubi - Wubi input method code */
  kWubi: string | null;
  /** kXerox - Xerox encoding code */
  kXerox: string | null;
  /** kZVariant - Unicode values for z-variants */
  kZVariant: string | null;
  /** Block - Unicode block name (arbitrary ranges of code points) */
  blk: string;
  /** Script Extensions - Extended script classifications for regex and processing */
  scx: string[] | null;
  /** Human-friendly names for the Script Extensions property (space-separated) */
  scx_NAME: string[] | null;
  /** Bidi Paired Bracket Type - Paired bracket behavior for bidirectional text */
  bpt: keyof typeof BPT_LABELS;
  /** Human-friendly name for the Bidi Paired Bracket Type property */
  bpt_NAME: typeof BPT_LABELS[keyof typeof BPT_LABELS];
  /** Image - URL or reference to character image */
  image: string | null;
  /** Script - Script classification for the character */
  sc: keyof typeof SCRIPT_LABELS;
  /** Human-friendly name for the Script property */
  sc_NAME: typeof SCRIPT_LABELS[keyof typeof SCRIPT_LABELS];
  /** Abstract - Brief description or abstract about the character */
  abstract: string | null;
  /** Case Folding - Full case folding mapping (array of code points) */
  cf: number[] | number;
  /** Case Folding - hexadecimal representation */
  cf_HEX: string[] | string;
  /** NFKC Casefold - Mapping for caseless identifier matching */
  NFKC_CF: number[];
  /** NFKC Casefold - hexadecimal representation */
  NFKC_CF_HEX: string[];
  /** Lowercase Mapping - Full lowercase mapping (array of code points) */
  lc: number[] | number;
  /** Lowercase Mapping - hexadecimal representation */
  lc_HEX: string[] | string;
  /** FC NFKC Closure (deprecated) - Extra mappings for case folding plus NFKC closure */
  FC_NFKC: number[] | number;
  /** FC NFKC Closure - hexadecimal representation */
  FC_NFKC_HEX: string[] | string;
  /** Simple Lowercase Mapping - Simple lowercase mapping (single character result) */
  slc: number[] | number;
  /** Simple Lowercase Mapping - hexadecimal representation */
  slc_HEX: string[] | string;
  /** Bidi Paired Bracket - Code point of the paired bracket */
  bpb: number[] | number;
  /** Uppercase Mapping - Full uppercase mapping (array of code points) */
  uc: number[] | number;
  /** Uppercase Mapping - hexadecimal representation */
  uc_HEX: string[] | string;
  /** Titlecase Mapping - Full titlecase mapping (array of code points) */
  tc: number[] | number;
  /** Titlecase Mapping - hexadecimal representation */
  tc_HEX: string[] | string;
  /** Simple Uppercase Mapping - Simple uppercase mapping (single character result) */
  suc: number[] | number;
  /** Simple Uppercase Mapping - hexadecimal representation */
  suc_HEX: string[] | string;
  /** Simple Titlecase Mapping - Simple titlecase mapping (single character result) */
  stc: number[] | number;
  /** Simple Titlecase Mapping - hexadecimal representation */
  stc_HEX: string[] | string;
  /** Simple Case Folding - Simple case folding mapping (single character result) */
  scf: number[] | number;
  /** Simple Case Folding - hexadecimal representation */
  scf_HEX: string[] | string;
  /** Decomposition Mapping - Character decomposition mapping (array of code points) */
  dm: number[] | number;
  /** Decomposition Mapping - hexadecimal representation */
  dm_HEX: string[] | string;
  /** Extended metadata with description, image, and Wikipedia information */
  _?: {
    /** Human-readable description of the character */
    description: string;
    /** Image representation of the character */
    image: string;
    /** Source of the character image */
    imagesource: string;
    /** Wikipedia information about the character */
    wikipedia: {
      /** Wikipedia article abstract */
      abstract: string;
      /** Language of the Wikipedia article */
      lang: string;
      /** URL to the Wikipedia article */
      src: string;
    } | null;
  };
}

export interface SVGInfo {
  svg: string;
  font: string | null;
}

export interface Description {
  title: string;
  html: string;
}

export interface RandomCodepointResponse<TMeta = CodepointMeta> {
  hex: string;
  codepoint: string;
  char: string;
  meta: TMeta;
  svgs: SVGInfo[];
  descriptions?: Description[];
}
