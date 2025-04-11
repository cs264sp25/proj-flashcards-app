import { Id } from "@convex-generated/dataModel";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/core/components/select";
import { cn } from "@/core/lib/utils";

import { useQueryAssistants } from "@/assistants/hooks/use-query-assistants";

interface AssistantDropdownProps {
  value: Id<"assistants"> | undefined;
  onChange: (value: Id<"assistants">) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
}

const AssistantDropdown: React.FC<AssistantDropdownProps> = ({
  value,
  onChange,
  className = "",
  disabled = false,
}) => {
  const { data: assistants, loading, error } = useQueryAssistants();

  const handleChange = async (newValue: string) => {
    await onChange(newValue as Id<"assistants">);
  };

  return (
    <Select
      value={value}
      onValueChange={handleChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className={cn("w-fit", className)}>
        <SelectValue placeholder="Select an assistant" />
      </SelectTrigger>
      <SelectContent>
        {loading && (
          <SelectItem value="loading" disabled>
            Loading...
          </SelectItem>
        )}
        {error && (
          <SelectItem value="error" disabled>
            Error loading assistants
          </SelectItem>
        )}
        {assistants?.map((assistant) => (
          <SelectItem key={assistant._id} value={assistant._id}>
            {assistant.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AssistantDropdown;
