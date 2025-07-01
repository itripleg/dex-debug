"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ChatComponent } from "./ChatComponent";
import { cn } from "@/lib/utils";

interface MobileChatModalProps {
  tokenAddress: string;
  creatorAddress?: string;
}

export function MobileChatModal({
  tokenAddress,
  creatorAddress,
}: MobileChatModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 z-40 h-12 w-12 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-200 hover:scale-105 active:scale-95",
          "border-2 border-background/10"
        )}
        style={{ right: "12px" }} // 16px - 2px = 14px (right-4 is 16px)
        size="icon"
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      {/* Chat Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className={cn(
            "p-0 gap-0 max-w-full max-h-full",
            "sm:max-w-md sm:max-h-[80vh] sm:rounded-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-bottom-48 data-[state=open]:slide-in-from-bottom-48",
            // Mobile full screen
            "h-screen w-screen rounded-none",
            "sm:h-auto sm:w-auto",
            // Hide the default close button
            "[&>button]:hidden"
          )}
          style={{
            // Ensure proper mobile viewport handling
            height: "100dvh",
          }}
        >
          <DialogTitle className="sr-only">
            Chat for token {tokenAddress}
          </DialogTitle>

          <div className="h-full flex flex-col">
            <ChatComponent
              tokenAddress={tokenAddress}
              creatorAddress={creatorAddress}
              isMobile={true}
              onClose={() => setIsOpen(false)}
              className="h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
