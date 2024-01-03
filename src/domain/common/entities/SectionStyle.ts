import { Maybe } from "../../../utils/ts-utils";

export const DEFAULT_SECTION_STYLES = {
    title: {
        backgroundColor: "transparent",
        color: "#ffffff",
    },
    columns: {
        backgroundColor: "#f3f5f7",
        color: "#404b5a",
    },
    rows: {
        backgroundColor: "#ffffff",
        color: "#404b5a",
    },
};

export type CssProperties = {
    backgroundColor?: HexColor;
    color?: HexColor;
};

export type SectionStyleAttrs = {
    title: CssProperties;
    columns: CssProperties;
    rows: CssProperties;
};

export class SectionStyle {
    public readonly title: CssProperties;
    public readonly columns: CssProperties;
    public readonly rows: CssProperties;

    constructor(data: SectionStyleAttrs) {
        this.title = data.title;
        this.columns = data.columns;
        this.rows = data.rows;
    }

    static buildSectionStyles(data?: Partial<SectionStyleAttrs>): SectionStyle {
        if (!data) return DEFAULT_SECTION_STYLES;
        return {
            title: this.getTitleStyles(data.title, DEFAULT_SECTION_STYLES.title),
            columns: this.getTitleStyles(data.columns, DEFAULT_SECTION_STYLES.columns),
            rows: this.getTitleStyles(data.rows, DEFAULT_SECTION_STYLES.rows),
        };
    }

    private static getTitleStyles(cssProperties: Maybe<CssProperties>, defaultValue: CssProperties): CssProperties {
        return cssProperties ? cssProperties : defaultValue;
    }
}

export type HexColor = string;
