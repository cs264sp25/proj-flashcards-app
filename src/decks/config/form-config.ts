import { z } from "zod";

import { createDeckSchema } from "@/decks/types/deck";

export const formSchema = createDeckSchema;

export interface FormFieldConfig {
  name: keyof z.infer<typeof formSchema>;
  label: string;
  placeholder?: string;
  description?: string;
  type: "text" | "textarea" | "tags";
}

export const formFields: FormFieldConfig[] = [
  {
    name: "title",
    label: "Title",
    placeholder: "Deck title",
    description: "Keep the title short and descriptive. (Limit 50 characters)",
    type: "text",
  },
  {
    name: "description",
    label: "Description",
    placeholder: "Deck description",
    description:
      "You can add a brief description for your deck. (Limit 200 characters)",
    type: "textarea",
  },
  {
    name: "tags",
    label: "Tags",
    placeholder: "Add tags",
    description: "Add tags (comma separated) to help organize your deck.",
    type: "tags",
  },
];

export const defaultValues = {
  title: "",
  description: undefined,
  tags: [],
};
