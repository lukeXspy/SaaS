import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import type { UserRole } from "@prisma/client";

import type {
  AcceptInviteInput,
  ChangePasswordInput,
  InviteInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from "@/lib/validation/users";
import { createTenantClient } from "@/server/db/tenant";
import { prisma } from "@/server/db/client";
import { serviceError, serviceOk, type ServiceResult } from "./result";

const BCRYPT_ROUNDS = 12;
const INVITE_TTL_HOURS = 72;
const RESET_TTL_HOURS = 24;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Gera um token aleatório seguro e o hash SHA-256 para armazenar. */
function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: sha256(raw) };
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────
// Listagem e detalhe (tenant-scoped)
// ─────────────────────────────────────────────────────────────

export async function listUsers(companyId: string) {
  const db = createTenantClient(companyId);
  const [users, invites] = await Promise.all([
    db.user.findMany({
      where: { companyId },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { assignedWorkOrders: true, inspections: true } },
      },
    }),
    db.invite.findMany({
      where: { companyId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      include: { invitedBy: { select: { name: true } } },
    }),
  ]);
  return { users, invites };
}

export async function getUser(companyId: string, id: string) {
  const db = createTenantClient(companyId);
  return db.user.findFirst({
    where: { companyId, id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      assignedWorkOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          priority: true,
          dueAt: true,
        },
      },
      _count: {
        select: {
          assignedWorkOrders: true,
          executions: true,
          inspections: true,
        },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Convites
// ─────────────────────────────────────────────────────────────

/**
 * Cria um convite e retorna o link para o admin copiar e enviar
 * (WhatsApp, e-mail manual etc. — não há e-mail transacional no MVP).
 *
 * O token raw NUNCA é armazenado; apenas o SHA-256 vai para o banco.
 */
export async function createInvite(
  companyId: string,
  adminId: string,
  input: InviteInput,
): Promise<ServiceResult<{ inviteLink: string; email: string; role: string }>> {
  const db = createTenantClient(companyId);

  // Verifica se já existe usuário ativo com este e-mail (na mesma empresa)
  const existing = await db.user.findFirst({
    where: { companyId, email: input.email, isActive: true },
    select: { id: true },
  });
  if (existing) {
    return serviceError("Já existe um usuário ativo com este e-mail.");
  }

  // Revoga convites pendentes anteriores para o mesmo e-mail
  await db.invite.updateMany({
    where: {
      companyId,
      email: input.email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { expiresAt: new Date() },
  });

  const { raw, hash: tokenHash } = generateToken();
  const expiresAt = hoursFromNow(INVITE_TTL_HOURS);

  await db.invite.create({
    data: {
      companyId,
      email: input.email,
      role: input.role,
      tokenHash,
      expiresAt,
      invitedById: adminId,
    },
  });

  return serviceOk({
    inviteLink: `/convite/${raw}`,
    email: input.email,
    role: input.role,
  });
}

/**
 * Busca um convite pelo token raw (valida hash + expiração).
 * Não é tenant-scoped — o token já contém a prova de posse.
 */
export async function getInviteByToken(token: string) {
  const tokenHash = sha256(token);
  const invite = await prisma.invite.findFirst({
    where: {
      tokenHash,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      companyId: true,
      email: true,
      role: true,
      expiresAt: true,
    },
  });
  return invite;
}

/**
 * Aceita um convite: cria o usuário com senha e marca o convite como aceito.
 */
export async function acceptInvite(
  token: string,
  input: AcceptInviteInput,
): Promise<ServiceResult<{ userId: string }>> {
  const invite = await getInviteByToken(token);
  if (!invite) {
    return serviceError("Convite inválido ou expirado. Peça um novo link ao administrador.");
  }

  // Verifica se o e-mail já foi usado enquanto o convite estava pendente
  const existing = await prisma.user.findFirst({
    where: { email: invite.email, isActive: true },
    select: { id: true },
  });
  if (existing) {
    return serviceError("Este e-mail já possui uma conta ativa.");
  }

  const passwordHash = await hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      companyId: invite.companyId,
      name: input.name,
      email: invite.email,
      passwordHash,
      role: invite.role as UserRole,
      lastLoginAt: new Date(),
    },
  });

  // Marca o convite como aceito (updateMany sem companyId é OK — não é tenant model)
  await prisma.invite.updateMany({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  return serviceOk({ userId: user.id });
}

export async function revokeInvite(
  companyId: string,
  inviteId: string,
): Promise<ServiceResult> {
  const db = createTenantClient(companyId);
  const result = await db.invite.updateMany({
    where: { companyId, id: inviteId, acceptedAt: null },
    data: { expiresAt: new Date() },
  });
  return result.count > 0 ? serviceOk(undefined) : serviceError("Convite não encontrado.");
}

// ─────────────────────────────────────────────────────────────
// Reset de senha (admin gera link → usuário redefine)
// ─────────────────────────────────────────────────────────────

/**
 * Admin gera um link de redefinição para o usuário.
 * O link é mostrado ao admin para copiar e enviar (sem e-mail transacional).
 */
export async function generateResetLink(
  companyId: string,
  userId: string,
): Promise<ServiceResult<{ resetLink: string; userName: string }>> {
  const db = createTenantClient(companyId);
  const user = await db.user.findFirst({
    where: { companyId, id: userId, isActive: true },
    select: { id: true, name: true },
  });
  if (!user) return serviceError("Usuário não encontrado.");

  // Invalida tokens anteriores não usados
  // (PasswordResetToken não tem companyId — usa cliente global, já validado acima)
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  });

  const { raw, hash: tokenHash } = generateToken();
  const expiresAt = hoursFromNow(RESET_TTL_HOURS);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return serviceOk({ resetLink: `/redefinir-senha/${raw}`, userName: user.name });
}

export async function resetPassword(
  token: string,
  input: ResetPasswordInput,
): Promise<ServiceResult> {
  const tokenHash = sha256(token);
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, userId: true },
  });
  if (!resetToken) {
    return serviceError("Link inválido ou expirado. Peça um novo ao administrador.");
  }

  const passwordHash = await hash(input.password, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() },
  });

  return serviceOk(undefined);
}

// ─────────────────────────────────────────────────────────────
// Conta própria (usuário logado)
// ─────────────────────────────────────────────────────────────

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<ServiceResult> {
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return serviceError("Usuário não encontrado ou sem senha definida.");
  }

  const isValid = await compare(input.currentPassword, user.passwordHash);
  if (!isValid) {
    return serviceError("Senha atual incorreta.");
  }

  const passwordHash = await hash(input.newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return serviceOk(undefined);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<ServiceResult> {
  // Verifica se o e-mail já está em uso por outro usuário
  const existing = await prisma.user.findFirst({
    where: { email: input.email, id: { not: userId } },
    select: { id: true },
  });
  if (existing) {
    return serviceError("Este e-mail já está em uso por outra pessoa.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
    },
  });

  return serviceOk(undefined);
}

// ─────────────────────────────────────────────────────────────
// Admin: ativar/desativar usuário
// ─────────────────────────────────────────────────────────────

export async function setUserActive(
  companyId: string,
  userId: string,
  isActive: boolean,
): Promise<ServiceResult> {
  if (!isActive) {
    // Não permite desativar a si mesmo
    const adminCount = await prisma.user.count({
      where: { companyId, role: "ADMIN", isActive: true, id: { not: userId } },
    });
    const target = await prisma.user.findFirst({
      where: { companyId, id: userId },
      select: { role: true },
    });
    if (target?.role === "ADMIN" && adminCount === 0) {
      return serviceError("Não é possível desativar o último administrador ativo.");
    }
  }

  const db = createTenantClient(companyId);
  const result = await db.user.updateMany({
    where: { companyId, id: userId },
    data: { isActive },
  });
  return result.count > 0 ? serviceOk(undefined) : serviceError("Usuário não encontrado.");
}