import { brandIcon } from "@/lib/icon";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return brandIcon(size.width, { rounded: true });
}
