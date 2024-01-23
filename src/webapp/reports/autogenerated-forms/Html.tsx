import React from "react";

type HtmlProps = { content?: string };

export const Html: React.FC<HtmlProps> = props => {
    if (!props.content) return null;

    return <div dangerouslySetInnerHTML={{ __html: props.content }} />;
};
