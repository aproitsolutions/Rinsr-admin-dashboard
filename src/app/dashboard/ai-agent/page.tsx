'use client';

import PageContainer from '@/components/layout/page-container';
import { Bot, Sparkles } from 'lucide-react';

export default function AIAgentPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex min-h-[calc(100vh-200px)] flex-1 flex-col items-center justify-center p-6'>
        <div className='max-w-md space-y-6 text-center'>
          {/* Icon */}
          <div className='flex justify-center'>
            <div className='relative'>
              <div className='absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-50 blur-xl'></div>
              <div className='relative rounded-full bg-gradient-to-r from-purple-600 to-blue-600 p-6'>
                <Bot className='h-16 w-16 text-white' />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className='space-y-2'>
            <h1 className='bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-4xl font-bold text-transparent'>
              AI Agent
            </h1>
            <div className='flex items-center justify-center gap-2'>
              <Sparkles className='h-5 w-5 animate-pulse text-yellow-500' />
              <p className='text-muted-foreground text-2xl font-semibold'>
                Coming Soon
              </p>
              <Sparkles className='h-5 w-5 animate-pulse text-yellow-500' />
            </div>
          </div>

          {/* Description */}
          <p className='text-muted-foreground text-lg'>
            We're building something amazing! Our AI-powered agent will help you
            automate tasks, analyze data, and make smarter decisions.
          </p>

          {/* Features Preview */}
          <div className='bg-muted/30 border-border mt-8 space-y-3 rounded-lg border p-6 text-left'>
            <p className='mb-4 text-center text-sm font-semibold'>
              What to expect:
            </p>
            <div className='text-muted-foreground space-y-2 text-sm'>
              <div className='flex items-start gap-2'>
                <span className='mt-1 text-green-500'>✓</span>
                <span>Intelligent order processing and recommendations</span>
              </div>
              <div className='flex items-start gap-2'>
                <span className='mt-1 text-green-500'>✓</span>
                <span>Automated customer support responses</span>
              </div>
              <div className='flex items-start gap-2'>
                <span className='mt-1 text-green-500'>✓</span>
                <span>Predictive analytics and insights</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className='inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400'>
            <div className='h-2 w-2 animate-pulse rounded-full bg-purple-500'></div>
            In Development
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
