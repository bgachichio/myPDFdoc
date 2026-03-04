import React from 'react'
import { Heart, Coffee } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-100 py-4 px-6 shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-500 flex items-center gap-1.5 flex-wrap justify-center">
          Made with{' '}
          <Heart size={13} className="text-red-500 fill-red-500 shrink-0" />
          {' '}by{' '}
          <a
            href="https://www.linkedin.com/in/briangachichio/"
            target="_blank" rel="noopener noreferrer"
            className="font-semibold text-gray-700 hover:text-brand transition-colors"
          >
            Brian Gachichio
          </a>
        </p>
        <a
          href="https://paystack.shop/pay/gachichio"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-gray-200
                     text-sm font-semibold text-gray-600
                     hover:border-brand hover:text-brand hover:bg-brand-50
                     transition-all duration-150 shadow-sm shrink-0"
        >
          <Coffee size={14} className="shrink-0" />
          ☕ Support
        </a>
      </div>
    </footer>
  )
}
