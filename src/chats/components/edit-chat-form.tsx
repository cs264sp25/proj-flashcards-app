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
import { createChatSchema, ChatType } from "@/chats/types/chat"; // Use chat schema and ChatType
import AiEnabledTextarea from "@/ai/components/ai-enabled-textarea";
import { Task as TaskType } from "@/ai/types/tasks";
import { useEffect } from "react";
import AssistantDropdown from "@/assistants/components/assistant-dropdown"; // Import the dropdown
import { Id } from "@convex-generated/dataModel"; // Import Id type

// --- Internal Form Schema and Type ---
// assistantId is already optional in createChatSchema
const editChatInternalSchema = createChatSchema.extend({
  tags: z.string().optional(),
});
type EditChatInternalValues = z.infer<typeof editChatInternalSchema>;

// --- External onSubmit Type ---
// Uses createChatSchema which includes optional assistantId
type EditChatFormSubmitValues = z.infer<typeof createChatSchema>;

// --- Initial Values Prop Type --- Use the full ChatType from chat.ts
type EditChatFormInitialValues = ChatType;

interface EditChatFormProps {
  onSubmit: (values: EditChatFormSubmitValues) => void;
  onCancel: () => void;
  initialValues: EditChatFormInitialValues;
  chatId: string;
  submitLabel?: string;
}

// Helper to convert initial array to string for form state
const getInitialFormValues = (
  initialValues: EditChatFormInitialValues,
): EditChatInternalValues => {
  return {
    title: initialValues.title || "",
    description: initialValues.description || "",
    tags: Array.isArray(initialValues.tags)
      ? initialValues.tags.join(", ") // Convert array to string with ", "
      : "",
    assistantId: initialValues.assistantId || undefined, // Get assistantId
  };
};

const EditChatForm: React.FC<EditChatFormProps> = ({
  onSubmit,
  onCancel,
  initialValues,
  chatId,
  submitLabel = "Save Changes",
}) => {
  // Use internal schema and type
  const form = useForm<EditChatInternalValues>({
    resolver: zodResolver(editChatInternalSchema),
    defaultValues: getInitialFormValues(initialValues), // defaultValues will now include assistantId
  });

  // Reset form if initialValues change
  useEffect(() => {
    form.reset(getInitialFormValues(initialValues));
  }, [initialValues, form]);

  // --- AI Task Logic (Can add chat-specific tasks/context later) ---
  const getAvailableTasks = (fieldName: string): TaskType[] => {
    switch (fieldName) {
      case "title":
        return ["grammar", "improve", "shorten", "generateTitleFromMessages"];
      case "description":
        return [
          "grammar",
          "improve",
          "shorten",
          "lengthen",
          "simplify",
          "generateDescriptionFromMessages",
        ];
      case "tags":
        return ["grammar", "improve", "shorten", "generateTagsFromMessages"];
      default:
        return [];
    }
  };

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
        chatId: chatId,
        title: values.title || "",
        description: values.description || "",
        tags: values.tags || "",
      };
    }
    return undefined;
  };
  // --- End AI Task Logic ---

  // Handle submission: parse tags string here
  const handleSubmit = (internalValues: EditChatInternalValues) => {
    const finalTags = internalValues.tags
      ? internalValues.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : undefined; // Use undefined if empty

    const finalValues: EditChatFormSubmitValues = {
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
                Keep title short (Limit 50 chars). Use AI to generate from
                messages.
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
                Add a brief description (Limit 200 chars). Use AI to generate
                from messages.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags Field (using AiEnabledTextarea) */}
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
                Enter comma-separated tags. Use AI to generate from messages.
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

export default EditChatForm;
