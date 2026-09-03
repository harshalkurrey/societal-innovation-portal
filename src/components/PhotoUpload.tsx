import { UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { supabase, BUCKET_NAME } from '@/lib/supabase';

interface PhotoUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
      onChange(pub.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {value ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 hover:bg-white shadow-sm text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-500 transition-colors disabled:opacity-50"
        >
          <UploadCloud size={28} />
          <span className="text-sm font-medium">
            {uploading ? 'Uploading...' : 'Click to upload a photo'}
          </span>
        </button>
      )}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
