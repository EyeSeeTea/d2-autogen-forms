import { Id } from "../../common/entities/Base";
import { Period } from "../../common/entities/DataValue";
import { ValidationResult } from "../../common/entities/ValidationResult";
import { ValidationRule } from "../../common/entities/ValidationRule";

export interface RuleRepository {
    getByDataSet(dataSetId: Id): Promise<ValidationRule[]>;
    validate(dataSetId: Id, options: ValidateDataSetOptions): Promise<ValidationResult[]>;
}

export type ValidateDataSetOptions = { period: Period; orgUnitId: Id };
