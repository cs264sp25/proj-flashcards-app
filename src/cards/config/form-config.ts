import { z } from "zod";

import { createCardSchema } from "@/cards/types/card";

export const formSchema = createCardSchema;

export interface FormFieldConfig {
  name: keyof z.infer<typeof formSchema>;
  label: string;
  placeholder?: string;
  description?: string;
  type: "text" | "textarea";
}

export const formFields: FormFieldConfig[] = [
  {
    name: "front",
    label: "Front",
    placeholder: "Card front...",
    description:
      "Enter the content to display on the front of the card. (GitHub-flavored markdown and LaTeX-style math supported)",
    type: "textarea",
  },
  {
    name: "back",
    label: "Back",
    placeholder: "Card back...",
    description:
      "Enter the content to display on the back of the card. (GitHub-flavored markdown and LaTeX-style math supported)",
    type: "textarea",
  },
];

export const defaultValues = {
  front: "",
  back: "",
};
