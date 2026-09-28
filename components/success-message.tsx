import { CheckCircle } from "lucide-react"

interface SuccessMessageProps {
  message: string
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  return (
    <div className="success-message">
      <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
      {message}
    </div>
  )
}
