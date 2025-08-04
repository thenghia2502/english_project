"use client"

import { useEffect } from 'react'

interface NoCopyWrapperProps {
  children: React.ReactNode
}

export default function NoCopyWrapper({ children }: NoCopyWrapperProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable common copy/paste shortcuts
      if (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.contentEditable) {
          e.preventDefault()
          return false
        }
      }
      
      // Disable developer tools shortcuts
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u')) {
        e.preventDefault()
        return false
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.contentEditable) {
        e.preventDefault()
        return false
      }
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('selectstart', handleSelectStart)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('selectstart', handleSelectStart)
    }
  }, [])

  return (
    <div 
      className="select-none"
      style={{ 
        userSelect: 'none', 
        WebkitUserSelect: 'none', 
        MozUserSelect: 'none', 
        msUserSelect: 'none' 
      }}
    >
      {children}
    </div>
  )
}
