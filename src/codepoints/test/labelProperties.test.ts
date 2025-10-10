import { describe, it, expect } from 'vitest';
import { labelProperties } from '../utils';
import { CodepointMeta } from '../types';

describe('labelProperties', () => {
  it('adds human-friendly labels for all Unicode properties', () => {
    const meta = {
      GCB: 'ZWJ',
      SB: 'AT',
      WB: 'HL',
      bc: 'L',
      bpt: 'o',
      dt: 'can',
      ea: 'F',
      gc: 'Lu',
      hst: 'L',
      jt: 'D',
      nt: 'De',
      lb: 'AL',
      ccc: '230',
      sc: 'Latn',
      scx: ['Latn'],
      // Add other required properties with mock values
      cp: 65,
      age: '1.1',
      na: 'LATIN CAPITAL LETTER A',
      na1: '',
      Bidi_M: false,
      Bidi_C: false,
      CE: false,
      Comp_Ex: false,
      NFC_QC: 'Y',
      NFD_QC: 'Y',
      NFKC_QC: 'Y',
      NFKD_QC: 'Y',
      XO_NFC: false,
      XO_NFD: false,
      XO_NFKC: false,
      XO_NFKD: false,
      nv: null,
      jg: 'No_Joining_Group',
      Join_C: false,
      Upper: true,
      Lower: false,
      OUpper: false,
      OLower: false,
      CI: false,
      Cased: true,
      CWCF: false,
      CWCM: false,
      CWL: false,
      CWKCF: false,
      CWT: false,
      CWU: false,
      isc: '',
      JSN: '',
      InSC: 'Other',
      InMC: null,
      InPC: 'NA',
      IDS: false,
      OIDS: false,
      XIDS: false,
      IDC: false,
      OIDC: false,
      XIDC: false,
      Pat_Syn: false,
      Pat_WS: false,
      Dash: false,
      Hyphen: false,
      QMark: false,
      Term: false,
      STerm: false,
      Dia: false,
      Ext: false,
      SD: false,
      Alpha: true,
      OAlpha: false,
      Math: false,
      OMath: false,
      Hex: false,
      AHex: false,
      DI: false,
      ODI: false,
      LOE: false,
      WSpace: false,
      Gr_Base: true,
      Gr_Ext: false,
      OGr_Ext: false,
      Gr_Link: false,
      Ideo: false,
      UIdeo: false,
      IDSB: false,
      IDST: false,
      Radical: false,
      Dep: false,
      VS: false,
      NChar: false,
    } as any as CodepointMeta;

    labelProperties(meta);

    // Check that all the expected labels are added
    expect(meta.GCB_NAME).toBe('Zero Width Joiner');
    expect(meta.SB_NAME).toBe('Alphabetic Terminal');
    expect(meta.WB_NAME).toBe('Hebrew Letter');
    expect(meta.bc_NAME).toBe('Left To Right');
    expect(meta.bpt_NAME).toBe('Open');
    expect(meta.dt_NAME).toBe('canonical');
    expect(meta.ea_NAME).toBe('fullwidth');
    expect(meta.gc_NAME).toBe('Uppercase Letter');
    expect(meta.hst_NAME).toBe('Leading Jamo');
    expect(meta.jt_NAME).toBe('Dual Joining');
    expect(meta.nt_NAME).toBe('decimal');
    expect(meta.lb_NAME).toBe('Alphabetic');
    expect(meta.lb_DESCRIPTION).toBe('Are alphabetic characters or symbols that are used with alphabetic characters');
    expect(meta.ccc_NAME).toBe('Above');
    expect(meta.ccc_DESCRIPTION).toBe('Distinct marks directly above');
    expect(meta.sc_NAME).toBe('Latin');
    expect(meta.scx_NAME).toStrictEqual(['Latin']);
  });

  it('handles unknown property values gracefully', () => {
    const meta = {
      GCB: 'UNKNOWN',
      SB: 'UNKNOWN',
      WB: 'UNKNOWN',
      bc: 'UNKNOWN',
      bpt: 'UNKNOWN',
      dt: 'UNKNOWN',
      ea: 'UNKNOWN',
      gc: 'UNKNOWN',
      hst: 'UNKNOWN',
      jt: 'UNKNOWN',
      nt: 'UNKNOWN',
      lb: 'UNKNOWN',
      ccc: '999',
      sc: 'UNKN',
      scx: ['UNKN', 'FAKE'],
    } as any as CodepointMeta;

    // Should not throw errors when unknown values are encountered
    expect(() => labelProperties(meta)).not.toThrow();
    
    // Labels should not be set for unknown values
    expect(meta.GCB_NAME).toBeUndefined();
    expect(meta.SB_NAME).toBeUndefined();
    expect(meta.WB_NAME).toBeUndefined();
    expect(meta.bc_NAME).toBeUndefined();
    expect(meta.bpt_NAME).toBeUndefined();
    expect(meta.dt_NAME).toBeUndefined();
    expect(meta.ea_NAME).toBeUndefined();
    expect(meta.gc_NAME).toBeUndefined();
    expect(meta.hst_NAME).toBeUndefined();
    expect(meta.jt_NAME).toBeUndefined();
    expect(meta.nt_NAME).toBeUndefined();
    expect(meta.lb_NAME).toBeUndefined();
    expect(meta.lb_DESCRIPTION).toBeUndefined();
    expect(meta.ccc_NAME).toBeUndefined();
    expect(meta.ccc_DESCRIPTION).toBeUndefined();
    expect(meta.sc_NAME).toBeUndefined();
    expect(meta.scx_NAME).toBeNull(); // scx_NAME should be null when no valid scripts are found
  });

  it('handles CCC fixed position classes correctly', () => {
    const meta = {
      ccc: '150',
    } as any as CodepointMeta;

    labelProperties(meta);

    expect(meta.ccc_NAME).toBe('Ccc150');
    expect(meta.ccc_DESCRIPTION).toBe('Fixed Position Class 150');
  });

  it('handles specific CCC values correctly', () => {
    const meta1 = {
      ccc: '0',
    } as any as CodepointMeta;

    const meta2 = {
      ccc: '240',
    } as any as CodepointMeta;

    labelProperties(meta1);
    labelProperties(meta2);

    expect(meta1.ccc_NAME).toBe('Not Reordered');
    expect(meta1.ccc_DESCRIPTION).toBe('Spacing and enclosing marks; also many vowel and consonant signs, even if nonspacing');
    
    expect(meta2.ccc_NAME).toBe('Iota Subscript');
    expect(meta2.ccc_DESCRIPTION).toBe('Greek iota subscript only');
  });

  it('handles multiple scripts in scx correctly', () => {
    const meta = {
      sc: 'Hani',
      scx: ['Hani', 'Hira', 'Kana'],
    } as any as CodepointMeta;

    labelProperties(meta);

    expect(meta.sc_NAME).toBe('Han');
    expect(meta.scx_NAME).toStrictEqual(['Han', 'Hiragana', 'Katakana']);
  });

  it('handles scripts with special characters correctly', () => {
    const meta = {
      sc: 'Nkoo',
      scx: ['Nkoo'],
    } as any as CodepointMeta;

    labelProperties(meta);

    expect(meta.sc_NAME).toBe('N\'Ko');
    expect(meta.scx_NAME).toStrictEqual(['N\'Ko']);
  });

  it('generates hex representations for number arrays and single numbers', () => {
    const meta = {
      cp: 65,
      dm: [32, 65],
      slc: 97,
      lc: 97,
      suc: 65,
      uc: [65],
      stc: 65,
      tc: 65,
      cf: [97],
      FC_NFKC: 97,
      NFKC_CF: [97, 98],
      scf: 97,
    } as any as CodepointMeta;

    labelProperties(meta);

    // Test cp_HEX
    expect(meta.cp_HEX).toBe('0041');
    
    // Test array conversions
    expect(meta.dm_HEX).toStrictEqual(['0020', '0041']);
    expect(meta.NFKC_CF_HEX).toStrictEqual(['0061', '0062']);
    expect(meta.uc_HEX).toStrictEqual(['0041']);
    expect(meta.cf_HEX).toStrictEqual(['0061']);
    
    // Test single number conversions
    expect(meta.slc_HEX).toBe('0061');
    expect(meta.lc_HEX).toBe('0061');
    expect(meta.suc_HEX).toBe('0041');
    expect(meta.stc_HEX).toBe('0041');
    expect(meta.tc_HEX).toBe('0041');
    expect(meta.FC_NFKC_HEX).toBe('0061');
    expect(meta.scf_HEX).toBe('0061');
  });

  it('handles undefined values for hex properties gracefully', () => {
    const meta = {
      cp: 65,
      // Intentionally omitting other properties to test undefined handling
    } as any as CodepointMeta;

    labelProperties(meta);

    expect(meta.cp_HEX).toBe('0041');
    expect(meta.dm_HEX).toBeUndefined();
    expect(meta.slc_HEX).toBeUndefined();
    expect(meta.lc_HEX).toBeUndefined();
    expect(meta.suc_HEX).toBeUndefined();
    expect(meta.uc_HEX).toBeUndefined();
    expect(meta.stc_HEX).toBeUndefined();
    expect(meta.tc_HEX).toBeUndefined();
    expect(meta.cf_HEX).toBeUndefined();
    expect(meta.FC_NFKC_HEX).toBeUndefined();
    expect(meta.NFKC_CF_HEX).toBeUndefined();
    expect(meta.scf_HEX).toBeUndefined();
  });
});
