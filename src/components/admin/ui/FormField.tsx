'use client'

import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  children: ReactNode
  hint?: string
}

export function FormField({ label, required, children, hint }: FormFieldProps) {
  return (
    <div className="ff-group">
      <label className="ff-label">
        {label}{required && ' *'}
      </label>
      {children}
      {hint && <div className="ff-hint">{hint}</div>}

      <style jsx>{`
        .ff-group {
          margin-bottom: 16px;
        }
        .ff-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: var(--muted);
          font-size: 14px;
        }
        .ff-hint {
          font-size: 12px;
          color: var(--muted);
          margin-top: 4px;
        }
      `}</style>
    </div>
  )
}

export function FormInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <input {...props} className={`ff-input ${props.className || ''}`} />
      <style jsx>{`
        .ff-input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border-strong);
          border-radius: 6px;
          font-size: 14px;
          transition: border 0.3s;
          background: var(--bg-input);
          color: var(--text);
        }
        .ff-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </>
  )
}

export function FormSelect({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <>
      <select {...props} className={`ff-select ${props.className || ''}`}>
        {children}
      </select>
      <style jsx>{`
        .ff-select {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border-strong);
          border-radius: 6px;
          font-size: 14px;
          transition: border 0.3s;
          background: var(--bg-input);
          color: var(--text);
        }
        .ff-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </>
  )
}

export function FormTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <>
      <textarea {...props} className={`ff-textarea ${props.className || ''}`} />
      <style jsx>{`
        .ff-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border-strong);
          border-radius: 6px;
          font-size: 14px;
          transition: border 0.3s;
          background: var(--bg-input);
          color: var(--text);
          resize: vertical;
        }
        .ff-textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </>
  )
}

interface FormGridProps {
  cols?: number
  children: ReactNode
}

export function FormGrid({ cols = 2, children }: FormGridProps) {
  return (
    <div className="ff-grid">
      {children}
      <style jsx>{`
        .ff-grid {
          display: grid;
          grid-template-columns: repeat(${cols}, 1fr);
          gap: 16px;
        }
        @media (max-width: 768px) {
          .ff-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
