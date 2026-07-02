import { useState } from "react";

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, message: string) => void;
}

export function WarningModal({ isOpen, onClose, onSubmit }: WarningModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    onSubmit(title, message);
    setTitle("");
    setMessage("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background text-foreground w-full max-w-md rounded-lg shadow-lg overflow-hidden border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold">Send Warning</h2>
          <p className="text-sm text-muted-foreground mt-1">Send a direct warning notification to this user.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Inappropriate Behavior"
              className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">Description</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain the reason for the warning..."
              rows={4}
              className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-input bg-background hover:bg-muted text-foreground rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:opacity-90 rounded-md"
            >
              Send Warning
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
