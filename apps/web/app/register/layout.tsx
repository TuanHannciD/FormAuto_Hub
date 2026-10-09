import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
