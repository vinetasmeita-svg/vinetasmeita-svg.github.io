/**
 * Renders a query error in a visually distinct card. Detects the specific
 * "requires an index" Firestore error and surfaces the create-index link
 * from the error message so admins can one-click fix it.
 */
export default function ErrorBox({ error }: { error: string }) {
  const indexMatch = error.match(/https:\/\/console\.firebase\.google\.com\/[^\s)]+/);
  const isIndexError = error.includes('requires an index') && indexMatch;
  const isPermissionError = error.toLowerCase().includes('insufficient permissions');

  return (
    <div
      className="card"
      style={{
        borderColor: 'var(--danger)',
        borderLeft: '3px solid var(--danger)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'var(--danger)',
          marginBottom: 8,
        }}
      >
        Kļūda
      </div>
      {isIndexError && (
        <>
          <p style={{ fontSize: 13, marginBottom: 12 }}>
            Firestore prasa indeksu šim vaicājumam. Atver saiti un nospied “Create”:
          </p>
          <a
            href={indexMatch[0]}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, wordBreak: 'break-all' }}
          >
            {indexMatch[0]}
          </a>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
            Pēc indeksa izveides (1-2 min) atjauno šo lapu.
          </p>
        </>
      )}
      {isPermissionError && !isIndexError && (
        <>
          <p style={{ fontSize: 13, marginBottom: 8 }}>
            Firestore noliedz piekļuvi. Iespējams, drošības noteikumi nav izvietoti.
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>
            Palaiž: <code>npm run deploy:rules</code>
          </p>
        </>
      )}
      {!isIndexError && !isPermissionError && (
        <p style={{ fontSize: 12, wordBreak: 'break-word' }}>{error}</p>
      )}
    </div>
  );
}
