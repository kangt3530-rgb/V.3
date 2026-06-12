import type { AnnotationTag } from "../../api/types";

export const TAG_CONFIG: Record<AnnotationTag, { icon: string; label: string; cls: string }> = {
  action_item: { icon: "add_task", label: "Action Item", cls: "text-secondary" },
  quick_fix:   { icon: "bolt",     label: "Quick Fix",   cls: "text-primary" },
};
