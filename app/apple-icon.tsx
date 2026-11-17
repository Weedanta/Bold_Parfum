import { brandIcon } from "@/lib/icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS membulatkan sendiri, jadi sudut dibiarkan persegi.
export default function AppleIcon() {
  return brandIcon(size.width);
}
