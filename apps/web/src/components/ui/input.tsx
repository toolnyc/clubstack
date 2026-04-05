"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  optional?: boolean;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, optional, id, className = "", ...props },
  ref
) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`input-field ${className}`}>
      <label htmlFor={inputId} className="input-field__label">
        {label}
        {optional ? (
          <span className="input-field__optional">(optional)</span>
        ) : null}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`input-field__input ${error ? "input-field__input--error" : ""}`}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="input-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  optional?: boolean;
  className?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, optional, id, className = "", ...props },
    ref
  ) {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={`input-field ${className}`}>
        <label htmlFor={inputId} className="input-field__label">
          {label}
          {optional ? (
            <span className="input-field__optional">(optional)</span>
          ) : null}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`input-field__textarea ${error ? "input-field__input--error" : ""}`}
          {...props}
        />
        {error ? (
          <p
            id={`${inputId}-error`}
            className="input-field__error"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
  className = "",
}: ToggleProps) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`toggle-field ${className}`}>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`toggle-field__track ${checked ? "toggle-field__track--active" : ""}`}
      >
        <span className="toggle-field__thumb" />
      </button>
      <label htmlFor={id} className="toggle-field__label">
        {label}
      </label>
    </div>
  );
}

export { Input, Textarea, Toggle };
export type { InputProps, TextareaProps, ToggleProps };
