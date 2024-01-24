import React from "react";

type HtmlProps = { backgroundColor?: string; content?: string };

export const Html: React.FC<HtmlProps> = props => {
    if (!props.content) return null;

    return (
        <div style={{ backgroundColor: props.backgroundColor }} dangerouslySetInnerHTML={{ __html: props.content }} />
    );
};
