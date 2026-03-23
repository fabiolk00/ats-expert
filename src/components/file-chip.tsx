import { X, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileChipProps {
  filename: string
  onRemove: () => void
  className?: string
}

export default function FileChip({ filename, onRemove, className }: FileChipProps) {
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-2 bg-muted text-foreground text-sm px-3 py-1.5 rounded-full",
        className
      )}
    >
      <FileText className="h-4 w-4 text-muted-foreground" />
      <span className="truncate max-w-[200px]">{filename}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Remover arquivo"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
