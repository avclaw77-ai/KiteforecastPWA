import { useEffect } from 'react'

interface Props {
  message: string
  onDone:  () => void
}

export function Toast({ message, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="add-spot-toast">
      <span className="add-spot-toast-icon">✓</span>
      {message}
    </div>
  )
}
