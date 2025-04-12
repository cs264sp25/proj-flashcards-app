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
import { createCardSchema } from "@/cards/types/card"; // Use card schema
import { cn } from "@/core/lib/utils";
import AiEnabledTextarea from "@/ai/components/ai-enabled-textarea";
import { Task as TaskType } from "@/ai/types/tasks";

// Schema and type for this form
const addCardFormSchema = createCardSchema;
type AddCardFormValues = z.infer<typeof addCardFormSchema>;

interface AddCardFormProps {
  onSubmit: (values: AddCardFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

const AddCardForm: React.FC<AddCardFormProps> = ({
  onSubmit,
  onCancel,
  submitLabel = "Create Card",
}) => {
  const form = useForm<AddCardFormValues>({
    resolver: zodResolver(addCardFormSchema),
    defaultValues: {
      front: "",
      back: "",
    },
  });

  // Define available tasks for each field
  const getAvailableTasks = (fieldName: "front" | "back"): TaskType[] => {
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
        return []; // Should not happen for card forms
    }
  };

  // Get the current form values for context
  const getCardContext = (
    fieldName: "front" | "back",
  ): Record<string, string> | undefined => {
    const values = form.getValues();
    if (fieldName === "front" || fieldName === "back") {
      return {
        front: values.front || "",
        back: values.back || "",
      };
    }
    return undefined;
  };

  // Handle tab key for indentation
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

    const changeEvent = {
      target: { value: newValue },
    } as React.ChangeEvent<HTMLTextAreaElement>;
    fieldProps.onChange(changeEvent);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }, 0);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)} // Use onSubmit directly
        className="flex flex-col gap-4"
      >
        {/* Front Field */}
        <FormField
          control={form.control}
          name="front"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Front</FormLabel>
              <FormDescription>
                Enter the content for the front of the card. (Markdown & LaTeX
                supported)
              </FormDescription>
              <FormControl>
                <div className="flex flex-col gap-2">
                  <AiEnabledTextarea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Card front..."
                    availableTasks={getAvailableTasks("front")}
                    context={getCardContext("front")}
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        handleTab(e, field);
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
                        <Markdown content={field.value} />
                      </div>
                    </div>
                  </AspectRatio>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Back Field */}
        <FormField
          control={form.control}
          name="back"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Back</FormLabel>
              <FormDescription>
                Enter the content for the back of the card. (Markdown & LaTeX
                supported)
              </FormDescription>
              <FormControl>
                <div className="flex flex-col gap-2">
                  <AiEnabledTextarea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Card back..."
                    availableTasks={getAvailableTasks("back")}
                    context={getCardContext("back")}
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        handleTab(e, field);
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
                        <Markdown content={field.value} />
                      </div>
                    </div>
                  </AspectRatio>
                </div>
              </FormControl>
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

export default AddCardForm;
