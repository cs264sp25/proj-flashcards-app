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

// --- Internal Form Schema and Type (Handles form state) ---
const editAssistantInternalSchema = createAssistantSchema
  .omit({ tools: true, temperature: true, model: true })
  .extend({
    model: z.string().optional(),
    temperature: z.preprocess(
      (val) => (Array.isArray(val) && val.length > 0 ? val[0] : val),
      z.number().min(0).max(2).optional().default(1),
    ),
    file_search: z.boolean().optional().default(false),
    code_interpreter: z.boolean().optional().default(false),
  });

type EditAssistantInternalValues = z.infer<typeof editAssistantInternalSchema>;
// --- External onSubmit Type (Matches API expectation) ---
type EditAssistantFormSubmitValues = z.infer<typeof createAssistantSchema>;
// --- Initial Values Prop Type (Data structure passed to the form) ---
type EditAssistantFormInitialValues = z.infer<typeof createAssistantSchema>;

interface EditAssistantFormProps {
  onSubmit: (values: EditAssistantFormSubmitValues) => void;
  onCancel: () => void;
  initialValues: EditAssistantFormInitialValues;
  submitLabel?: string;
  assistantId: string;
}

// Helper to convert initial data (including tools array) to internal form state
const getInitialFormValues = (
  initialValues: EditAssistantFormInitialValues,
): EditAssistantInternalValues => {
  return {
    name: initialValues.name || "",
    description: initialValues.description || "",
    instructions: initialValues.instructions || "",
    model: initialValues.model || "gpt-4o-mini", // Default model if not present
    temperature: initialValues.temperature ?? 1, // Default temperature if not present
    file_search:
      initialValues.tools?.some((t) => t.type === "file_search") ?? false,
    code_interpreter:
      initialValues.tools?.some((t) => t.type === "code_interpreter") ?? false,
  };
};

const EditAssistantForm: React.FC<EditAssistantFormProps> = ({
  onSubmit,
  onCancel,
  initialValues,
  submitLabel = "Save Changes",
  assistantId,
}) => {
  const form = useForm<EditAssistantInternalValues>({
    resolver: zodResolver(editAssistantInternalSchema),
    defaultValues: getInitialFormValues(initialValues),
  });

  // Reset form if initialValues change externally
  useEffect(() => {
    form.reset(getInitialFormValues(initialValues));
  }, [initialValues, form]);

  // State for temperature slider display
  const [temperatureDisplayValue, setTemperatureDisplayValue] =
    useState<number>(form.getValues("temperature") ?? 1);

  // Sync slider display -> form state
  useEffect(() => {
    if (form.getValues("temperature") !== temperatureDisplayValue) {
      form.setValue("temperature", temperatureDisplayValue, {
        shouldValidate: true,
      });
    }
  }, [temperatureDisplayValue, form]);

  // Sync form state -> slider display (needed if form is reset)
  useEffect(() => {
    const currentTemp = form.getValues("temperature");
    if (currentTemp !== undefined && currentTemp !== temperatureDisplayValue) {
      setTemperatureDisplayValue(currentTemp);
    }
    // Watch the form value directly
  }, [form.watch("temperature")]);

  // --- AI Task Logic ---
  const getAvailableTasks = (fieldName: string): TaskType[] => {
    switch (fieldName) {
      case "name":
        return ["grammar", "improve", "shorten"];
      case "description":
      case "instructions":
        return ["grammar", "improve", "shorten", "lengthen", "simplify"];
      // Add assistant-specific AI tasks here if needed
      default:
        return [];
    }
  };

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
        assistantId,
        name: values.name || "",
        description: values.description || "",
        instructions: values.instructions || "",
      };
    }
    return undefined;
  };
  // --- End AI Task Logic ---

  // Handle submission: Format data according to createAssistantSchema
  const handleSubmit = (internalValues: EditAssistantInternalValues) => {
    const tools: z.infer<typeof toolSchema>[] = [];
    if (internalValues.file_search) {
      tools.push({ type: "file_search" });
    }
    if (internalValues.code_interpreter) {
      tools.push({ type: "code_interpreter" });
    }

    const finalValues: EditAssistantFormSubmitValues = {
      name: internalValues.name,
      ...(internalValues.description && {
        description: internalValues.description,
      }),
      ...(internalValues.instructions && {
        instructions: internalValues.instructions,
      }),
      ...(internalValues.model && { model: internalValues.model }),
      temperature: internalValues.temperature,
      ...(tools.length > 0 && { tools: tools }),
    };
    onSubmit(finalValues);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
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
                  // Consider using Textarea if AiEnabledTextarea doesn't support rows
                  // rows={5}
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
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                The ID of the model to use (e.g., gpt-4o-mini). Refer to OpenAI
                API's documentation for available models. (Optional)
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
          <Button type="submit">{submitLabel}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditAssistantForm;
