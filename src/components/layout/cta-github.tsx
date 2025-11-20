import React from 'react';
import { Button } from '@/components/ui/button';
import { IconBrandGithub } from '@tabler/icons-react';

export default function CtaGithub() {
  return (
    <Button variant='ghost' asChild size='sm' className='hidden sm:flex'>
      <a
        href='https://rinsr.in/'
        rel='noopener noreferrer'
        target='_blank'
        className='dark:text-foreground'
      >
        <img
          src='/assets/rinsr-logo1.png'
          alt='App Logo'
          width={42}
          height={42}
          className='rounded-lg object-cover'
        />
      </a>
    </Button>
  );
}
