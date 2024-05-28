import { Id } from "../Base";
import { DataFormM, DataForm, SectionWithPeriods, SectionSimple } from "../DataForm";
import { Period } from "../DataValue";
import { sectionBase, dataFormBase } from "./dataFixtures";

describe("DataFormM", () => {
    describe("getReferencedPeriods", () => {
        it("should return basePeriod when there are no additional periods", () => {
            const dataForm: DataForm = {
                ...dataFormBase,
                sections: [],
            };

            const basePeriod: Period = "202101";
            const result = DataFormM.getReferencedPeriods(dataForm, basePeriod);

            expect(result).toEqual([basePeriod]);
        });

        it("should return unique periods from sections and basePeriod", () => {
            const sections: SectionWithPeriods[] = [
                createSectionWithPeriods("1", ["202102", "202103"]),
                createSectionWithPeriods("2", ["202104", "202105"]),
            ];

            const dataForm: DataForm = {
                ...dataFormBase,
                sections,
            };

            const basePeriod: Period = "202101";
            const result = DataFormM.getReferencedPeriods(dataForm, basePeriod);

            expect(result).toEqual(["202101", "202102", "202103", "202104", "202105"]);
        });

        it("should handle mixed section types", () => {
            const sections = [createSectionWithPeriods("1", ["202102", "202103"]), createSectionSimple("2")];

            const dataForm: DataForm = {
                ...dataFormBase,
                sections,
            };

            const basePeriod: Period = "202101";
            const result = DataFormM.getReferencedPeriods(dataForm, basePeriod);

            expect(result).toEqual(["202101", "202102", "202103"]);
        });

        it("should return sorted unique periods", () => {
            const sections = [
                createSectionWithPeriods("1", ["202103", "202102"]),
                createSectionWithPeriods("2", ["202105", "202104"]),
                createSectionWithPeriods("3", ["202101", "202106"]),
            ];

            const dataForm: DataForm = {
                ...dataFormBase,
                sections,
            };

            const basePeriod: Period = "202100";
            const result = DataFormM.getReferencedPeriods(dataForm, basePeriod);

            expect(result).toEqual(["202100", "202101", "202102", "202103", "202104", "202105", "202106"]);
        });
    });
});

function createSectionSimple(id: Id): SectionSimple {
    return {
        id,
        name: `Section ${id}`,
        viewType: "grid-with-combos",
        ...sectionBase,
    };
}

function createSectionWithPeriods(id: Id, periods: Period[]): SectionWithPeriods {
    return {
        id,
        name: `Section ${id}`,
        viewType: "grid-with-periods",
        periods,
        ...sectionBase,
    };
}
