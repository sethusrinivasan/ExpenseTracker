import { AlertCircle } from "lucide-react"

interface DbErrorProps {
  message: string
}

export function DbError({ message }: DbErrorProps) {
  return (
    <div className="flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-destructive animate-fade-in">
      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold text-sm">Database unavailable</p>
        <p className="text-sm mt-1 text-destructive/80">{message}</p>
      </div>
    </div>
  )
}
