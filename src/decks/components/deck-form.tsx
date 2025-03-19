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
import { Textarea } from "@/core/components/textarea";

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

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert tags string to array if it exists
    const processedValues = {
      ...values,
      tags: values.tags ? values.tags.map(tag => tag.trim()).filter(Boolean) : [],
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
            render={({ field: fieldProps }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  {field.type === "textarea" ? (
                    <Textarea
                      {...fieldProps}
                      value={fieldProps.value ?? ""}
                      rows={5}
                    />
                  ) : field.type === "tags" ? (
                    <Input
                      placeholder={field.placeholder}
                      {...fieldProps}
                      value={Array.isArray(fieldProps.value) ? fieldProps.value.join(", ") : ""}
                      onChange={(e) => {
                        const tags = e.target.value.split(",").map(tag => tag.trim());
                        fieldProps.onChange(tags);
                      }}
                    />
                  ) : (
                    <Input
                      placeholder={field.placeholder}
                      {...fieldProps}
                      value={fieldProps.value ?? ""}
                    />
                  )}
                </FormControl>
                <FormDescription>{field.description}</FormDescription>
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

export default DeckForm;
