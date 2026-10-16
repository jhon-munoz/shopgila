import type { ReactNode } from 'react'

interface NoDataPromptProps {
  title: string
  message?: string
  action?: ReactNode
}

function NoDataPrompt({ title, message, action }: NoDataPromptProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {message && <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default NoDataPrompt
