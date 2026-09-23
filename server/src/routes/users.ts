import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/auth.js';

function requireAdmin(role?: string) {
  return role === 'admin';
}

function mapUser(user: { id: string; name: string; email: string; role: string; createdAt: Date }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function registerUserRoutes(app: FastifyInstance) {
  app.get('/users', async (req, reply) => {
    if (!requireAdmin(req.user?.role)) {
      return reply.status(403).send({ error: 'Apenas o administrador pode ver a equipe' });
    }

    const rows = await prisma.user.findMany({
      where: req.user?.tenantId ? { tenantId: req.user.tenantId } : undefined,
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return rows.map(mapUser);
  });

  app.post('/users', async (req, reply) => {
    if (!requireAdmin(req.user?.role)) {
      return reply.status(403).send({ error: 'Apenas o administrador pode cadastrar analistas' });
    }

    const body = req.body as { name?: string; email?: string; password?: string };
    const name = body?.name?.trim();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password ?? '';

    if (!name) return reply.status(400).send({ error: 'Nome obrigatório' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.status(400).send({ error: 'E-mail inválido' });
    }
    if (password.length < 6) {
      return reply.status(400).send({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return reply.status(409).send({ error: 'E-mail já cadastrado' });

    const tenantId = req.user?.tenantId;
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: 'analista',
        tenantId,
      },
    });

    if (tenantId) {
      try {
        await prisma.tenantMember.create({
          data: { tenantId, userId: user.id, role: 'analista' },
        });
      } catch {
        // membership duplicada ou tenant inexistente não impede o cadastro
      }
    }

    return reply.status(201).send(mapUser({ ...user, createdAt: user.createdAt }));
  });
}
