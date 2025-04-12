import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/core/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/components/form";
import { createChatSchema } from "@/chats/types/chat"; // Use chat schema
import AiEnabledTextarea from "@/ai/components/ai-enabled-textarea";
import { Task as TaskType } from "@/ai/types/tasks";
import AssistantDropdown from "@/assistants/components/assistant-dropdown"; // Import the dropdown
import { Id } from "@convex-generated/dataModel"; // Import Id type

// --- Internal Form Schema and Type ---
const addChatInternalSchema = createChatSchema.extend({
  tags: z.string().optional(),
});
type AddChatInternalValues = z.infer<typeof addChatInternalSchema>;
// --- External onSubmit Type ---
type AddChatFormSubmitValues = z.infer<typeof createChatSchema>;

interface AddChatFormProps {
  onSubmit: (values: AddChatFormSubmitValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

const AddChatForm: React.FC<AddChatFormProps> = ({
  onSubmit,
  onCancel,
  submitLabel = "Create Chat",
}) => {
  // Use internal schema and type for the form
  const form = useForm<AddChatInternalValues>({
    resolver: zodResolver(addChatInternalSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "", // Default tags to empty string
      assistantId: undefined, // Default assistantId to undefined
    },
  });

  // Define available tasks for each field
  const getAvailableTasks = (fieldName: string): TaskType[] => {
    switch (fieldName) {
      case "title":
        return ["grammar", "improve", "shorten"];
      case "description":
        return ["grammar", "improve", "shorten", "lengthen", "simplify"];
      case "tags":
        return ["grammar", "improve"];
      default:
        return [];
    }
  };

  // Get context for AI tasks
  const getChatContext = (
    fieldName: string,
  ): Record<string, string> | undefined => {
    const values = form.getValues();
    if (
      fieldName === "title" ||
      fieldName === "description" ||
      fieldName === "tags"
    ) {
      return {
        title: values.title || "",
        description: values.description || "",
        tags: values.tags || "",
      };
    }
    return undefined;
  };

  // Handle submission: parse tags string here
  const handleSubmit = (internalValues: AddChatInternalValues) => {
    const finalTags = internalValues.tags
      ? internalValues.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : undefined; // Use undefined if empty

    const finalValues: AddChatFormSubmitValues = {
      title: internalValues.title,
      description: internalValues.description || undefined,
      tags: finalTags,
      assistantId: internalValues.assistantId || undefined, // Ensure undefined if not selected
    };
    onSubmit(finalValues);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4"
      >
        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <AiEnabledTextarea
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Chat title"
                  availableTasks={getAvailableTasks("title")}
                  context={getChatContext("title")}
                />
              </FormControl>
              <FormDescription>
                Keep the title short and descriptive. (Limit 50 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <AiEnabledTextarea
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Chat description"
                  availableTasks={getAvailableTasks("description")}
                  context={getChatContext("description")}
                />
              </FormControl>
              <FormDescription>
                You can add a brief description for your chat. (Limit 200
                characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags Field */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <AiEnabledTextarea
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Add tags (comma separated)"
                  availableTasks={getAvailableTasks("tags")}
                  context={getChatContext("tags")}
                />
              </FormControl>
              <FormDescription>
                Enter tags separated by commas. They will be processed on
                submit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Assistant Field */}
        <FormField
          control={form.control}
          name="assistantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assistant (Optional)</FormLabel>
              <FormControl>
                <AssistantDropdown
                  value={field.value as Id<"assistants"> | undefined} // Cast or handle potential undefined
                  onChange={field.onChange}
                  className="w-full"
                />
              </FormControl>
              <FormDescription>
                Optionally select an assistant to use for this chat.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-2">
          <Button type="submit">{submitLabel}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddChatForm;
