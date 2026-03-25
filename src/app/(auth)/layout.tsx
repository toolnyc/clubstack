export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__content animate-fade-in-up">
        <span className="auth-layout__wordmark">Clubstack</span>
        {children}
      </div>
    </div>
  );
}
