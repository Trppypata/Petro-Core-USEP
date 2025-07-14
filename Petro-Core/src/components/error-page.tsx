import { useNavigate } from 'react-router-dom';

export default function ErrorPage() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
      }}
    >
      <h1 style={{ fontSize: '3rem', color: '#e11d48', marginBottom: '1rem' }}>
        Oops!
      </h1>
      <p
        style={{ fontSize: '1.25rem', color: '#334155', marginBottom: '2rem' }}
      >
        Something went wrong or the page does not exist.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
        }}
      >
        Go Home
      </button>
    </div>
  );
}
