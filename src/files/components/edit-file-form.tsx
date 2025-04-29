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
import { Input } from "@/core/components/input";
import { createFileSchema } from "@/files/types/file";
import AiEnabledTextarea from "@/ai/components/ai-enabled-textarea";
import { Task as TaskType } from "@/ai/types/tasks";
import { useEffect } from "react";

// --- Internal Form Schema and Type ---
const editFileInternalSchema = createFileSchema.extend({
  tags: z.string().optional(), // Tags as optional string internally
});
type EditFileInternalValues = z.infer<typeof editFileInternalSchema>;
// --- External onSubmit Type ---
type EditFileFormSubmitValues = z.infer<typeof createFileSchema>; // Final format
// --- Initial Values Prop Type (expects array) ---
type EditFileFormInitialValues = z.infer<typeof createFileSchema>;

interface EditFileFormProps {
  onSubmit: (values: EditFileFormSubmitValues) => void; // Expects final array format
  onCancel: () => void;
  initialValues: EditFileFormInitialValues; // Received initial values with array
  fileId: string;
  submitLabel?: string;
}

// Helper to convert initial array to string for form state
const getInitialFormValues = (
  initialValues: EditFileFormInitialValues,
): EditFileInternalValues => {
  return {
    title: initialValues.title || "",
    description: initialValues.description || "",
    tags: Array.isArray(initialValues.tags)
      ? initialValues.tags.join(", ") // Convert array to string
      : "",
    file: initialValues.file,
  };
};

const EditFileForm: React.FC<EditFileFormProps> = ({
  onSubmit,
  onCancel,
  initialValues,
  fileId,
  submitLabel = "Save Changes",
}) => {
  // Use internal schema and type
  const form = useForm<EditFileInternalValues>({
    resolver: zodResolver(editFileInternalSchema),
    defaultValues: getInitialFormValues(initialValues), // Use helper for default
  });

  // Reset form if initialValues change, converting tags array to string
  useEffect(() => {
    form.reset(getInitialFormValues(initialValues));
  }, [initialValues, form]);

  // --- AI Task Logic ---
  const getAvailableTasks = (fieldName: string): TaskType[] => {
    switch (fieldName) {
      case "title":
        return ["grammar", "improve", "shorten"];
      case "description":
        return ["grammar", "improve", "shorten", "lengthen", "simplify"];
      case "tags":
        return ["grammar", "improve", "shorten"];
      default:
        return [];
    }
  };

  const getFileContext = (
    fieldName: string,
  ): Record<string, string> | undefined => {
    const values = form.getValues();
    if (
      fieldName === "title" ||
      fieldName === "description" ||
      fieldName === "tags"
    ) {
      return {
        fileId: fileId,
        title: values.title || "",
        description: values.description || "",
        tags: values.tags || "",
      };
    }
    return undefined;
  };
  // --- End AI Task Logic ---

  // Handle submission: parse tags string here
  const handleSubmit = (internalValues: EditFileInternalValues) => {
    // Parse the tags string into an array
    const finalTags = internalValues.tags
      ? internalValues.tags
          .split(",")
          .map((tag) => tag.trim()) // Trim whitespace from each part
          .filter(Boolean) // Keep filter here
      : [];

    // Create the final object matching the external onSubmit expectation
    const finalValues: EditFileFormSubmitValues = {
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
                  placeholder="File title"
                  availableTasks={getAvailableTasks("title")}
                  context={getFileContext("title")}
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
                  placeholder="File description"
                  availableTasks={getAvailableTasks("description")}
                  context={getFileContext("description")}
                />
              </FormControl>
              <FormDescription>
                Add a brief description. (Limit 200 characters)
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
                  context={getFileContext("tags")}
                />
              </FormControl>
              <FormDescription>Enter tags separated by commas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload Field */}
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      field.onChange(file);
                    }
                  }}
                  className="cursor-pointer"
                />
              </FormControl>
              <FormDescription>
                Upload a new file to replace the existing one.
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

export default EditFileForm;
