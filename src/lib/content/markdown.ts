/**
 * Parser untuk konten `organization_contents.body`.
 *
 * Format yang dipakai (Markdown polos, tanpa HTML):
 * - paragraf dipisahkan satu baris kosong;
 * - baris `- ` = butir daftar tidak bernomor;
 * - baris `1. ` = butir daftar bernomor;
 * - butir berbentuk `**Judul** — keterangan` dipecah menjadi pasangan
 *   judul dan keterangan.
 *
 * Markdown dipakai karena isinya tetap bisa dibaca manusia di dashboard dan
 * aman dari XSS: yang disimpan hanya teks, bukan HTML.
 */

/** Buang penanda Markdown yang tidak perlu ditampilkan. */
function stripMarks(value: string): string {
  return value.replace(/\*\*/g, "").trim();
}

/** Ambil isi blok: potong heading dan baris kosong di bagian atas. */
function lines(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

/** Pisahkan paragraf. */
export function parseParagraphs(markdown: string): string[] {
  return markdown
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter((block) => block.length > 0)
    .map(stripMarks);
}

/** Ambil butir daftar, baik `- ` maupun `1. `. */
export function parseList(markdown: string): string[] {
  return lines(markdown)
    .map((line) => stripMarks(line.replace(/^(-|\d+\.)\s*/, "")))
    .filter((item) => item.length > 0);
}

/**
 * Pisahkan butir `**Judul** — keterangan` menjadi dua bagian.
 * Pemisah yang dicari adalah em dash (`—`) agar teks isi bebas memakai tanda
 * baca lain. Butir tanpa keterangan dikembalikan dengan `description` kosong.
 */
export function parseTitledList(
  markdown: string,
): { title: string; description: string }[] {
  return parseList(markdown).map((item) => {
    const at = item.indexOf("—");
    if (at === -1) return { title: item, description: "" };
    return {
      title: item.slice(0, at).trim(),
      description: item.slice(at + 1).trim(),
    };
  });
}