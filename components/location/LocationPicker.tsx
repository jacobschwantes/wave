'use client'

import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Button } from '../ui/button'
import { FormControl } from '../ui/form'
import { useFormContext } from 'react-hook-form'

type Location = {
  display_name: string
  lat: number
  lon: number
}

interface LocationPickerProps {
  name?: string
  onLocationSelect?: (lat: number, lng: number, displayName: string) => void
  disabled?: boolean
}

export default function LocationPicker({ name, onLocationSelect, disabled }: LocationPickerProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  // get form context safely
  const form = useFormContext()

  // search locations when input changes
  useEffect(() => {
    if (!search) {
      setResults([])
      return
    }

    // debounce search
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(search)}`)
        const data = await res.json()
        setResults(data)
      } catch (e) {
        console.error('Failed to search locations:', e)
        setResults([])
      }
      setLoading(false)
    }, 300)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [search])

  // add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setResults([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLocationSelect = (result: Location) => {
    if (form && name) {
      // if inside a form, use form setValue
      form.setValue(`${name}.lat`, Number(result.lat))
      form.setValue(`${name}.lng`, Number(result.lon))
      form.setValue(`${name}.display_name`, result.display_name)
    } else if (onLocationSelect) {
      // if not in form, use callback
      onLocationSelect(Number(result.lat), Number(result.lon), result.display_name)
    }
    setSearch(result.display_name)
    setResults([])
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        {form ? (
          <FormControl>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setIsOpen(true)
              }}
              placeholder="Search for a location..."
              disabled={disabled}
              className="w-full px-4 py-2 pl-10 rounded-md border focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 bg-white"
            />
          </FormControl>
        ) : (
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            placeholder="Search for a location..."
            disabled={disabled}
            className="w-full px-4 py-2 pl-10 rounded-md border focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 bg-white"
          />
        )}
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
      </div>

      {/* results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((result, i) => (
            <Button
              key={i}
              variant="ghost"
              onClick={() => handleLocationSelect(result)}
              className="w-full px-4 py-2 h-auto justify-start font-normal text-sm hover:bg-neutral-100"
            >
              {result.display_name}
            </Button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute z-10 w-full mt-1 p-2 bg-white border rounded-md shadow-lg text-center text-neutral-500 text-sm">
          Searching...
        </div>
      )}
    </div>
  )
} 