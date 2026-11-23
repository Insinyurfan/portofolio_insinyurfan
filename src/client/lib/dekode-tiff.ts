import UTIF from "utif";

export async function dekodeTiff(file: File): Promise<HTMLCanvasElement> {
  const data = await file.arrayBuffer();
  const halaman = UTIF.decode(data).find((ifd) => Array.isArray(ifd.t256) && Array.isArray(ifd.t257));
  if (!halaman) throw new Error("Tidak ada gambar di dalam TIFF.");

  UTIF.decodeImage(data, halaman);
  const kanvas = document.createElement("canvas");
  kanvas.width = halaman.width;
  kanvas.height = halaman.height;
  const ctx = kanvas.getContext("2d");
  if (!ctx) throw new Error("Kanvas gambar tidak tersedia.");

  const rgba = new Uint8ClampedArray(UTIF.toRGBA8(halaman));
  ctx.putImageData(new ImageData(rgba, halaman.width, halaman.height), 0, 0);
  return kanvas;
}
