import imageCompression from 'browser-image-compression'

export type CompressionPreset = 'document' | 'photo' | 'avatar'

const PRESETS: Record<
  CompressionPreset,
  { maxSizeMB: number; maxWidthOrHeight: number; initialQuality: number }
> = {
  // Bukti klaim / struk / BAP: 1600px & kualitas 80% agar tulisan kecil tetap terbaca
  document: {
    maxSizeMB: 0.25,
    maxWidthOrHeight: 1600,
    initialQuality: 0.8,
  },
  // Foto dokumentasi sidak lapangan: 1280px & kualitas 75%
  photo: {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 1280,
    initialQuality: 0.75,
  },
  // Avatar / thumbnail profil: 400px & kualitas 75%
  avatar: {
    maxSizeMB: 0.05,
    maxWidthOrHeight: 400,
    initialQuality: 0.75,
  },
}

export async function compressImageBeforeUpload(
  file: File,
  preset: CompressionPreset = 'document',
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar.')
  }

  const config = PRESETS[preset]
  const compressedBlob = await imageCompression(file, {
    maxSizeMB: config.maxSizeMB,
    maxWidthOrHeight: config.maxWidthOrHeight,
    initialQuality: config.initialQuality,
    useWebWorker: true,
    fileType: 'image/webp',
    alwaysKeepResolution: false,
  })

  const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
  return new File([compressedBlob], cleanName, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}
