export type PeriodInterval = Readonly<{ type: "relative-interval"; startOffset: number; endOffset: number }>;
export type PeriodSectionOffset = Readonly<{ type: "section-offset"; offset: number }>;
export type SectionPeriod = PeriodInterval | PeriodSectionOffset;
