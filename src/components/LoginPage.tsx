import React, { useState } from 'react';
import { AlertCircle, ArrowRight, LockKeyhole, UserRound } from 'lucide-react';

interface LoginPageProps {
  onLogin: (userData: { username: string; role: string; fullName: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Ingrese su usuario y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await window.notariaDesktop.login({
        username: username.trim(),
        password,
      });
      onLogin(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible verificar el acceso local.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-5 py-12 text-white"
      style={{
        backgroundImage: "linear-gradient(110deg, rgba(2,8,23,.08), rgba(3,13,35,.02) 52%, rgba(2,8,23,.10)), url('./login-background.svg')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(9,29,67,.02),rgba(1,6,19,.10))]" />

      <section className="w-full max-w-[430px]">
        <div className="mb-8 flex justify-center">
          <img
            src="./notariave-logo-horizontal.png"
            alt="Notaría VE | Software para abogados"
            className="h-auto w-full max-w-[370px] object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,.28)]"
          />
        </div>

        <div className="rounded-[26px] border border-white/15 bg-[#071a35]/75 p-6 shadow-[0_28px_90px_rgba(0,0,0,.48)] backdrop-blur-xl sm:p-9">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-username" className="mb-2 block text-xs font-bold tracking-[.18em] text-[#f4c34f]">
                USUARIO
              </label>
              <div className="relative">
                <UserRound aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e7b63f]" />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Ingrese su usuario"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  className="h-[54px] w-full rounded-xl border border-white/20 bg-[#020b1d]/75 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-400/75 focus:border-[#efb72f] focus:ring-2 focus:ring-[#efb72f]/25"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-xs font-bold tracking-[.18em] text-[#f4c34f]">
                CONTRASEÑA
              </label>
              <div className="relative">
                <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e7b63f]" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingrese su contraseña"
                  autoComplete="current-password"
                  required
                  className="h-[54px] w-full rounded-xl border border-white/20 bg-[#020b1d]/75 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-400/75 focus:border-[#efb72f] focus:ring-2 focus:ring-[#efb72f]/25"
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e4a91f] via-[#f3c34b] to-[#d99a12] px-4 text-sm font-extrabold tracking-wide text-[#102744] shadow-[0_10px_28px_rgba(218,157,25,.22)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#ffdc78] focus:ring-offset-2 focus:ring-offset-[#071a35] disabled:cursor-wait disabled:opacity-60"
            >
              <span>{isLoading ? 'VERIFICANDO…' : 'INGRESAR'}</span>
              {!isLoading && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};
