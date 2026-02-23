"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useColorMode } from "@/hooks/use-color-mode";

export function DarkModeSwitcher() {
  const [colorMode, setColorMode] = useColorMode();
  const isDark = colorMode === "dark";

  const toggle = useCallback(() => {
    const newMode = isDark ? "light" : "dark";
    setColorMode(newMode);
    toast.success(`Switched to ${newMode} mode`);
  }, [isDark, setColorMode]);

  // Keyboard shortcut: Ctrl + Shift + X
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.code === "KeyX") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Switch
            checked={isDark}
            size="lg"
            onCheckedChange={(checked) => {
              setColorMode(checked ? "dark" : "light");
              toast.success(`Switched to ${checked ? "dark" : "light"} mode`);
            }}
            className="border-2 border-border hover:border-muted-foreground/40"
            thumbContent={
              isDark ? (
                <Moon className="size-3 text-muted-foreground" />
              ) : (
                <Sun className="size-3 text-primary" />
              )
            }
          />
        }
      />
      <TooltipContent side="bottom">
        Switch to {isDark ? "light" : "dark"} mode (Ctrl+Shift+X)
      </TooltipContent>
    </Tooltip>
  );
}
