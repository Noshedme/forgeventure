import { useEffect, useRef } from 'react';

export default function ChatBubble({ message, onOption, onClose }) {
  const bubbleRef = useRef(null);

  useEffect(() => {
    bubbleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [message]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '185px',
        right: '10px',
        width: '280px',
        background: '#0D1B2E',
        border: '1px solid #1E3A5F',
        borderRadius: '16px 16px 4px 16px',
        padding: '14px 16px 12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 9999,
        animation: 'bubblePop 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}
      ref={bubbleRef}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 8,
          right: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#6B8CAE',
          fontSize: 16,
          lineHeight: 1,
          padding: 2,
        }}
        title="Cerrar"
      >
        ×
      </button>

      <p
        style={{
          margin: '0 0 12px',
          fontSize: 14,
          lineHeight: 1.5,
          color: '#F0F4FF',
          paddingRight: 16,
        }}
      >
        {message.text}
      </p>

      {message.options?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {message.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => onOption(opt.id)}
              style={{
                background: '#0A1628',
                border: '1px solid #1E3A5F',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 13,
                color: '#F0F4FF',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1E3A5F';
                e.currentTarget.style.borderColor = '#E85D04';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#0A1628';
                e.currentTarget.style.borderColor = '#1E3A5F';
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
