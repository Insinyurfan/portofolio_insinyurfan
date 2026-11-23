"use client";

export function unggahMedia(
  file: File,
  url: string,
  signal: AbortSignal,
  onProgres?: (persen: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const xhr = new XMLHttpRequest();
    const batal = () => xhr.abort();
    signal.addEventListener("abort", batal, { once: true });

    xhr.open("PUT", url);
    xhr.timeout = 120_000;
    if (onProgres) {
      xhr.upload.onprogress = ({ loaded, total, lengthComputable }) => {
        if (lengthComputable && total > 0) {
          onProgres(Math.min(99, Math.floor((loaded / total) * 100)));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("Berkas gagal diunggah. Coba pilih berkasnya lagi."));
    };
    xhr.onerror = () => reject(new Error("Koneksi terputus. Coba pilih berkasnya lagi."));
    xhr.ontimeout = () => reject(new Error("Waktu unggah habis. Coba pilih berkasnya lagi."));
    xhr.onabort = () => reject(signal.reason);
    xhr.onloadend = () => signal.removeEventListener("abort", batal);

    // Format multipart yang juga dipakai SDK Supabase untuk File.
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    xhr.send(body);
  });
}
