'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function MobileDrawer({ isOpen, onClose, children }: MobileDrawerProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden animate-fade-in transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-full max-w-xs glass-dark transform transition-transform duration-300 ease-out z-40 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isOpen ? 'animate-slide-in-left' : ''}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="text-lg font-semibold text-foreground">Menu</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors hover-lift"
          >
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-73px)]">
          {children}
        </div>
      </div>
    </>
  )
}
