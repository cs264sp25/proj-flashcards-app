/**
  Add the following tags to your page <head> to automatically load hljs and styles:

  <link
    rel="stylesheet"
    href="https://unpkg.com/@highlightjs/cdn-assets@11.9.0/styles/vs2015.min.css"
  />
  
  <script
    crossorigin="anonymous"
    src="https://unpkg.com/@highlightjs/cdn-assets@11.9.0/highlight.min.js"
  ></script>
 */

import React, { useRef, useEffect } from "react";

interface SyntaxHighlightedCodeProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

const SyntaxHighlightedCode: React.FC<SyntaxHighlightedCodeProps> = (props) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    // @ts-ignore
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      // @ts-ignore
      window.hljs.highlightElement(ref.current);

      // hljs won't reprocess the element unless this attribute is removed
      ref.current.removeAttribute("data-highlighted");
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
};

export default SyntaxHighlightedCode;
