export default function StarRating({ value, onChange, size = 24, readOnly = false }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => !readOnly && onChange?.(n)}
          style={{
            fontSize: size, cursor: readOnly ? 'default' : 'pointer',
            color: n <= value ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.1s',
            lineHeight: 1,
          }}
        >★</span>
      ))}
    </div>
  )
}
