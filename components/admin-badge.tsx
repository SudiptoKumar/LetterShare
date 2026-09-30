import { ShieldCheck } from "lucide-react"

export function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-medium px-2 py-0.5 rounded-full ml-2">
      <ShieldCheck className="h-3 w-3" />
      Admin
    </span>
  )
}
