import * as React from "react";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from 'rehype-raw';
import { cn } from "@/core/lib/utils";
import { InMarkdownDeck } from "@/decks/components/deck-in-markdown";
import { InMarkdownCard } from "@/cards/components/card-in-markdown";

/**
 * Registry of allowed custom components.
 * Maps tag names (lowercase) to React component types.
 * Using lowercase keys allows for case-insensitive matching later.
 */
const componentRegistry: Record<string, React.ComponentType<any>> = {
  // Add your custom components here
  // Use lowercase keys for the tag names
  inmarkdowndeck: InMarkdownDeck,
  inmarkdowncard: InMarkdownCard,
};

type ComponentName = keyof typeof componentRegistry;

/**
 * Represents the data needed to render a custom component instance.
 */
interface ComponentPlaceholder {
  id: string; // Unique ID for the placeholder element
  componentName: ComponentName; // Lowercase name of the component (key in registry)
  props: Record<string, any>; // Props extracted from the tag attributes
}

/**
 * Parses a string of HTML-like attributes (e.g., prop1="value1" prop2="value2")
 * into a props object. Handles double-quoted values.
 * @param attrsString The string containing attributes.
 * @returns An object mapping attribute names to their values.
 */
function parseAttributes(attrsString: string): Record<string, any> {
  const props: Record<string, any> = {};
  // Regex to find attributes in the format: key="value"
  const attrRegex = /(\w+)="([^"]+)"/g;
  let match;
  // Iterate over all matches found in the attributes string
  while ((match = attrRegex.exec(attrsString)) !== null) {
    // Add the attribute name (key) and value to the props object
    props[match[1]] = match[2];
  }
  return props;
}

/**
 * Pre-processes markdown content to find custom component tags,
 * replace them with placeholder divs, and extract component data.
 * @param markdownContent The raw markdown string.
 * @returns An object containing the processed markdown and a list of components to render.
 */
function parseCustomTags(markdownContent: string): {
  processedContent: string;
  componentsToRender: ComponentPlaceholder[];
} {
  const componentsToRender: ComponentPlaceholder[] = [];
  let processedContent = markdownContent;
  // Regex to find self-closing tags like <Component attr="value" />
  // - Group 1: Component Name (e.g., "InMarkdownDeck")
  // - Group 2: Attributes string (e.g., `deckId="k5..."`)
  // Using [\s\S]*? for attributes to handle potential newlines within the tag
  const tagRegex = /<(\w+)\s+([\s\S]*?)\s*\/>/g;

  // Use replace with a function to handle each match
  processedContent = processedContent.replace(
    tagRegex,
    (match, componentTagName: string, attrsString: string) => {
      // Convert tag name to lowercase for case-insensitive lookup in the registry
      const componentNameLower = componentTagName.toLowerCase();

      // Check if the found tag name exists (case-insensitively) in our registry
      if (componentRegistry.hasOwnProperty(componentNameLower)) {
        // Parse the attributes string into a props object
        const props = parseAttributes(attrsString);
        // Generate a unique ID for the placeholder div
        const id = `component-placeholder-${componentsToRender.length}`;
        // Store the necessary data to render this component later
        componentsToRender.push({ id, componentName: componentNameLower, props });

        // Replace the original custom tag with a simple div placeholder
        // This div will be targeted by the 'components' prop in ReactMarkdown
        return `<div id="${id}"></div>`;
      }
      // If the tag name is not in our registry, leave the original tag string unchanged
      return match;
    }
  );

  return { processedContent, componentsToRender };
}

interface MarkdownProps {
  content: string; // The raw markdown content with potential custom tags
  className?: string; // Optional additional class names
}

/**
 * Renders Markdown content, allowing custom React components specified
 * with JSX-like tags (e.g., <InMarkdownDeck deckId="..." />).
 */
const Markdown: React.FC<MarkdownProps> = ({ content, className }) => {
  // Pre-process the markdown content to identify and prepare custom components.
  // useMemo ensures this parsing only happens when the input 'content' changes.
  const { processedContent, componentsToRender } = useMemo(
    () => parseCustomTags(content),
    [content]
  );

  return (
    <div
      className={cn("prose prose-stone prose-sm dark:prose-invert", className)}
    >
      <ReactMarkdown
        // Pass the processed markdown (with placeholders instead of custom tags)
        children={processedContent}
        // Enable basic Github Flavored Markdown (tables, strikethrough, etc.)
        remarkPlugins={[remarkGfm]}
        // *** CRITICAL STEP ***
        // Enable parsing of raw HTML elements (our injected placeholder divs).
        // Requires 'rehype-raw' package.
        rehypePlugins={[rehypeRaw]}
        components={{
          // Define a custom renderer for 'div' elements
          div: ({ node, className: nodeClassName, children, ...props }) => {
            // Check if this div has an 'id' attribute matching our placeholder format
            const elementId = props.id as string | undefined;
            const componentData = elementId
              ? componentsToRender.find(c => c.id === elementId)
              : undefined;

            // If this div is one of our placeholders...
            if (componentData) {
              // Find the corresponding React component from our registry
              const Component = componentRegistry[componentData.componentName];
              if (Component) {
                // Render the actual custom component, passing the props
                // extracted from the original tag's attributes.
                // We ignore 'children' passed to the div renderer,
                // as the custom component manages its own content.
                // We also filter out the placeholder 'id'.
                const { id, ...originalProps } = props; // originalProps might be empty
                return <Component {...componentData.props} />;
              } else {
                 // Fallback if component name found but not in registry (shouldn't happen with current logic)
                 console.warn(`Component "${componentData.componentName}" found in markdown but not registered.`);
                 return <div {...props}>Error: Component not registered</div>;
              }
            }

            // If it's NOT a placeholder, render it as a normal div.
            // Pass through any className, children, and other props received.
            return <div className={nodeClassName} {...props}>{children}</div>;
          },
          // You can add custom renderers for other HTML elements here if needed
          // e.g., custom styling for links, images, etc.
          // a: ({node, ...props}) => <a style={{color: 'red'}} {...props} />,
        }}
      />
    </div>
  );
};

export default Markdown;



