import React from "react";

export const Html: React.FC<{ content: string | undefined; backgroundColor?: string }> = props => {
    if (!props.content) return null;

    return (
        <div
            style={{ padding: 20, backgroundColor: props.backgroundColor }}
            dangerouslySetInnerHTML={{ __html: props.content }}
        />
    );
};
