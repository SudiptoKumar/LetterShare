import { ShieldCheck, Shield, Award } from "lucide-react"

interface RoleBadgeProps {
  role: "admin" | "letter-share" | "moderator" | string
  size?: "sm" | "md" | "lg"
}

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  // Determine badge style based on role
  let bgColor = "bg-violet-100"
  let textColor = "text-violet-700"
  let Icon = ShieldCheck
  let label = "Admin"

  // Size classes
  const sizeClasses = {
    sm: "text-xs py-0.5 px-1.5",
    md: "text-xs py-0.5 px-2",
    lg: "text-sm py-1 px-2.5",
  }

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }

  // Customize based on role
  switch (role.toLowerCase()) {
    case "letter-share":
      bgColor = "bg-purple-100"
      textColor = "text-purple-700"
      Icon = Award
      label = "Letter Share"
      break
    case "moderator":
      bgColor = "bg-blue-100"
      textColor = "text-blue-700"
      Icon = Shield
      label = "Moderator"
      break
    // Default is admin
  }

  return (
    <span
      className={`inline-flex items-center gap-1 ${bgColor} ${textColor} font-medium rounded-full ml-2 ${sizeClasses[size]}`}
    >
      <Icon className={iconSizes[size]} />
      {label}
    </span>
  )
}
