interface BuildInfoProps {
  className?: string;
}

export function BuildInfo({ className }: BuildInfoProps) {
  const hash = process.env.NEXT_PUBLIC_BUILD_HASH || 'dev';
  const time = process.env.NEXT_PUBLIC_BUILD_TIME || '';

  return (
    <div
      className={className}
      style={{
        fontSize: '11px',
        color: '#888',
        fontFamily: 'var(--font-jetbrains, monospace)',
        padding: '4px 8px',
        background: '#f5f5f5',
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center',
      }}
    >
      <span style={{ fontWeight: 600 }}>v{hash}</span>
      {time && (
        <span style={{ marginLeft: '8px', opacity: 0.7 }}>
          {new Date(time).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
        </span>
      )}
    </div>
  );
}
