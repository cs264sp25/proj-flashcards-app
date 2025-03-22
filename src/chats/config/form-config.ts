import { z } from "zod";

import { createChatSchema } from "@/chats/types/chat";

export const formSchema = createChatSchema;

export type FormField = {
  name: keyof z.infer<typeof formSchema>;
  label: string;
  placeholder?: string;
  description?: string;
  type: "text" | "textarea" | "tags";
};

export const formFields: FormField[] = [
  {
    name: "title",
    label: "Title",
    placeholder: "Chat title",
    description: "Keep the title short and descriptive. (Limit 50 characters)",
    type: "text",
  },
  {
    name: "description",
    label: "Description",
    placeholder: "Chat description",
    description:
      "You can add a brief description for your chat. (Limit 200 characters)",
    type: "textarea",
  },
  {
    name: "tags",
    label: "Tags",
    placeholder: "Add tags",
    description: "Add tags (comma separated) to help organize your chat.",
    type: "tags",
  },
];

export const defaultValues: z.infer<typeof formSchema> = {
  title: "",
  description: undefined,
  tags: [],
};
