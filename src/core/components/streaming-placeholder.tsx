/**
 * A lightweight placeholder component displayed while content is streaming.
 */
const StreamingPlaceholder: React.FC = () => (
  <div className="flex items-center gap-2 px-4 py-2 my-2 text-sm text-muted-foreground not-prose">
    <div className="flex space-x-1">
      <div
        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
    <span className="pl-2">Rendering paused while streaming ...</span>
  </div>
);

export default StreamingPlaceholder;
