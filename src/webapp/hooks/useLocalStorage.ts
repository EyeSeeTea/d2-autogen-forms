import React from "react";

export function useLocalStorage<T>(
    key: string | undefined,
    initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = React.useState<T>(() => {
        if (!key) return initialValue;
        return getStoredValue(key, initialValue);
    });

    const prevKeyRef = React.useRef(key);

    React.useEffect(() => {
        if (key !== prevKeyRef.current) {
            prevKeyRef.current = key;
            if (!key) {
                setStoredValue(initialValue);
            } else {
                setStoredValue(getStoredValue(key, initialValue));
            }
        }
    }, [key, initialValue]);

    const setValue: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
        value => {
            setStoredValue(prev => {
                const valueToStore = value instanceof Function ? value(prev) : value;
                if (key) {
                    try {
                        window.localStorage.setItem(key, JSON.stringify(valueToStore));
                    } catch (error) {
                        console.warn(`Error setting localStorage key "${key}":`, error);
                    }
                }
                return valueToStore;
            });
        },
        [key]
    );

    return [storedValue, setValue];
}

function getStoredValue<T>(key: string, initialValue: T): T {
    try {
        const item = window.localStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return initialValue;
    }
}
