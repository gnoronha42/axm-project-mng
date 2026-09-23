import { readFile } from 'node:fs/promises';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { publicUser, signToken } from '../lib/auth.js';
import { findAvatarUrl, readAvatarFile, saveAvatar } from '../lib/avatar.js';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

async function mappedUser(user: { id: string; email: string; name: string; role: string; tenantId?: string | null }, uploadDir: string) {
  return publicUser({ ...user, avatarUrl: await findAvatarUrl(user.id, uploadDir) });
}

export async function registerProfileRoutes(app: FastifyInstance, uploadDir: string) {
  app.patch('/auth/me', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Não autenticado' });

    const body = req.body as { name?: string; email?: string };
    const name = body?.name?.trim();
    const email = body?.email?.trim().toLowerCase();

    if (name !== undefined && !name) return reply.status(400).send({ error: 'Nome obrigatório' });
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.status(400).send({ error: 'E-mail inválido' });
    }

    if (email && email !== req.user.email) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists && exists.id !== req.user.id) {
        return reply.status(409).send({ error: 'E-mail já cadastrado' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      },
    });

    const publicProfile = await mappedUser(user, uploadDir);
    return { token: signToken(publicProfile), user: publicProfile };
  });

  app.post('/auth/me/avatar', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Não autenticado' });

    const file = await req.file();
    if (!file) return reply.status(400).send({ error: 'Envie uma foto' });

    const buffer = await file.toBuffer();
    if (buffer.length > MAX_AVATAR_BYTES) {
      return reply.status(400).send({ error: 'A foto deve ter no máximo 2 MB' });
    }

    try {
      const avatarUrl = await saveAvatar(req.user.id, uploadDir, buffer, file.mimetype);
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) return reply.status(401).send({ error: 'Usuário não encontrado' });
      return { user: publicUser({ ...user, avatarUrl }) };
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : 'Foto inválida' });
    }
  });

  app.get('/files/avatars/:file', async (req, reply) => {
    const { file } = req.params as { file: string };
    const fullPath = await readAvatarFile(uploadDir, file);
    if (!fullPath) return reply.status(404).send({ error: 'Foto não encontrada' });

    const ext = file.split('.').pop();
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return reply.header('Content-Type', mime).send(await readFile(fullPath));
  });
}
