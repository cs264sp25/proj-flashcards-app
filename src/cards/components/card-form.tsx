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
import { AspectRatio } from "@/core/components/aspect-ratio";
import Markdown from "@/core/components/markdown";
import {
  formFields,
  formSchema,
  defaultValues,
} from "@/cards/config/form-config";
import { cn } from "@/core/lib/utils";
import AiEnabledTextarea from "@/ai/components/ai-enabled-textarea";
import { Task as TaskType } from "@/ai/types/tasks";

interface CardFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
  initialValues?: z.infer<typeof formSchema>;
  submitLabel?: string;
}

const CardForm: React.FC<CardFormProps> = ({
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
      case "front":
        return ["grammar", "improve", "frontToQuestion", "questionImprove"];
      case "back":
        return [
          "grammar",
          "improve",
          "shorten",
          "lengthen",
          "answerConcise",
          "answerComprehensive",
          "answerStructure",
        ];
      default:
        return ["grammar", "improve", "shorten", "lengthen"];
    }
  };

  // Get the current form values for context
  const getCardContext = (
    fieldName: string,
  ): Record<string, any> | undefined => {
    const values = form.getValues();
    if (fieldName === "front" || fieldName === "back") {
      return {
        front: values.front || "",
        back: values.back || "",
      };
    }
    return undefined;
  };

  function handleTab(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    fieldProps: {
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    },
  ) {
    e.preventDefault();
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const newValue = value.substring(0, start) + "  " + value.substring(end);

    // Create a synthetic change event
    const changeEvent = {
      target: {
        value: newValue,
      },
    } as React.ChangeEvent<HTMLTextAreaElement>;

    fieldProps.onChange(changeEvent);

    // Set cursor position after the change
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }, 0);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {formFields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: fieldProps }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormDescription>{field.description}</FormDescription>
                <FormControl>
                  <div className="flex flex-col gap-2">
                    <AiEnabledTextarea
                      {...fieldProps}
                      value={fieldProps.value ?? ""}
                      placeholder={field.description}
                      availableTasks={getAvailableTasks(field.name)}
                      context={getCardContext(field.name)}
                      onKeyDown={(e) => {
                        if (e.key === "Tab") {
                          handleTab(e, fieldProps);
                        }
                      }}
                    />
                    <div className="text-[0.8rem] text-muted-foreground">
                      Preview
                    </div>
                    <AspectRatio
                      ratio={16 / 9}
                      className={cn(
                        "w-full border rounded-xl p-2",
                        "hover:bg-secondary",
                      )}
                    >
                      <div className="flex flex-col h-full overflow-hidden">
                        <div className={cn("flex-1 p-1 overflow-auto")}>
                          <Markdown content={fieldProps.value} />
                        </div>
                      </div>
                    </AspectRatio>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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

export default CardForm;
