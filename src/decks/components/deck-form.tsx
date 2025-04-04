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
import {
  formFields,
  formSchema,
  defaultValues,
} from "@/decks/config/form-config";
import AiEnabledTextarea from "@/ai/components/ai-enabled-textarea";
import { Task as TaskType } from "@/ai/types/tasks";

interface DeckFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
  initialValues?: z.infer<typeof formSchema>;
  submitLabel?: string;
}

const DeckForm: React.FC<DeckFormProps> = ({
  onSubmit,
  onCancel,
  initialValues = defaultValues,
  submitLabel = "Submit",
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  // Define available tasks for each field
  const getAvailableTasks = (fieldName: string): TaskType[] => {
    switch (fieldName) {
      case "title":
        return ["grammar", "improve", "shorten"];
      case "description":
        return ["grammar", "improve", "shorten", "lengthen", "simplify"];
      default:
        return []; // No tasks for tags yet
    }
  };

  // Get the current form values for context (optional for now)
  const getDeckContext = (
    fieldName: string,
  ): Record<string, any> | undefined => {
    const values = form.getValues();
    if (fieldName === "title" || fieldName === "description") {
      return {
        title: values.title || "",
        description: values.description || "",
      };
    }
    return undefined;
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert tags string to array if it exists
    const processedValues = {
      ...values,
      tags: values.tags
        ? values.tags.map((tag) => tag.trim()).filter(Boolean)
        : [],
    };
    onSubmit(processedValues);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4"
      >
        {formFields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: fieldProps }) => {
              const renderInput = () => {
                switch (field.name) {
                  case "title":
                  case "description":
                    return (
                      <AiEnabledTextarea
                        value={(fieldProps.value as string) ?? ""}
                        onChange={fieldProps.onChange}
                        placeholder={field.placeholder}
                        availableTasks={getAvailableTasks(field.name)}
                        context={getDeckContext(field.name)}
                      />
                    );
                  case "tags":
                    return (
                      <Input
                        placeholder={field.placeholder}
                        value={
                          Array.isArray(fieldProps.value)
                            ? fieldProps.value.join(", ")
                            : ""
                        }
                        onChange={(e) => {
                          const tags = e.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean);
                          fieldProps.onChange(tags);
                        }}
                        onBlur={fieldProps.onBlur}
                        name={fieldProps.name}
                        ref={fieldProps.ref}
                      />
                    );
                  default:
                    return (
                      <Input
                        placeholder={field.placeholder}
                        {...fieldProps}
                        value={(fieldProps.value as string) ?? ""}
                      />
                    );
                }
              };

              return (
                <FormItem>
                  <FormLabel>{field.label}</FormLabel>
                  <FormControl>{renderInput()}</FormControl>
                  <FormDescription>{field.description}</FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        ))}
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

export default DeckForm;
