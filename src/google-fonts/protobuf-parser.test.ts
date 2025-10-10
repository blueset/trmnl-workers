import { describe, it, expect } from 'vitest';
import { parseProtobufText } from './protobuf-parser';

describe('parseProtobufText', () => {
    it('should parse Roboto Flex METADATA.pb correctly', () => {
        const input = `name: "Roboto Flex"
designer: "Font Bureau, David Berlow, Santiago Orozco, Irene Vlachou, Ilya Ruderman, Yury Ostromentsky, Mikhail Strukov"
license: "OFL"
category: "SANS_SERIF"
date_added: "2022-05-01"
fonts {
  name: "Roboto Flex"
  style: "normal"
  weight: 400
  filename: "RobotoFlex[GRAD,XOPQ,XTRA,YOPQ,YTAS,YTDE,YTFI,YTLC,YTUC,opsz,slnt,wdth,wght].ttf"
  post_script_name: "RobotoFlex-Regular"
  full_name: "Roboto Flex Regular"
  copyright: "Copyright 2017 The Roboto Flex Project Authors (https://github.com/googlefonts/roboto-flex)"
}
subsets: "cyrillic"
subsets: "cyrillic-ext"
subsets: "greek"
subsets: "latin"
subsets: "latin-ext"
subsets: "menu"
subsets: "vietnamese"
axes {
  tag: "GRAD"
  min_value: -200.0
  max_value: 150.0
}
axes {
  tag: "XOPQ"
  min_value: 27.0
  max_value: 175.0
}
axes {
  tag: "XTRA"
  min_value: 323.0
  max_value: 603.0
}
axes {
  tag: "YOPQ"
  min_value: 25.0
  max_value: 135.0
}
axes {
  tag: "YTAS"
  min_value: 649.0
  max_value: 854.0
}
axes {
  tag: "YTDE"
  min_value: -305.0
  max_value: -98.0
}
axes {
  tag: "YTFI"
  min_value: 560.0
  max_value: 788.0
}
axes {
  tag: "YTLC"
  min_value: 416.0
  max_value: 570.0
}
axes {
  tag: "YTUC"
  min_value: 528.0
  max_value: 760.0
}
axes {
  tag: "opsz"
  min_value: 8.0
  max_value: 144.0
}
axes {
  tag: "slnt"
  min_value: -10.0
  max_value: 0.0
}
axes {
  tag: "wdth"
  min_value: 25.0
  max_value: 151.0
}
axes {
  tag: "wght"
  min_value: 100.0
  max_value: 1000.0
}
registry_default_overrides {
  key: "XOPQ"
  value: 96.0
}
registry_default_overrides {
  key: "XTRA"
  value: 468.0
}
registry_default_overrides {
  key: "YOPQ"
  value: 79.0
}
registry_default_overrides {
  key: "YTDE"
  value: -203.0
}
registry_default_overrides {
  key: "YTFI"
  value: 738.0
}
registry_default_overrides {
  key: "YTLC"
  value: 514.0
}
registry_default_overrides {
  key: "YTUC"
  value: 712.0
}
source {
  repository_url: "https://github.com/googlefonts/Roboto-Flex"
  commit: "739e06dc46ebb14cddd88b9768a6c1504d4677f6"
  archive_url: "https://github.com/googlefonts/roboto-flex/releases/download/3.200/roboto-flex-fonts.zip"
  files {
    source_file: "roboto-flex-fonts/fonts/variable/RobotoFlex[GRAD,XOPQ,XTRA,YOPQ,YTAS,YTDE,YTFI,YTLC,YTUC,opsz,slnt,wdth,wght].ttf"
    dest_file: "RobotoFlex[GRAD,XOPQ,XTRA,YOPQ,YTAS,YTDE,YTFI,YTLC,YTUC,opsz,slnt,wdth,wght].ttf"
  }
  branch: "main"
  config_yaml: "sources/config.yaml"
}`;

        const result = parseProtobufText(input);

        // Test basic fields
        expect(result.name).toBe('Roboto Flex');
        expect(result.designer).toBe('Font Bureau, David Berlow, Santiago Orozco, Irene Vlachou, Ilya Ruderman, Yury Ostromentsky, Mikhail Strukov');
        expect(result.license).toBe('OFL');
        expect(result.category).toBe('SANS_SERIF');
        expect(result.date_added).toBe('2022-05-01');

        // Test nested object (fonts)
        expect(Array.isArray(result.fonts)).toBe(true);
        expect(result.fonts).toHaveLength(1);
        expect(result.fonts[0].name).toBe('Roboto Flex');
        expect(result.fonts[0].style).toBe('normal');
        expect(result.fonts[0].weight).toBe(400);
        expect(result.fonts[0].filename).toBe('RobotoFlex[GRAD,XOPQ,XTRA,YOPQ,YTAS,YTDE,YTFI,YTLC,YTUC,opsz,slnt,wdth,wght].ttf');
        expect(result.fonts[0].post_script_name).toBe('RobotoFlex-Regular');
        expect(result.fonts[0].full_name).toBe('Roboto Flex Regular');
        expect(result.fonts[0].copyright).toBe('Copyright 2017 The Roboto Flex Project Authors (https://github.com/googlefonts/roboto-flex)');

        // Test repeated fields (arrays)
        expect(Array.isArray(result.subsets)).toBe(true);
        expect(result.subsets).toHaveLength(7);
        expect(result.subsets).toContain('cyrillic');
        expect(result.subsets).toContain('latin');
        expect(result.subsets).toContain('vietnamese');

        // Test repeated nested objects (axes)
        expect(Array.isArray(result.axes)).toBe(true);
        expect(result.axes).toHaveLength(13);
        
        const gradAxis = result.axes.find((axis: any) => axis.tag === 'GRAD');
        expect(gradAxis).toBeDefined();
        expect(gradAxis.min_value).toBe(-200.0);
        expect(gradAxis.max_value).toBe(150.0);

        const wghtAxis = result.axes.find((axis: any) => axis.tag === 'wght');
        expect(wghtAxis).toBeDefined();
        expect(wghtAxis.min_value).toBe(100.0);
        expect(wghtAxis.max_value).toBe(1000.0);

        // Test repeated nested objects (registry_default_overrides)
        expect(Array.isArray(result.registry_default_overrides)).toBe(true);
        expect(result.registry_default_overrides).toHaveLength(7);
        
        const xopqOverride = result.registry_default_overrides.find((override: any) => override.key === 'XOPQ');
        expect(xopqOverride).toBeDefined();
        expect(xopqOverride.value).toBe(96.0);

        // Test nested source object
        expect(result.source).toBeDefined();
        expect(result.source[0].repository_url).toBe('https://github.com/googlefonts/Roboto-Flex');
        expect(result.source[0].commit).toBe('739e06dc46ebb14cddd88b9768a6c1504d4677f6');
        expect(result.source[0].branch).toBe('main');
        expect(result.source[0].config_yaml).toBe('sources/config.yaml');

        // Test nested files within source
        expect(result.source[0].files).toBeDefined();
        expect(result.source[0].files[0].source_file).toBe('roboto-flex-fonts/fonts/variable/RobotoFlex[GRAD,XOPQ,XTRA,YOPQ,YTAS,YTDE,YTFI,YTLC,YTUC,opsz,slnt,wdth,wght].ttf');
        expect(result.source[0].files[0].dest_file).toBe('RobotoFlex[GRAD,XOPQ,XTRA,YOPQ,YTAS,YTDE,YTFI,YTLC,YTUC,opsz,slnt,wdth,wght].ttf');
    });

    it('should parse glegoo METADATA.pb correctly', () => {
        const input = `name: "Glegoo"
designer: "Eduardo Tunni"
license: "OFL"
category: "SERIF"
date_added: "2012-01-25"
fonts {
  name: "Glegoo"
  style: "normal"
  weight: 400
  filename: "Glegoo-Regular.ttf"
  post_script_name: "Glegoo-Regular"
  full_name: "Glegoo"
  copyright: "Copyright (c) 2011, Eduardo Tunni (http://www.tipo.net.ar), Copyright 2011-13 Lohit Fonts Project contributors (http://fedorahosted.org/lohit)"
}
fonts {
  name: "Glegoo"
  style: "normal"
  weight: 700
  filename: "Glegoo-Bold.ttf"
  post_script_name: "Glegoo-Bold"
  full_name: "Glegoo Bold"
  copyright: "Copyright (c) 2011, Eduardo Tunni (http://www.tipo.net.ar), Copyright 2011-13 Lohit Fonts Project contributors (http://fedorahosted.org/lohit)"
}
subsets: "menu"
subsets: "devanagari"
subsets: "latin"
subsets: "latin-ext"
source {
  repository_url: "https://github.com/etunni/glegoo"
}
stroke: "SLAB_SERIF"`;
        const result = parseProtobufText(input);
        expect(result.name).toBe('Glegoo');
        expect(result.designer).toBe('Eduardo Tunni');
        expect(result.license).toBe('OFL');
        expect(result.category).toBe('SERIF');
        expect(result.date_added).toBe('2012-01-25');
        expect(Array.isArray(result.fonts)).toBe(true);
        expect(result.fonts).toHaveLength(2);
        expect(result.fonts[0].weight).toBe(400);
        expect(result.fonts[1].weight).toBe(700);
        expect(Array.isArray(result.subsets)).toBe(true);
        expect(result.subsets).toContain('devanagari');
        expect(result.source[0].repository_url).toBe('https://github.com/etunni/glegoo');
    });

    it('should handle simple key-value pairs', () => {
        const input = 'name: "Test"\nvalue: 42';
        const result = parseProtobufText(input);
        
        expect(result.name).toBe('Test');
        expect(result.value).toBe(42);
    });

    it('should handle floating point numbers', () => {
        const input = 'min: 1.5\nmax: 100.25';
        const result = parseProtobufText(input);
        
        expect(result.min).toBe(1.5);
        expect(result.max).toBe(100.25);
    });

    it('should handle negative numbers', () => {
        const input = 'offset: -10\nscale: -3.14';
        const result = parseProtobufText(input);
        
        expect(result.offset).toBe(-10);
        expect(result.scale).toBe(-3.14);
    });

    it('should handle boolean values', () => {
        const input = 'enabled: true\ndisabled: false';
        const result = parseProtobufText(input);
        
        expect(result.enabled).toBe(true);
        expect(result.disabled).toBe(false);
    });

    it('should handle comments', () => {
        const input = `# This is a comment
name: "Test" # inline comment
value: 42`;
        const result = parseProtobufText(input);
        
        expect(result.name).toBe('Test');
        expect(result.value).toBe(42);
    });

    it('should handle escape sequences in strings', () => {
        const input = 'text: "Line 1\\nLine 2\\tTabbed"';
        const result = parseProtobufText(input);
        
        expect(result.text).toBe('Line 1\nLine 2\tTabbed');
    });
});
