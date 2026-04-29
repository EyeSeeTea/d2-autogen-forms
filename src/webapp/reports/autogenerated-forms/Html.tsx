import React from "react";
import styled from "styled-components";

type HtmlProps = { backgroundColor?: string; content?: string };

export const Html: React.FC<HtmlProps> = props => {
    if (!props.content) return null;

    return (
        <StyledDiv
            style={{ backgroundColor: props.backgroundColor }}
            dangerouslySetInnerHTML={{ __html: props.content }}
        />
    );
};

const StyledDiv = styled.div`
    position: relative;
`;
