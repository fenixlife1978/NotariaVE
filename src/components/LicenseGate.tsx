import React, { useMemo, useState } from 'react';
import { Clock3, KeyRound, ShieldCheck, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';

type LicenseStatus = {
  state: 'trial' | 'expired' | 'active' | 'revalidation_required';
  allowed: boolean;
  trialEndsAt?: string;
  remainingMs?: number;
  remainingHours?: number;
  licenseName?: string;
  offlineUntil?: string | null;
  message?: string;
};

interface Props {
  status: LicenseStatus;
  onContinue: () => void;
  onActivated: (status: LicenseStatus) => void;
}

export const LicenseGate: React.FC<Props> = ({ status, onContinue, onActivated }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');

  const remaining = useMemo(() => {
    const ms = Math.max(0, Number(status.remainingMs || 0));
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return { hours, minutes };
  }, [status.remainingMs]);

  const activate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!licenseKey.trim()) {
      setError('Introduzca la clave de licencia.');
      return;
    }
    setBusy(true);
    try {
      const result = await window.notariaDesktop.activateLicense({ licenseKey: licenseKey.trim() });
      if (result.state !== 'active' || !result.allowed) throw new Error('CRM-Sicoven no confirmó una licencia activa.');
      setSuccess('Licencia activada correctamente.');
      onActivated(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo activar la licencia.');
    } finally {
      setBusy(false);
    }
  };

  const openPlans = async () => {
    setError('');
    try {
      await window.notariaDesktop.openLicensePlans();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo abrir la página de planes.');
    }
  };

  const isTrial = status.state === 'trial';
  const isActive = status.state === 'active';
  const title = isTrial ? 'Prueba gratuita de NotariaVE' : isActive ? 'Licencia activa' : 'Activación de NotariaVE';

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-5 py-10 text-white"
      style={{ backgroundImage: "linear-gradient(110deg, rgba(2,8,23,.50), rgba(3,13,35,.18) 52%, rgba(2,8,23,.45)), url('./login-background.svg')", backgroundPosition: 'center', backgroundSize: 'cover' }}>
      <section className="w-full max-w-[520px]">
        <div className="mb-7 flex justify-center">
          <img src="./notariave-logo-horizontal.svg" alt="Notaría VE" className="h-auto w-full max-w-[350px] drop-shadow-xl" />
        </div>
        <div className="rounded-[26px] border border-white/15 bg-[#071a35]/85 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/15 text-amber-300">
              {isActive ? <CheckCircle2 className="h-6 w-6" /> : isTrial ? <Clock3 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="mt-1 text-xs text-slate-300">Licenciamiento administrado por CRM-Sicoven</p>
            </div>
          </div>

          {isTrial && (
            <div className="mb-5 rounded-xl border border-amber-300/25 bg-amber-400/10 p-4">
              <p className="text-sm font-semibold text-amber-200">120 horas (5 días) de prueba gratuita</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">{remaining.hours} h {remaining.minutes} min</p>
              <p className="mt-1 text-xs text-slate-300">Tiempo restante de evaluación en este equipo.</p>
            </div>
          )}

          {!isTrial && !isActive && (
            <div className="mb-5 rounded-xl border border-rose-300/25 bg-rose-400/10 p-4 text-sm text-rose-100">
              {status.message || 'La prueba gratuita terminó. Active una licencia para continuar.'}
            </div>
          )}

          {isActive && (
            <div className="mb-5 rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold">{status.licenseName || 'Licencia activa'}</p>
              <p className="mt-1 text-xs text-emerald-100/80">Validación sin conexión permitida hasta: {status.offlineUntil ? new Date(status.offlineUntil).toLocaleString('es-VE') : '—'}</p>
            </div>
          )}

          {error && <div role="alert" className="mb-4 flex gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          {success && <div role="status" className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">{success}</div>}

          {!isActive && (
            <form onSubmit={activate} className="space-y-3">
              <label htmlFor="license-key" className="block text-xs font-bold tracking-wider text-amber-200">CLAVE DE LICENCIA</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-300" />
                <input id="license-key" value={licenseKey} onChange={event => setLicenseKey(event.target.value)} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="SIC-XXXX-XXXX-XXXX" maxLength={120}
                  className="h-12 w-full rounded-xl border border-white/20 bg-[#020b1d]/80 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20" />
              </div>
              <button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-gradient-to-r from-[#e4a91f] via-[#f3c34b] to-[#d99a12] text-sm font-extrabold tracking-wide text-[#102744] disabled:opacity-60">
                {busy ? 'VALIDANDO CON CRM-SICOVEN…' : status.state === 'revalidation_required' ? 'REVALIDAR LICENCIA' : 'ACTIVAR LICENCIA'}
              </button>
            </form>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {isTrial && <button type="button" onClick={onContinue} className="h-11 rounded-xl border border-white/20 bg-white/5 text-sm font-semibold text-white hover:bg-white/10">Continuar prueba</button>}
            <button type="button" onClick={openPlans} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-300/50 bg-amber-300/10 text-sm font-bold text-amber-100 hover:bg-amber-300/20">
              Ver planes <ExternalLink className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">La licencia se valida con CRM-Sicoven. Sus expedientes, usuarios y documentos permanecen almacenados localmente en SQLite.</p>
        </div>
      </section>
    </main>
  );
};
