import { useEffect } from "react";
import { DEFAULTS, useSiteSettings, type VisualSettings } from "@/lib/siteSettings";

const VARS: Record<
  keyof Pick<
    VisualSettings,
    | "primary_color"
    | "primary_foreground_color"
    | "background_color"
    | "surface_color"
    | "surface_2_color"
    | "text_color"
    | "muted_text_color"
    | "border_color"
  >,
  string[]
> = {
  primary_color: ["--primary", "--accent", "--ring"],
  primary_foreground_color: ["--primary-foreground", "--accent-foreground"],
  background_color: ["--background"],
  surface_color: ["--surface", "--card", "--popover"],
  surface_2_color: ["--surface-2", "--secondary", "--muted"],
  text_color: [
    "--foreground",
    "--card-foreground",
    "--popover-foreground",
    "--secondary-foreground",
  ],
  muted_text_color: ["--muted-foreground"],
  border_color: ["--border", "--input"],
};

function applyColor(root: HTMLElement, cssVars: string[], value: string) {
  const color = value?.trim();
  if (!color) return;
  cssVars.forEach((name) => root.style.setProperty(name, color));
}

export function SiteVisualSettings() {
  const { data } = useSiteSettings();
  const visual = data?.visual ?? DEFAULTS.visual;

  useEffect(() => {
    const root = document.documentElement;
    applyColor(root, VARS.primary_color, visual.primary_color);
    applyColor(root, VARS.primary_foreground_color, visual.primary_foreground_color);
    applyColor(root, VARS.background_color, visual.background_color);
    applyColor(root, VARS.surface_color, visual.surface_color);
    applyColor(root, VARS.surface_2_color, visual.surface_2_color);
    applyColor(root, VARS.text_color, visual.text_color);
    applyColor(root, VARS.muted_text_color, visual.muted_text_color);
    applyColor(root, VARS.border_color, visual.border_color);
  }, [visual]);

  return null;
}
