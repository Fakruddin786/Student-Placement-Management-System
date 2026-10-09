import React from 'react';

/**
 * Reusable Form Input Component with Bootstrap styling and validation messages
 */
export default function FormInput({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  helpText,
  rows,
}) {
  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={id || name} className="form-label fw-semibold">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={id || name}
          name={name}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          rows={rows || 3}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      ) : (
        <input
          type={type}
          id={id || name}
          name={name}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}

      {helpText && !error && <div className="form-text">{helpText}</div>}
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}
