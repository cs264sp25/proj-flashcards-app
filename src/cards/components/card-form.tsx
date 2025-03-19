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
import { Textarea } from "@/core/components/textarea";
import { AspectRatio } from "@/core/components/aspect-ratio";
import Markdown from "@/core/components/markdown";
import {
  formFields,
  formSchema,
  defaultValues,
} from "@/cards/config/form-config";
import { cn } from "@/core/lib/utils";

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

  function handleTab(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    // eslint-disable-next-line
    fieldProps: any,
  ) {
    e.preventDefault();
    const { selectionStart, selectionEnd, value } =
      e.target as HTMLTextAreaElement;
    const newValue =
      value.substring(0, selectionStart) + "  " + value.substring(selectionEnd);
    (e.target as HTMLTextAreaElement).value = newValue;
    (e.target as HTMLTextAreaElement).selectionStart = (
      e.target as HTMLTextAreaElement
    ).selectionEnd = selectionStart + 2;
    fieldProps.onChange(e);
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
                    <Textarea
                      {...fieldProps}
                      value={fieldProps.value ?? ""}
                      rows={10}
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
                      <Markdown content={fieldProps.value} />
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
