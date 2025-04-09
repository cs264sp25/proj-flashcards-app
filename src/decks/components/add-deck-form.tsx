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
import { createDeckSchema } from "@/decks/types/deck"; // Base schema for final output
import AiEnabledTextarea from "@/ai/components/ai-enabled-textarea";
import { Task as TaskType } from "@/ai/types/tasks";

// --- Internal Form Schema and Type ---
// Treat tags as an optional string for internal state and validation
const addDeckInternalSchema = createDeckSchema.extend({
  tags: z.string().optional(),
});
type AddDeckInternalValues = z.infer<typeof addDeckInternalSchema>;
// --- External onSubmit Type ---
type AddDeckFormSubmitValues = z.infer<typeof createDeckSchema>;

interface AddDeckFormProps {
  onSubmit: (values: AddDeckFormSubmitValues) => void; // Expects final array format
  onCancel: () => void;
  submitLabel?: string;
}

const AddDeckForm: React.FC<AddDeckFormProps> = ({
  onSubmit,
  onCancel,
  submitLabel = "Create Deck",
}) => {
  // Use internal schema and type for the form
  const form = useForm<AddDeckInternalValues>({
    resolver: zodResolver(addDeckInternalSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "", // Default tags to empty string
    },
  });

  // Define available tasks for each field - Specific to Add form if needed
  const getAvailableTasks = (fieldName: string): TaskType[] => {
    switch (fieldName) {
      case "title":
        return ["grammar", "improve", "shorten"];
      case "description":
        return ["grammar", "improve", "shorten", "lengthen", "simplify"];
      // case "tags": // Add tasks for tags if using AiEnabledTextarea here
      //   return ["grammar", "improve", "shorten"];
      default:
        return [];
    }
  };

  // Get context for AI tasks - Specific to Add form if needed
  const getDeckContext = (
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
        tags: values.tags || "", // Pass string context if needed
      };
    }
    return undefined;
  };

  // Handle submission: parse tags string here
  const handleSubmit = (internalValues: AddDeckInternalValues) => {
    // Parse the tags string into an array
    const finalTags = internalValues.tags
      ? internalValues.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean) // Keep filter here to avoid empty tags in final array
      : [];

    // Create the final object matching the external onSubmit expectation
    const finalValues: AddDeckFormSubmitValues = {
      ...internalValues,
      description: internalValues.description || undefined, // Handle empty string for optional description
      tags: finalTags,
    };
    onSubmit(finalValues);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)} // Pass the internal handler
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
                  placeholder="Deck description"
                  availableTasks={getAvailableTasks("description")}
                  context={getDeckContext("description")}
                />
              </FormControl>
              <FormDescription>
                You can add a brief description for your deck. (Limit 200
                characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags Field (using standard Input for now) */}
        {/* TODO: Replace Input with AiEnabledTextarea if desired */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                {/* Simple Input bound to the string state */}
                <Input
                  placeholder="Add tags (comma separated)"
                  {...field} // Pass down field props directly
                  value={field.value ?? ""} // Value is the string
                  // No complex onChange needed here
                />
                {/* Example using AiEnabledTextarea for tags:
                 <AiEnabledTextarea
                   value={field.value ?? ""}
                   onChange={field.onChange}
                   placeholder="Add tags (comma separated)"
                   availableTasks={getAvailableTasks("tags")}
                   context={getDeckContext("tags")}
                 /> */}
              </FormControl>
              <FormDescription>
                Enter tags separated by commas. They will be processed on
                submit.
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

export default AddDeckForm;
