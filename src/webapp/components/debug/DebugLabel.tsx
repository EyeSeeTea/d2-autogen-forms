const debugEnabled = !!import.meta.env.VITE_DEBUG;

export const DebugLabel: React.FC = props => {
    if (!debugEnabled) return null;
    return (
        <pre
            style={{
                margin: 0,
                fontSize: "10px",
            }}
        >
            {props.children}
        </pre>
    );
};
