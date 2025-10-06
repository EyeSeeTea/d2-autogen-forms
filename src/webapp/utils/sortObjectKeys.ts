import _ from "lodash";

export const sortObjectKeys = <T>(obj: T): T => {
    if (_.isArray(obj)) {
        return _.map(obj, sortObjectKeys) as T;
    }

    if (_.isPlainObject(obj)) {
        return _(obj as object)
            .toPairs()
            .sortBy(([key]) => key)
            .map(([key, value]) => [key, sortObjectKeys(value)])
            .fromPairs()
            .value() as T;
    }

    return obj;
};
