import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, FileText, ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { uploadClientFile, uploadMedia } from '../../lib/storage';
import { friendlyError } from '../../lib/db';
import { useFileUrl } from '../../lib/hooks';

/** Vignette d'un fichier (image publique, image privée signée, ou PDF). */
export function FileThumb({ refUrl, className = 'h-20 w-20', alt = '' }: { refUrl: string; className?: string; alt?: string }) {
  const url = useFileUrl(refUrl);
  const isPdf = /\.pdf($|\?)/i.test(refUrl);
  if (isPdf) {
    return (
      <a href={url || '#'} target="_blank" rel="noreferrer" className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-paper text-[11px] font-semibold text-muted ${className}`}>
        <FileText className="h-5 w-5" /> PDF
      </a>
    );
  }
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className={`block overflow-hidden rounded-xl border border-line bg-paper ${className}`}>
      <img src={url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
    </a>
  ) : (
    <div className={`skeleton rounded-xl ${className}`} />
  );
}

/**
 * Pièces jointes client (photos produit, cahier des charges).
 * Les fichiers vont dans l'espace privé du client ; seuls lui et l'équipe peuvent les voir.
 */
export function ClientFilesInput({
  userId,
  value,
  onChange,
  max = 5,
  onError,
  requireAuth
}: {
  userId: string | null;
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  onError: (message: string) => void;
  requireAuth: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    if (!userId) {
      requireAuth();
      return;
    }
    const list = Array.from(files).slice(0, Math.max(0, max - value.length));
    setUploading(list.length);
    const added: string[] = [];
    for (const f of list) {
      try {
        added.push(await uploadClientFile(userId, f));
      } catch (err) {
        onError(friendlyError(err));
      } finally {
        setUploading(n => n - 1);
      }
    }
    if (added.length) onChange([...value, ...added]);
    if (input.current) input.current.value = '';
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {value.map(ref => (
          <div key={ref} className="relative">
            <FileThumb refUrl={ref} />
            <button
              type="button"
              onClick={() => onChange(value.filter(v => v !== ref))}
              className="absolute -right-2 -top-2 rounded-full bg-ink p-1.5 text-white shadow"
              aria-label="Retirer le fichier"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div key={i} className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-line-2 bg-paper">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ))}
        {value.length + uploading < max && (
          <button
            type="button"
            onClick={() => (userId ? input.current?.click() : requireAuth())}
            className="flex h-20 min-w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-2 bg-white px-3 text-[11.5px] font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
          >
            <UploadCloud className="h-5 w-5" />
            Ajouter
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}

/** Galerie de visuels publics (personnel) : ajout, ordre, suppression. La première image est la principale. */
export function MediaGalleryInput({
  value,
  onChange,
  onError,
  folder = 'media',
  max = 10
}: {
  value: string[];
  onChange: (v: string[]) => void;
  onError: (message: string) => void;
  folder?: string;
  max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [urlDraft, setUrlDraft] = useState('');

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, Math.max(0, max - value.length));
    setUploading(list.length);
    const added: string[] = [];
    for (const f of list) {
      try {
        added.push(await uploadMedia(f, folder));
      } catch (err) {
        onError(friendlyError(err));
      } finally {
        setUploading(n => n - 1);
      }
    }
    if (added.length) onChange([...value, ...added]);
    if (input.current) input.current.value = '';
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function addUrl() {
    const u = urlDraft.trim();
    if (!/^https:\/\//.test(u)) {
      onError('Collez une adresse d’image commençant par https://');
      return;
    }
    onChange([...value, u]);
    setUrlDraft('');
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
        {value.map((url, i) => (
          <div key={url + i} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-paper">
            <img src={url} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">Principale</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-ink/70 to-transparent p-1.5">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md bg-white/90 p-1 text-ink disabled:opacity-30" aria-label="Déplacer à gauche">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="rounded-md bg-white/90 p-1 text-ink disabled:opacity-30" aria-label="Déplacer à droite">
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded-md bg-white/90 p-1 text-red-700" aria-label="Supprimer l’image">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`u${i}`} className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-line-2 bg-paper">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ))}
        {value.length + uploading < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-2 bg-white text-[12px] font-semibold text-muted hover:border-ink hover:text-ink"
          >
            <ImagePlus className="h-5 w-5" />
            Téléverser
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={urlDraft}
          onChange={e => setUrlDraft(e.target.value)}
          placeholder="…ou collez l’URL d’une image (https://)"
          className="h-10 flex-1 rounded-xl border border-line-2 bg-white px-3 text-sm focus:border-brand/60 focus:outline-none focus:ring-4 focus:ring-brand/10"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <button type="button" onClick={addUrl} className="h-10 rounded-xl border border-line-2 bg-white px-3.5 text-[13px] font-semibold hover:bg-paper">
          Ajouter
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  );
}
