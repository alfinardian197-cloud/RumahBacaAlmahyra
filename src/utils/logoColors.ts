function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function darkenHex(r: number, g: number, b: number, factor = 0.78): string {
  return rgbToHex(r * factor, g * factor, b * factor);
}

export async function extractColorsFromLogoUrl(
  imageUrl: string,
): Promise<{ primary: string; secondary: string; accent: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 48;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = new Map<string, { r: number; g: number; b: number; count: number; sat: number }>();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 150) continue;
          // Ignore near-white and near-black pixels
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max > 240 && min > 230) continue;
          if (max < 20) continue;

          const sat = max === 0 ? 0 : (max - min) / max;
          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;
          const existing = buckets.get(key);
          if (existing) {
            existing.r += r;
            existing.g += g;
            existing.b += b;
            existing.count += 1;
          } else {
            buckets.set(key, { r, g, b, count: 1, sat });
          }
        }

        const sorted = Array.from(buckets.values())
          .map((bucket) => ({
            r: bucket.r / bucket.count,
            g: bucket.g / bucket.count,
            b: bucket.b / bucket.count,
            count: bucket.count,
            sat: bucket.sat,
          }))
          .sort((a, b) => b.count * (1 + b.sat) - a.count * (1 + a.sat));

        if (sorted.length === 0) {
          resolve({ primary: '#1B4332', secondary: '#2D6A4F', accent: '#B58338' });
          return;
        }

        const p = sorted[0];
        const accentCandidate =
          sorted.find((c) => Math.hypot(c.r - p.r, c.g - p.g, c.b - p.b) > 75) ?? sorted[0];

        resolve({
          primary: rgbToHex(p.r, p.g, p.b),
          secondary: darkenHex(p.r, p.g, p.b, 1.25),
          accent: rgbToHex(accentCandidate.r, accentCandidate.g, accentCandidate.b),
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Gagal memuat gambar logo untuk ekstraksi warna.'));
    img.src = imageUrl;
  });
}
