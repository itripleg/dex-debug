"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  increment,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  text: string;
  userAddress: string;
  tokenAddress: string;
  timestamp: {
    toDate: () => Date;
  } | null;
  likes: number;
}

interface ChatComponentProps {
  tokenAddress: string;
  creatorAddress?: string;
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export function ChatComponent({
  tokenAddress,
  creatorAddress,
  className,
  isMobile = false,
  onClose,
}: ChatComponentProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { address, isConnected } = useAccount();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!tokenAddress || !mounted) {
      return;
    }

    const q = query(
      collection(db, "comments"),
      where("tokenAddress", "==", tokenAddress),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedComments: Comment[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedComments.push({
            id: doc.id,
            text: data.text,
            userAddress: data.userAddress,
            tokenAddress: data.tokenAddress,
            timestamp: data.timestamp,
            likes: data.likes || 0,
          });
        });
        setComments(fetchedComments);
      },
      (error) => {
        console.error("Error fetching comments:", error);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress, mounted]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address || !newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      await addDoc(collection(db, "comments"), {
        text: newComment.trim(),
        userAddress: address,
        tokenAddress,
        timestamp: serverTimestamp(),
        likes: 0,
      });

      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!isConnected) return;

    const updatedComments = comments.map((comment) =>
      comment.id === commentId
        ? { ...comment, likes: (comment.likes || 0) + 1 }
        : comment
    );

    setComments(updatedComments);

    try {
      const commentRef = doc(db, "comments", commentId);
      await updateDoc(commentRef, {
        likes: increment(1),
      });
    } catch (error) {
      console.error("Failed to like comment:", error);
      setComments(comments);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn("w-full h-full flex flex-col", className)}>
        <Card className="h-full flex flex-col border-0 shadow-none bg-background/50">
          <CardHeader
            className={cn("flex-shrink-0 pb-3", isMobile && "px-4 pt-6")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Chat</CardTitle>
              {isMobile && onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-4">
            <div className="text-muted-foreground text-sm">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <Card className="h-full flex flex-col border-0 shadow-none bg-background">
        {/* Header */}
        <CardHeader
          className={cn("flex-shrink-0 pb-3 border-b", isMobile && "px-4 pt-6")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Chat
            </CardTitle>
            {isMobile && onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className={cn("space-y-3 p-4", isMobile && "px-4 py-3")}>
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-muted">
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${comment.userAddress}`}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {comment.userAddress.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-foreground truncate">
                          {`${comment.userAddress.slice(
                            0,
                            6
                          )}...${comment.userAddress.slice(-4)}`}
                        </span>

                        {creatorAddress &&
                          comment.userAddress.toLowerCase() ===
                            creatorAddress.toLowerCase() && (
                            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium">
                              dev
                            </span>
                          )}

                        <span className="text-xs text-muted-foreground">
                          {comment.timestamp?.toDate().toLocaleString() ||
                            "Just now"}
                        </span>
                      </div>

                      <div className="bg-muted/30 rounded-2xl rounded-tl-sm px-3 py-2 mb-2">
                        <p className="text-sm text-foreground break-words leading-relaxed">
                          {comment.text}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(comment.id)}
                        disabled={!isConnected}
                        className="h-6 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-2"
                      >
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        <span className="text-xs">{comment.likes || 0}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm">No comments yet</p>
                  <p className="text-xs text-muted-foreground/70">
                    Be the first to start the conversation!
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t bg-background">
            {isConnected ? (
              <form
                onSubmit={handleSubmitComment}
                className={cn("p-4", isMobile && "p-4 pb-6")}
              >
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type a message..."
                      disabled={isSubmitting}
                      className="pr-12 bg-muted/30 border-muted/50 focus:border-primary/50 rounded-full"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting || !newComment.trim()}
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? (
                        <div className="w-3 h-3 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className={cn("p-4 text-center", isMobile && "p-4 pb-6")}>
                <p className="text-sm text-muted-foreground mb-2">
                  Connect your wallet to join the conversation
                </p>
                <div className="text-xs text-muted-foreground/70">
                  💡 Share your thoughts about this token
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
