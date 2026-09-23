import { access, mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function avatarDir(uploadDir: string) {
  return path.join(uploadDir, 'avatars');
}

export async function findAvatarUrl(userId: string, uploadDir: string): Promise<string | undefined> {
  const dir = avatarDir(uploadDir);
  try {
    const files = await readdir(dir);
    const match = files.find((file) => file.startsWith(`${userId}.`));
    return match ? `/files/avatars/${match}` : undefined;
  } catch {
    return undefined;
  }
}

export async function saveAvatar(
  userId: string,
  uploadDir: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = EXT_BY_MIME[mimeType];
  if (!ext) throw new Error('Use JPG, PNG ou WEBP');

  const dir = avatarDir(uploadDir);
  await mkdir(dir, { recursive: true });

  try {
    const files = await readdir(dir);
    await Promise.all(
      files.filter((file) => file.startsWith(`${userId}.`)).map((file) => unlink(path.join(dir, file))),
    );
  } catch {
    /* pasta nova */
  }

  const filename = `${userId}${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/files/avatars/${filename}`;
}

export async function readAvatarFile(uploadDir: string, filename: string) {
  if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(filename)) return null;
  const fullPath = path.join(avatarDir(uploadDir), filename);
  try {
    await access(fullPath);
    return fullPath;
  } catch {
    return null;
  }
}
