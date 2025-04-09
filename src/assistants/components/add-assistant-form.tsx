import { useState, useEffect } from "react";
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
import { Switch } from "@/core/components/switch";
import { Slider } from "@/core/components/slider";

import AiEnabledTextarea from "@/ai/components/ai-enabled-textarea";
import { Task as TaskType } from "@/ai/types/tasks";

import {
  createAssistantSchema,
  toolSchema,
} from "@/assistants/types/assistant";

// --- Internal Form Schema and Type (Adjusted for form handling) ---
// Handle tools as booleans internally, temperature as number array for slider
const addAssistantInternalSchema = createAssistantSchema
  .omit({ tools: true, temperature: true, model: true }) // Omit original fields to redefine types for form state
  .extend({
    model: z.string().optional(), // Keep model as optional string for input
    temperature: z.preprocess(
      (val) => (Array.isArray(val) && val.length > 0 ? val[0] : val), // Preprocess slider array
      z.number().min(0).max(2).optional().default(1), // Default temperature 1
    ),
    file_search: z.boolean().optional().default(false), // Handle tools as booleans
    code_interpreter: z.boolean().optional().default(false),
  });

type AddAssistantInternalValues = z.infer<typeof addAssistantInternalSchema>;
// --- External onSubmit Type (Remains the same) ---
type AddAssistantFormSubmitValues = z.infer<typeof createAssistantSchema>;

interface AddAssistantFormProps {
  onSubmit: (values: AddAssistantFormSubmitValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

const AddAssistantForm: React.FC<AddAssistantFormProps> = ({
  onSubmit,
  onCancel,
  submitLabel = "Create Assistant",
}) => {
  const form = useForm<AddAssistantInternalValues>({
    resolver: zodResolver(addAssistantInternalSchema),
    defaultValues: {
      name: "",
      description: "",
      instructions: "",
      model: "gpt-4o-mini",
      temperature: 1,
      file_search: false,
      code_interpreter: false,
    },
  });

  // State for temperature slider display
  const [temperatureDisplayValue, setTemperatureDisplayValue] =
    useState<number>(form.getValues("temperature") ?? 1);

  // Sync slider display with form state on initial load or external change
  useEffect(() => {
    const currentTemp = form.getValues("temperature");
    if (currentTemp !== undefined && currentTemp !== temperatureDisplayValue) {
      setTemperatureDisplayValue(currentTemp);
    }
  }, [form.getValues("temperature")]); // Watch form value

  // Update form value when slider display changes
  useEffect(() => {
    if (form.getValues("temperature") !== temperatureDisplayValue) {
      form.setValue("temperature", temperatureDisplayValue, {
        shouldValidate: true,
      });
    }
  }, [temperatureDisplayValue, form]);

  // Define available tasks for each field
  const getAvailableTasks = (fieldName: string): TaskType[] => {
    switch (fieldName) {
      case "name":
        return ["grammar", "improve", "shorten"];
      case "description":
      case "instructions": // Add instructions here
        return ["grammar", "improve", "shorten", "lengthen", "simplify"];
      default:
        return [];
    }
  };

  // Get context for AI tasks
  const getAssistantContext = (
    fieldName: string,
  ): Record<string, any> | undefined => {
    const values = form.getValues();
    if (
      fieldName === "name" ||
      fieldName === "description" ||
      fieldName === "instructions"
    ) {
      return {
        name: values.name || "",
        description: values.description || "",
        instructions: values.instructions || "",
      };
    }
    return undefined;
  };

  // Handle submission: Format data according to createAssistantSchema
  const handleSubmit = (internalValues: AddAssistantInternalValues) => {
    const tools: z.infer<typeof toolSchema>[] = [];
    if (internalValues.file_search) {
      tools.push({ type: "file_search" });
    }
    if (internalValues.code_interpreter) {
      tools.push({ type: "code_interpreter" });
    }

    const finalValues: AddAssistantFormSubmitValues = {
      name: internalValues.name,
      // Only include optional fields if they have a value
      ...(internalValues.description && {
        description: internalValues.description,
      }),
      ...(internalValues.instructions && {
        instructions: internalValues.instructions,
      }),
      ...(internalValues.model && { model: internalValues.model }), // Model is already a string
      temperature: internalValues.temperature,
      ...(tools.length > 0 && { tools: tools }), // Include tools only if some are selected
    };
    onSubmit(finalValues);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6" // Increased gap for better spacing
      >
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <AiEnabledTextarea
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="e.g., Learning Assistant"
                  availableTasks={getAvailableTasks("name")}
                  context={getAssistantContext("name")}
                />
              </FormControl>
              <FormDescription>
                A short, descriptive name for the assistant. (Max 50 chars)
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
                  placeholder="e.g., Handles user queries about flashcards."
                  availableTasks={getAvailableTasks("description")}
                  context={getAssistantContext("description")}
                />
              </FormControl>
              <FormDescription>
                A brief description of what the assistant does. (Optional, Max
                200 chars)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Instructions Field */}
        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <AiEnabledTextarea
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="e.g., Be friendly and professional."
                  availableTasks={getAvailableTasks("instructions")}
                  context={getAssistantContext("instructions")}
                />
              </FormControl>
              <FormDescription>
                System instructions for the assistant's behavior. (Optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Model Field */}
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., gpt-4o-mini"
                  {...field}
                  value={field.value ?? ""} // Ensure value is always string
                />
              </FormControl>
              <FormDescription>
                The ID of the model to use (e.g., gpt-4o-mini). Refer to OpenAI
                API'sdocumentation for available models. (Optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Temperature Field */}
        <FormField
          control={form.control}
          name="temperature"
          render={() => (
            <FormItem>
              <FormLabel>
                Temperature: {temperatureDisplayValue.toFixed(1)}
              </FormLabel>
              <FormControl>
                <Slider
                  value={[temperatureDisplayValue]}
                  onValueChange={(value) => setTemperatureDisplayValue(value[0])}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </FormControl>
              <FormDescription>
                Controls randomness (0=deterministic, 2=very random). Default is
                1.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tools Field */}
        <FormItem>
          <FormLabel>Tools</FormLabel>
          <FormDescription>Enable tools for the assistant.</FormDescription>
          <div className="space-y-2 pt-2">
            {/* File Search Switch */}
            <FormField
              control={form.control}
              name="file_search"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm gap-4">
                  <FormLabel
                    htmlFor="file_search_switch"
                    className="text-base font-normal"
                  >
                    File Search
                  </FormLabel>
                  <FormControl>
                    <Switch
                      id="file_search_switch"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {/* Code Interpreter Switch */}
            <FormField
              control={form.control}
              name="code_interpreter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm gap-4">
                  <FormLabel
                    htmlFor="code_interpreter_switch"
                    className="text-base font-normal"
                  >
                    Code Interpreter
                  </FormLabel>
                  <FormControl>
                    <Switch
                      id="code_interpreter_switch"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormMessage />
        </FormItem>

        <div className="flex items-center justify-end gap-2 pt-4">
          {" "}
          {/* Added padding top */}
          <Button type="submit">{submitLabel}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddAssistantForm;
