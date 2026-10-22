import type { AssetCategory, AssetStatus, UserRole } from "@prisma/client";

import { createTenantClient } from "@/server/db/tenant";
import { parseSaoPauloDate } from "@/lib/format";
import type { AssetInput } from "@/lib/validation/assets";

export type AssetFilters = {
  query?: string;
  category?: AssetCategory;
  status?: AssetStatus;
  siteId?: string;
};

export async function listAssets(companyId: string, filters: AssetFilters = {}) {
  const db = createTenantClient(companyId);
  const search = filters.query?.trim();

  return db.asset.findMany({
    where: {
      companyId,
      ...(search
        ? {
            OR: [
              { tag: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
              { serialNumber: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.siteId ? { siteId: filters.siteId } : {}),
    },
    orderBy: [{ status: "asc" }, { tag: "asc" }],
    include: {
      site: {
        select: {
          id: true,
          name: true,
          client: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function getAsset(companyId: string, id: string) {
  const db = createTenantClient(companyId);
  return db.asset.findFirst({
    where: { companyId, id },
    include: {
      site: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          client: { select: { id: true, name: true } },
        },
      },
    },
  });
}

/**
 * Ficha do ativo respeitando o escopo do usuário:
 * ADMIN vê tudo; TECHNICIAN apenas ativos vinculados a OS/inspeção dele.
 */
export async function getAssetForViewer(
  companyId: string,
  id: string,
  viewer: { userId: string; role: UserRole },
) {
  const db = createTenantClient(companyId);

  return db.asset.findFirst({
    where: {
      companyId,
      id,
      ...(viewer.role === "ADMIN"
        ? {}
        : {
            OR: [
              { workOrders: { some: { assignedToId: viewer.userId } } },
              { inspections: { some: { technicianId: viewer.userId } } },
            ],
          }),
    },
    include: {
      site: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          client: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function findAssetByQrToken(companyId: string, qrToken: string) {
  const db = createTenantClient(companyId);
  return db.asset.findFirst({
    where: { companyId, qrToken },
    select: { id: true },
  });
}

export async function listSiteOptions(companyId: string) {
  const db = createTenantClient(companyId);
  return db.site.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      client: { select: { name: true } },
    },
  });
}

export async function createAsset(companyId: string, data: AssetInput) {
  const db = createTenantClient(companyId);

  const site = await db.site.findFirst({
    where: { companyId, id: data.siteId },
    select: { id: true },
  });
  if (!site) return null;

  return db.asset.create({
    data: {
      companyId,
      siteId: data.siteId,
      tag: data.tag,
      name: data.name,
      category: data.category,
      criticality: data.criticality,
      status: data.status,
      manufacturer: data.manufacturer,
      model: data.model,
      serialNumber: data.serialNumber,
      locationNote: data.locationNote,
      installationDate: data.installationDate
        ? parseSaoPauloDate(data.installationDate)
        : null,
      warrantyUntil: data.warrantyUntil ? parseSaoPauloDate(data.warrantyUntil) : null,
      notes: data.notes,
    },
  });
}

export async function updateAsset(companyId: string, id: string, data: AssetInput) {
  const db = createTenantClient(companyId);

  const site = await db.site.findFirst({
    where: { companyId, id: data.siteId },
    select: { id: true },
  });
  if (!site) return false;

  const result = await db.asset.updateMany({
    where: { companyId, id },
    data: {
      siteId: data.siteId,
      tag: data.tag,
      name: data.name,
      category: data.category,
      criticality: data.criticality,
      status: data.status,
      manufacturer: data.manufacturer,
      model: data.model,
      serialNumber: data.serialNumber,
      locationNote: data.locationNote,
      installationDate: data.installationDate
        ? parseSaoPauloDate(data.installationDate)
        : null,
      warrantyUntil: data.warrantyUntil ? parseSaoPauloDate(data.warrantyUntil) : null,
      notes: data.notes,
    },
  });

  return result.count > 0;
}

export async function setAssetStatus(companyId: string, id: string, status: AssetStatus) {
  const db = createTenantClient(companyId);
  const result = await db.asset.updateMany({
    where: { companyId, id },
    data: { status },
  });
  return result.count > 0;
}
