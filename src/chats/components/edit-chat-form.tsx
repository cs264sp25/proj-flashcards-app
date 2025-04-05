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
import { useEffect } from "react";

// --- Internal Form Schema and Type ---
const editChatInternalSchema = createChatSchema.extend({
  tags: z.string().optional(),
});
type EditChatInternalValues = z.infer<typeof editChatInternalSchema>;
// --- External onSubmit Type ---
type EditChatFormSubmitValues = z.infer<typeof createChatSchema>;
// --- Initial Values Prop Type (expects array) ---
type EditChatFormInitialValues = z.infer<typeof createChatSchema>;

interface EditChatFormProps {
  onSubmit: (values: EditChatFormSubmitValues) => void;
  onCancel: () => void;
  initialValues: EditChatFormInitialValues;
  submitLabel?: string;
  chatId: string; // Needed for context-aware AI tasks later
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
  };
};

const EditChatForm: React.FC<EditChatFormProps> = ({
  onSubmit,
  onCancel,
  initialValues,
  submitLabel = "Save Changes",
  chatId,
}) => {
  // Use internal schema and type
  const form = useForm<EditChatInternalValues>({
    resolver: zodResolver(editChatInternalSchema),
    defaultValues: getInitialFormValues(initialValues),
  });

  // Reset form if initialValues change
  useEffect(() => {
    form.reset(getInitialFormValues(initialValues));
  }, [initialValues, form]);

  // --- AI Task Logic (Can add chat-specific tasks/context later) ---
  const getAvailableTasks = (fieldName: string): TaskType[] => {
    switch (fieldName) {
      case "title":
        return [
          "grammar",
          "improve",
          "shorten",
          "generateTitleFromMessages",
        ];
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
        return [
          "grammar",
          "improve",
          "shorten",
          "generateTagsFromMessages",
        ];
      default:
        return [];
    }
  };

  const getChatContext = (
    fieldName: string,
  ): Record<string, any> | undefined => {
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
        chatId: chatId,
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
      : [];

    const finalValues: EditChatFormSubmitValues = {
      ...internalValues,
      description: internalValues.description || undefined,
      tags: finalTags,
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
