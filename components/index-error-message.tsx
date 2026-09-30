import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ExternalLink } from "lucide-react"

interface IndexErrorMessageProps {
  message: string
  indexUrl?: string
}

export function IndexErrorMessage({ message, indexUrl }: IndexErrorMessageProps) {
  return (
    <Alert variant="warning" className="mb-4">
      <AlertTitle>Performance Notice</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>{message}</p>
        {indexUrl && (
          <a
            href={indexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm font-medium text-blue-600 hover:underline"
          >
            Create Firestore Index
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        )}
      </AlertDescription>
    </Alert>
  )
}
