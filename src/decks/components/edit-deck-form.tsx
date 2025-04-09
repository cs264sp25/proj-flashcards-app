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
import { createDeckSchema } from "@/decks/types/deck"; // Base schema for final output
import AiEnabledTextarea from "@/ai/components/ai-enabled-textarea";
import { Task as TaskType } from "@/ai/types/tasks";
import { useEffect } from "react";

// --- Internal Form Schema and Type ---
const editDeckInternalSchema = createDeckSchema.extend({
  tags: z.string().optional(), // Tags as optional string internally
});
type EditDeckInternalValues = z.infer<typeof editDeckInternalSchema>;
// --- External onSubmit Type ---
type EditDeckFormSubmitValues = z.infer<typeof createDeckSchema>; // Final format
// --- Initial Values Prop Type (expects array) ---
type EditDeckFormInitialValues = z.infer<typeof createDeckSchema>;

interface EditDeckFormProps {
  onSubmit: (values: EditDeckFormSubmitValues) => void; // Expects final array format
  onCancel: () => void;
  initialValues: EditDeckFormInitialValues; // Received initial values with array
  submitLabel?: string;
  deckId: string;
}

// Helper to convert initial array to string for form state
const getInitialFormValues = (
  initialValues: EditDeckFormInitialValues,
): EditDeckInternalValues => {
  return {
    title: initialValues.title || "",
    description: initialValues.description || "",
    tags: Array.isArray(initialValues.tags)
      ? initialValues.tags.join(", ") // Convert array to string
      : "",
  };
};

const EditDeckForm: React.FC<EditDeckFormProps> = ({
  onSubmit,
  onCancel,
  initialValues,
  submitLabel = "Save Changes",
  deckId,
}) => {
  // Use internal schema and type
  const form = useForm<EditDeckInternalValues>({
    resolver: zodResolver(editDeckInternalSchema),
    defaultValues: getInitialFormValues(initialValues), // Use helper for default
  });

  // Reset form if initialValues change, converting tags array to string
  useEffect(() => {
    form.reset(getInitialFormValues(initialValues));
  }, [initialValues, form]);

  // --- AI Task Logic (can remain similar, using string context for tags if needed) ---
  const getAvailableTasks = (fieldName: string): TaskType[] => {
    switch (fieldName) {
      case "title":
        return ["grammar", "improve", "shorten", "generateTitleFromCards"];
      case "description":
        return [
          "grammar",
          "improve",
          "shorten",
          "lengthen",
          "simplify",
          "generateDescriptionFromCards",
        ];
      case "tags":
        return ["grammar", "improve", "shorten", "generateTagsFromCards"];
      default:
        return [];
    }
  };

  const getDeckContext = (
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
        tags: values.tags || "", // Pass string context
        deckId: deckId,
      };
    }
    return undefined;
  };
  // --- End AI Task Logic ---

  // Handle submission: parse tags string here
  const handleSubmit = (internalValues: EditDeckInternalValues) => {
    // Parse the tags string into an array
    const finalTags = internalValues.tags
      ? internalValues.tags
          .split(",")
          .map((tag) => tag.trim()) // Trim whitespace from each part
          .filter(Boolean) // Keep filter here
      : [];

    // Create the final object matching the external onSubmit expectation
    const finalValues: EditDeckFormSubmitValues = {
      ...internalValues,
      description: internalValues.description || undefined, // Handle empty string
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
                  placeholder="Deck title"
                  availableTasks={getAvailableTasks("title")}
                  context={getDeckContext("title")}
                />
              </FormControl>
              <FormDescription>
                Keep the title short and descriptive. (Limit 50 characters) Use
                AI to generate based on cards.
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
                  placeholder="Deck description"
                  availableTasks={getAvailableTasks("description")}
                  context={getDeckContext("description")}
                />
              </FormControl>
              <FormDescription>
                Add a brief description. (Limit 200 characters) Use AI to
                generate based on cards.
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
                {/* Using AiEnabledTextarea for tags */}
                <AiEnabledTextarea
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Add tags (comma separated)"
                  availableTasks={getAvailableTasks("tags")}
                  context={getDeckContext("tags")}
                />
              </FormControl>
              <FormDescription>
                Enter tags separated by commas. Use AI to generate based on
                cards.
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

export default EditDeckForm;
