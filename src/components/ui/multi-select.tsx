'use client';

import * as React from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';

type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleSelect = (item: string) => {
    if (selected.includes(item)) {
      handleUnselect(item);
    } else {
      onChange([...selected, item]);
    }
    setInputValue('');
  };

  const selectedOptions = selected.map(
    (s) => options.find((o) => o.value === s) || { label: s, value: s }
  );

  return (
    <Command
      onKeyDown={(e) => {
        if (e.key === 'Backspace' && !inputValue) {
          e.preventDefault();
          if (selected.length > 0) {
            handleUnselect(selected[selected.length - 1]);
          }
        }
        if (e.key === 'Escape') {
          inputRef.current?.blur();
        }
      }}
      className={className}
    >
      <div className='group border-input ring-offset-background focus-within:ring-ring rounded-md border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-offset-2 focus-within:outline-none'>
        <div className='flex flex-wrap gap-1'>
          {selectedOptions.map((framework) => {
            return (
              <Badge key={framework.value} variant='secondary'>
                {framework.label}
                <button
                  className='ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUnselect(framework.value);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(framework.value)}
                >
                  <X className='text-muted-foreground hover:text-foreground h-3 w-3' />
                </button>
              </Badge>
            );
          })}
          {/* Avoid having the "Search" Input be too small */}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : ''}
            className='placeholder:text-muted-foreground ml-2 flex-1 bg-transparent outline-none'
          />
        </div>
      </div>
      <div className='relative mt-2'>
        {open && (
          <div className='bg-popover text-popover-foreground animate-in absolute top-0 z-10 w-full rounded-md border shadow-md outline-none'>
            <CommandList>
              {options.length > 0 ? (
                <CommandGroup className='h-full overflow-auto'>
                  {options.map((framework) => {
                    const isSelected = selected.includes(framework.value);
                    return (
                      <CommandItem
                        key={framework.value}
                        onSelect={() => {
                          handleSelect(framework.value);
                        }}
                        className={'cursor-pointer'}
                      >
                        <div
                          className={`border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50 [&_svg]:invisible'
                          }`}
                        >
                          <svg
                            className={'h-4 w-4'}
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={2}
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <polyline points='20 6 9 17 4 12' />
                          </svg>
                        </div>
                        <span>{framework.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : (
                <div className='py-6 text-center text-sm'>
                  No services found.
                </div>
              )}
            </CommandList>
          </div>
        )}
      </div>
    </Command>
  );
}
