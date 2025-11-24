'use client'

import { LaptopIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { useTheme } from 'next-themes'

import { MenubarRadioGroup, MenubarRadioItem } from '@/components/ui/menubar'

export function MenuModeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <MenubarRadioGroup value={theme}>
      <MenubarRadioItem value="light" onClick={() => setTheme('light')}>
        <SunIcon className="mr-2 h-4 w-4" />
        <span>Light</span>
      </MenubarRadioItem>
      <MenubarRadioItem value="dark" onClick={() => setTheme('dark')}>
        <MoonIcon className="mr-2 h-4 w-4" />
        <span>Dark</span>
      </MenubarRadioItem>
      <MenubarRadioItem value="system" onClick={() => setTheme('system')}>
        <LaptopIcon className="mr-2 h-4 w-4" />
        <span>System</span>
      </MenubarRadioItem>
    </MenubarRadioGroup>
  )
}
