import { useState } from "react";
import { Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/dialog";
import { Button } from "@/core/components/button";
import { Input } from "@/core/components/input";
import { DropdownMenuItem } from "@/core/components/dropdown-menu";
import { Task } from "../types/tasks";

interface CustomPromptDialogProps {
  setDropdownOpen: (open: boolean) => void;
  onTaskSelect: (task: Task, customPrompt?: string) => void;
}

export const CustomPromptDialog = ({
  setDropdownOpen,
  onTaskSelect,
}: CustomPromptDialogProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsDialogOpen(false);
      setDropdownOpen(false);
    }
  };

  const handleApply = () => {
    if (!customPrompt.trim()) return;

    onTaskSelect("custom", customPrompt);

    setIsDialogOpen(false);
    setDropdownOpen(false);
    setCustomPrompt("");
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setDropdownOpen(false);
    setCustomPrompt("");
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setIsDialogOpen(true);
            setDropdownOpen(true);
          }}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Custom Prompt
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom AI Prompt</DialogTitle>
          <DialogDescription>
            Enter your custom instructions for the AI.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Example: Make this text funnier and add emojis"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!customPrompt.trim()}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
