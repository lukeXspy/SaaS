import "server-only";

import { createTenantClient } from "@/server/db/tenant";
import type { ClientInput, SiteInput } from "@/lib/validation/clients";

export async function listClients(companyId: string, query?: string) {
  const db = createTenantClient(companyId);
  const search = query?.trim();

  return db.client.findMany({
    where: {
      companyId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { tradeName: { contains: search, mode: "insensitive" as const } },
              { document: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { sites: true } },
    },
  });
}

export async function getClient(companyId: string, id: string) {
  const db = createTenantClient(companyId);
  return db.client.findFirst({
    where: { companyId, id },
    include: {
      sites: {
        where: { companyId },
        orderBy: { name: "asc" },
        include: { _count: { select: { assets: true } } },
      },
    },
  });
}

export async function createClient(companyId: string, data: ClientInput) {
  const db = createTenantClient(companyId);
  return db.client.create({
    data: {
      companyId,
      name: data.name,
      tradeName: data.tradeName,
      document: data.document,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
    },
  });
}

export async function updateClient(companyId: string, id: string, data: ClientInput) {
  const db = createTenantClient(companyId);
  const result = await db.client.updateMany({
    where: { companyId, id },
    data: {
      name: data.name,
      tradeName: data.tradeName,
      document: data.document,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
    },
  });
  return result.count > 0;
}

export async function setClientActive(companyId: string, id: string, isActive: boolean) {
  const db = createTenantClient(companyId);
  const result = await db.client.updateMany({
    where: { companyId, id },
    data: { isActive },
  });
  return result.count > 0;
}

export async function listSites(companyId: string) {
  const db = createTenantClient(companyId);
  return db.site.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { assets: true } },
    },
  });
}

export async function getSite(companyId: string, id: string) {
  const db = createTenantClient(companyId);
  return db.site.findFirst({
    where: { companyId, id },
    include: { client: { select: { id: true, name: true } } },
  });
}

export async function createSite(companyId: string, data: SiteInput) {
  const db = createTenantClient(companyId);

  // Garante que o cliente pertence ao tenant antes de vincular.
  const client = await db.client.findFirst({
    where: { companyId, id: data.clientId },
    select: { id: true },
  });
  if (!client) return null;

  return db.site.create({
    data: {
      companyId,
      clientId: data.clientId,
      name: data.name,
      addressLine: data.addressLine,
      number: data.number,
      complement: data.complement,
      district: data.district,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      notes: data.notes,
    },
  });
}

export async function updateSite(companyId: string, id: string, data: SiteInput) {
  const db = createTenantClient(companyId);
  const result = await db.site.updateMany({
    where: { companyId, id },
    data: {
      clientId: data.clientId,
      name: data.name,
      addressLine: data.addressLine,
      number: data.number,
      complement: data.complement,
      district: data.district,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      notes: data.notes,
    },
  });
  return result.count > 0;
}

export async function setSiteActive(companyId: string, id: string, isActive: boolean) {
  const db = createTenantClient(companyId);
  const result = await db.site.updateMany({
    where: { companyId, id },
    data: { isActive },
  });
  return result.count > 0;
}
