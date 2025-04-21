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

// --- Internal Form Schema and Type ---
const addFileInternalSchema = createFileSchema.extend({
  tags: z.string().optional(),
});
type AddFileInternalValues = z.infer<typeof addFileInternalSchema>;
// --- External onSubmit Type ---
type AddFileFormSubmitValues = z.infer<typeof createFileSchema>;

interface AddFileFormProps {
  onSubmit: (values: AddFileFormSubmitValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

const AddFileForm: React.FC<AddFileFormProps> = ({
  onSubmit,
  onCancel,
  submitLabel = "Create File",
}) => {
  // Use internal schema and type for the form
  const form = useForm<AddFileInternalValues>({
    resolver: zodResolver(addFileInternalSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
      file: undefined,
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
        return ["grammar", "improve", "shorten"];
      default:
        return [];
    }
  };

  // Get context for AI tasks
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
        title: values.title || "",
        description: values.description || "",
        tags: values.tags || "",
      };
    }
    return undefined;
  };

  // Handle submission: parse tags string here
  const handleSubmit = (internalValues: AddFileInternalValues) => {
    // Parse the tags string into an array
    const finalTags = internalValues.tags
      ? internalValues.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    // Create the final object matching the external onSubmit expectation
    const finalValues: AddFileFormSubmitValues = {
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
                Upload a file to attach to this entry.
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

export default AddFileForm;
