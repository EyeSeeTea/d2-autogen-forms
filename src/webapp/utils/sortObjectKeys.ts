import _ from "lodash";

export const sortObjectKeys = (obj: unknown): unknown => {
    if (_.isArray(obj)) {
        return _.map(obj, sortObjectKeys);
    }
    if (_.isPlainObject(obj)) {
        return _(obj)
            .toPairs()
            .sortBy(0)
            .map(([key, value]) => [key, sortObjectKeys(value)])
            .fromPairs()
            .value();
    }
    return obj;
};
