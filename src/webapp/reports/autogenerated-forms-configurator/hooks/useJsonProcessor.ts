import { useCallback, useRef, useState } from "react";
import _ from "lodash";
import { AutogenConfig } from "../../../../domain/common/entities/AutogenConfig";

type JsonProcessorState = {
    error: string | null;
    isProcessing: boolean;
    formatJson: (config: AutogenConfig) => Promise<string>;
    parseJson: (json: string) => Promise<AutogenConfig>;
    validateJson: (json: string) => Promise<boolean>;
};

export const useJsonProcessor = (): JsonProcessorState => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cancelRef = useRef<boolean>(false);

    const processWithYielding = useCallback(async <T>(processor: () => T): Promise<T> => {
        return new Promise((resolve, reject) => {
            cancelRef.current = false;
            setIsProcessing(true);
            setError(null);

            const processChunk = () => {
                if (cancelRef.current) {
                    setIsProcessing(false);
                    reject(new Error("Processing cancelled"));
                    return;
                }

                try {
                    const result = processor();
                    setIsProcessing(false);
                    resolve(result);
                } catch (error) {
                    setIsProcessing(false);
                    const errorMessage = error instanceof Error ? error.message : "Processing error";
                    setError(errorMessage);
                    reject(error);
                }
            };

            requestAnimationFrame(() => {
                setTimeout(processChunk, 0);
            });
        });
    }, []);

    const formatJson = useCallback(
        async (config: AutogenConfig): Promise<string> =>
            processWithYielding(() => JSON.stringify(sortConfig(config), null, 4)),
        [processWithYielding]
    );

    const parseJson = useCallback(
        async (json: string): Promise<AutogenConfig> =>
            processWithYielding(() => {
                if (!json.trim()) return null;
                return JSON.parse(json);
            }),
        [processWithYielding]
    );

    const validateJson = useCallback(
        async (json: string): Promise<boolean> => {
            return processWithYielding(() => {
                if (!json.trim()) return true;

                try {
                    const parsed = JSON.parse(json);
                    if (typeof parsed !== "object" || parsed === null) {
                        return false;
                    }

                    return true;
                } catch {
                    return false;
                }
            });
        },
        [processWithYielding]
    );

    return {
        error: error,
        isProcessing: isProcessing,
        formatJson: formatJson,
        parseJson: parseJson,
        validateJson: validateJson,
    };
};

const sortConfig = (obj: unknown): unknown => {
    if (_.isArray(obj)) {
        return _.map(obj, sortConfig);
    }
    if (_.isPlainObject(obj)) {
        return _(obj)
            .toPairs()
            .sortBy(0)
            .map(([key, value]) => [key, sortConfig(value)])
            .fromPairs()
            .value();
    }
    return obj;
};
