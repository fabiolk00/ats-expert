/**
 * Simple markdown renderer for basic formatting.
 * Handles: **bold**, numbered lists, line breaks
 * Used for welcome message and other simple formatted text.
 */

export function renderSimpleMarkdown(text: string): JSX.Element {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []

  lines.forEach((line, index) => {
    // Handle bold text **word**
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    const boldRegex = /\*\*(.*?)\*\*/g
    let match

    while ((match = boldRegex.exec(line)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index))
      }
      // Add bold text
      parts.push(
        <strong key={`bold-${index}-${match.index}`} className="font-semibold">
          {match[1]}
        </strong>
      )
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex))
    }

    // If no bold found, just use the line
    if (parts.length === 0) {
      parts.push(line)
    }

    // Wrap in appropriate element
    if (line.trim().length === 0) {
      // Empty line - add spacing
      elements.push(<br key={`br-${index}`} />)
    } else {
      elements.push(
        <span key={`line-${index}`} className="block">
          {parts}
        </span>
      )
    }
  })

  return <div className="space-y-1">{elements}</div>
}
