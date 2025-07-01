import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const OuijaSearch = ({ onOuijaInput }: any) => {
  const [inputValue, setInputValue] = useState("");
  const [lastKey, setLastKey] = useState("");

  const handleInput = (e: any) => {
    const value = e.target.value;
    setInputValue(value);

    // Get the last key pressed
    const newKey = value.slice(-1).toLowerCase();
    if (newKey !== lastKey) {
      setLastKey(newKey);
      if (onOuijaInput) {
        onOuijaInput(newKey);
      }
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setInputValue("");
    setLastKey("");
    if (onOuijaInput) {
      onOuijaInput("submit");
    }
  };

  const handleClear = () => {
    setInputValue("");
    setLastKey("");
    if (onOuijaInput) {
      onOuijaInput("clear");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-8 ">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Ask the spirits..."
            value={inputValue}
            onChange={handleInput}
            className="w-full pl-4 pr-4 py-2 border rounded-lg bg-background"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          className="px-4"
        >
          Clear
        </Button>
        <Button type="submit" className="px-4">
          Ask
        </Button>
      </div>
    </form>
  );
};
