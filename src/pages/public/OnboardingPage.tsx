import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, Check, ShoppingBag, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePrefs } from '../../context/PrefsContext';
import { supabase, friendlyError } from '../../lib/db';
import { updateProfile } from '../../services/account';
import type { OnboardingGoal } from '../../lib/types';
import type { TranslationKey } from '../../lib/i18n';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { InlineAlert } from '../../components/ui/States';

const GOALS: { id: OnboardingGoal; icon: React.ElementType; title: TranslationKey; hint: TranslationKey }[] = [
  { id: 'pro', icon: Building2, title: 'onb.q1.pro', hint: 'onb.q1.proHint' },
  { id: 'personal', icon: ShoppingBag, title: 'onb.q1.personal', hint: 'onb.q1.personalHint' },
  { id: 'groupage', icon: Users, title: 'onb.q1.groupage', hint: 'onb.q1.groupageHint' }
];

const VOLUMES: { id: string; label: TranslationKey }[] = [
  { id: 'small', label: 'onb.vol.small' },
  { id: 'mid', label: 'onb.vol.mid' },
  { id: 'large', label: 'onb.vol.large' }
];

const VISIBLE_CATEGORIES = 6;

/** Écran de bienvenue : bonjour, puis trois questions pour personnaliser l'accueil. Ignorable à tout moment. */
export default function OnboardingPage() {
  const { user, categories, navigate, refreshUser, toast, authLoading } = useApp();
  const { t } = usePrefs();
  const [phase, setPhase] = useState<'splash' | 1 | 2 | 3>('splash');
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [volume, setVolume] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Dakar');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roots = useMemo(() => categories.filter(c => c.isActive && !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder), [categories]);
  const first = (user?.fullName || '').split(' ')[0] || '';

  useEffect(() => {
    document.title = `${t('onb.welcome')}`;
  }, [t]);

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setCity(user.city || 'Dakar');
    }
  }, [user?.id]);

  // Visiteur non connecté : rien à personnaliser
  useEffect(() => {
    if (!authLoading && !user) navigate('/', { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (phase !== 'splash') return;
    const id = window.setTimeout(() => setPhase(1), 2000);
    return () => window.clearTimeout(id);
  }, [phase]);

  if (!user) return null;

  async function persist(patch: Record<string, unknown>) {
    const { error: err } = await supabase.auth.updateUser({ data: { onboarding: patch } });
    if (err) throw err;
    await refreshUser();
  }

  async function skip() {
    try {
      await persist({ ...user!.onboarding, skipped: true });
    } catch {
      /* même en cas d'échec, on laisse le client continuer */
    }
    navigate('/', { replace: true });
  }

  async function finish() {
    setError(null);
    const digits = phone.replace(/\D/g, '');
    if (phone.trim() && digits.length < 8) return setError(t('onb.err.phone'));
    setSaving(true);
    try {
      if (phone.trim() !== user!.phone || city.trim() !== user!.city) {
        await updateProfile(user!.id, {
          fullName: user!.fullName,
          phone: phone.trim() || user!.phone,
          city: city.trim() || user!.city,
          address: user!.address,
          companyName: user!.companyName
        });
      }
      await persist({ done: true, skipped: false, goal, categories: picked, volume: goal === 'pro' ? volume : null, at: new Date().toISOString() });
      toast('success', t('onb.done'));
      navigate('/', { replace: true });
    } catch (err) {
      setError(friendlyError(err) || t('onb.err.save'));
    } finally {
      setSaving(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-dvh bg-brand-50/60">
      <div className="px-5 pt-5 sm:px-10 sm:pt-7">
        <Logo />
      </div>
      <div className="mx-auto flex max-w-[1120px] items-center px-4 py-8 sm:min-h-[calc(100dvh-90px)] sm:px-6">{children}</div>
    </div>
  );

  if (phase === 'splash') {
    return shell(
      <button
        type="button"
        onClick={() => setPhase(1)}
        className="relative flex min-h-[420px] w-full flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[radial-gradient(120%_90%_at_30%_100%,#f8d466_0%,#f08a3c_45%,#ea5f27_100%)] px-6 text-center text-white sm:min-h-[560px]"
        aria-label={t('onb.next')}
      >
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-paper font-display text-4xl font-bold text-brand">{(first || user.email || 'D').slice(0, 1).toUpperCase()}</span>
        <span className="mt-6 text-[22px] font-bold leading-snug sm:text-[26px]">
          {t('onb.hello', { name: first || '' }).replace(' .', '.')}
          <br />
          {t('onb.welcome')}
        </span>
      </button>
    );
  }

  const panelText = phase === 1 ? (goal === 'pro' ? t('onb.panel1.pro') : t('onb.panel1.default')) : phase === 2 ? t('onb.panel2') : t('onb.panel3');
  const canNext = phase === 1 ? Boolean(goal) : true;
  const shown = showAll ? roots : roots.slice(0, VISIBLE_CATEGORIES);

  return shell(
    <div className="grid w-full overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-lift)] md:min-h-[560px] md:grid-cols-[1fr_1fr]">
      <div className="relative flex flex-col items-center justify-center bg-[radial-gradient(120%_90%_at_30%_100%,#f8d466_0%,#f08a3c_45%,#ea5f27_100%)] px-8 py-10 text-center text-white md:py-0">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-paper font-display text-3xl font-bold text-brand ring-8 ring-white/25">{(first || 'D').slice(0, 1).toUpperCase()}</span>
        <p className="mt-6 max-w-[320px] text-[20px] font-bold leading-snug sm:text-[24px]">{panelText}</p>
      </div>

      <div className="flex flex-col p-6 sm:p-10">
        <div className="mb-6 flex items-center justify-between text-[14px]">
          {phase > 1 ? (
            <button type="button" onClick={() => setPhase((phase - 1) as 1 | 2)} className="inline-flex items-center gap-1.5 font-medium hover:text-brand">
              <ArrowLeft className="h-4 w-4" /> {t('onb.back')}
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={skip} className="font-medium text-muted hover:text-ink">
            {t('onb.skip')}
          </button>
        </div>

        <p className="num text-[15px] text-muted">{t('onb.step', { n: phase })}</p>

        {phase === 1 && (
          <>
            <h1 className="mt-1 text-[24px] font-bold leading-tight sm:text-[28px]">{t('onb.q1')}</h1>
            <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t('onb.q1')}>
              {GOALS.map(g => {
                const on = goal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setGoal(g.id)}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${on ? 'border-brand bg-brand-50' : 'border-transparent bg-paper hover:border-line-2'}`}
                  >
                    <span className="icon-bubble mt-0.5 h-10 w-10 shrink-0">
                      <g.icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-[15px] font-semibold">{t(g.title)}</span>
                      <span className="block text-[12.5px] text-muted">{t(g.hint)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {phase === 2 && (
          <>
            <h1 className="mt-1 text-[24px] font-bold leading-tight sm:text-[28px]">{t('onb.q2')}</h1>
            <p className="mt-1.5 text-[13.5px] text-muted">{t('onb.q2.hint')}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {shown.map(c => {
                const on = picked.includes(c.slug);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPicked(p => (on ? p.filter(x => x !== c.slug) : [...p, c.slug]))}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${on ? 'border-brand bg-brand-50' : 'border-transparent bg-paper hover:border-line-2'}`}
                  >
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-paper-2">{c.imageUrl && <img src={c.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}</span>
                    <span className="min-w-0 flex-1 text-[14px] font-semibold leading-tight">{c.name}</span>
                    {on && <Check className="h-4 w-4 shrink-0 text-brand" />}
                  </button>
                );
              })}
            </div>
            {!showAll && roots.length > VISIBLE_CATEGORIES && (
              <button type="button" onClick={() => setShowAll(true)} className="mx-auto mt-4 text-[14px] font-semibold text-muted hover:text-ink">
                {t('onb.q2.more')}
              </button>
            )}
          </>
        )}

        {phase === 3 && (
          <>
            <h1 className="mt-1 text-[24px] font-bold leading-tight sm:text-[28px]">{t('onb.q3')}</h1>
            <p className="mt-1.5 text-[13.5px] text-muted">{t('onb.q3.hint')}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label={t('onb.q3.phone')} inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="77 000 00 00" />
              <Input label={t('onb.q3.city')} autoComplete="address-level2" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            {goal === 'pro' && (
              <div className="mt-6">
                <p className="mb-2 text-[13.5px] font-semibold">{t('onb.q3.volume')}</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('onb.q3.volume')}>
                  {VOLUMES.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={volume === v.id}
                      onClick={() => setVolume(v.id)}
                      className={`rounded-full border-2 px-4 py-2 text-[13.5px] font-semibold transition-colors ${volume === v.id ? 'border-brand bg-brand-50 text-brand-700' : 'border-transparent bg-paper hover:border-line-2'}`}
                    >
                      {t(v.label)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {error && (
              <div className="mt-4">
                <InlineAlert tone="danger">{error}</InlineAlert>
              </div>
            )}
          </>
        )}

        <div className="mt-auto pt-8">
          {phase < 3 ? (
            <Button size="lg" block disabled={!canNext} onClick={() => setPhase((phase + 1) as 2 | 3)}>
              {t('onb.next')}
            </Button>
          ) : (
            <Button size="lg" block loading={saving} onClick={finish}>
              {t('onb.finish')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
