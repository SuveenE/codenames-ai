import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { storeApiKey, getStoredApiKey, deleteApiKey } from "@/utils/encryption";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export default function ApiKeyDialog({
  open,
  onOpenChange,
  onSubmit,
}: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => {
    if (open) {
      const storedKey = getStoredApiKey();
      setHasStoredKey(!!storedKey);
      setApiKey(""); // Clear input when dialog opens
    }
  }, [open]);

  const handleSubmit = () => {
    if (!apiKey.trim()) return;
    storeApiKey(apiKey.trim());
    onSubmit();
  };

  const handleDelete = () => {
    deleteApiKey();
    setHasStoredKey(false);
    setApiKey("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-full">
        <DialogHeader>
          <DialogTitle>OpenAI API Key Settings</DialogTitle>
          <DialogDescription>
            {hasStoredKey
              ? "Update your stored API key or enter a new one."
              : "Enter your OpenAI API key to start playing."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            {hasStoredKey && (
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  API key is stored
                </div>
                <button
                  onClick={handleDelete}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                  Delete key
                </button>
              </div>
            )}
            <input
              type="password"
              placeholder={hasStoredKey ? "Enter new API key..." : "sk-..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
            <p className="text-xs text-gray-500">
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                OpenAI Dashboard
              </a>
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!apiKey.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50"
          >
            {hasStoredKey ? "Update" : "Save & Continue"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
