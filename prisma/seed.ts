import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;

function daysFromNow(days: number, hour = 9): Date {
  const date = new Date(Date.now() + days * DAY);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  const passwordHash = await hash("Senha1234", 10);

  // ── Empresa A (demo principal) ─────────────────────────────
  const companyA = await prisma.company.upsert({
    where: { id: "seed_company_a" },
    update: { workOrderSequence: 2 },
    create: {
      id: "seed_company_a",
      name: "Manutenção Alfa",
      legalName: "Alfa Manutenção Predial Ltda.",
      email: "contato@alfa.test",
      phone: "(11) 99999-0001",
      reportFooter: "Alfa Manutenção Predial · (11) 99999-0001 · contato@alfa.test",
      workOrderSequence: 2,
    },
  });

  const adminA = await prisma.user.upsert({
    where: { email: "admin@a.test" },
    update: { companyId: companyA.id, role: "ADMIN", passwordHash, isActive: true },
    create: {
      companyId: companyA.id,
      name: "Ana Administradora",
      email: "admin@a.test",
      passwordHash,
      role: "ADMIN",
      phone: "(11) 99999-0001",
    },
  });

  const techA = await prisma.user.upsert({
    where: { email: "tecnico@a.test" },
    update: { companyId: companyA.id, role: "TECHNICIAN", passwordHash, isActive: true },
    create: {
      companyId: companyA.id,
      name: "Carlos Técnico",
      email: "tecnico@a.test",
      passwordHash,
      role: "TECHNICIAN",
      phone: "(11) 99999-0002",
    },
  });

  const clientA = await prisma.client.upsert({
    where: { id: "seed_client_a" },
    update: {},
    create: {
      id: "seed_client_a",
      companyId: companyA.id,
      name: "Condomínio Jardim das Flores",
      tradeName: "Jardim das Flores",
      document: "12.345.678/0001-90",
      email: "sindico@jardim.test",
      phone: "(11) 3333-1000",
      notes: "Atendimento somente em horário comercial.",
    },
  });

  const siteA = await prisma.site.upsert({
    where: { id: "seed_site_a" },
    update: {},
    create: {
      id: "seed_site_a",
      companyId: companyA.id,
      clientId: clientA.id,
      name: "Torre A — Área comum",
      addressLine: "Rua das Acácias",
      number: "120",
      district: "Centro",
      city: "São Paulo",
      state: "SP",
      postalCode: "01000-000",
      contactName: "Marcos Síndico",
      contactPhone: "(11) 98888-1000",
    },
  });

  const assetSplit = await prisma.asset.upsert({
    where: { companyId_tag: { companyId: companyA.id, tag: "AR-001" } },
    update: {},
    create: {
      companyId: companyA.id,
      siteId: siteA.id,
      tag: "AR-001",
      name: "Split 12.000 BTU — Sala 2",
      category: "HVAC",
      manufacturer: "LG",
      model: "Dual Inverter",
      serialNumber: "LG-2024-001",
      criticality: "HIGH",
      status: "ACTIVE",
      locationNote: "Sala de reuniões, parede leste",
    },
  });

  await prisma.asset.upsert({
    where: { companyId_tag: { companyId: companyA.id, tag: "RF-001" } },
    update: {},
    create: {
      companyId: companyA.id,
      siteId: siteA.id,
      tag: "RF-001",
      name: "Câmara fria — estoque",
      category: "REFRIGERATION",
      manufacturer: "Metalfrio",
      model: "CF-500",
      serialNumber: "MF-2022-114",
      criticality: "CRITICAL",
      status: "ACTIVE",
      locationNote: "Depósito, fundos",
    },
  });

  const template = await prisma.checklistTemplate.upsert({
    where: { id: "seed_template_hvac" },
    update: {},
    create: {
      id: "seed_template_hvac",
      companyId: companyA.id,
      name: "Preventiva mensal — Split",
      description: "Checklist padrão para manutenção preventiva de ar-condicionado split.",
      category: "HVAC",
      items: {
        create: [
          {
            companyId: companyA.id,
            position: 1,
            label: "Limpeza dos filtros",
            type: "TRI_STATE",
            required: true,
          },
          {
            companyId: companyA.id,
            position: 2,
            label: "Temperatura de insuflamento",
            type: "NUMBER",
            required: true,
            minValue: 10,
            maxValue: 16,
            unit: "°C",
          },
          {
            companyId: companyA.id,
            position: 3,
            label: "Aperto das conexões elétricas",
            type: "TRI_STATE",
            required: true,
          },
          {
            companyId: companyA.id,
            position: 4,
            label: "Registro fotográfico geral",
            type: "PHOTO",
            required: false,
          },
        ],
      },
    },
  });

  const templateItems = await prisma.checklistTemplateItem.findMany({
    where: { companyId: companyA.id, templateId: template.id },
    orderBy: { position: "asc" },
  });

  const woOpen = await prisma.workOrder.upsert({
    where: { companyId_number: { companyId: companyA.id, number: 1 } },
    update: {},
    create: {
      companyId: companyA.id,
      number: 1,
      title: "Split não gela — Sala 2",
      description: "Cliente relata que o equipamento liga, mas não refrigera.",
      type: "CORRECTIVE",
      priority: "HIGH",
      status: "OPEN",
      clientId: clientA.id,
      siteId: siteA.id,
      assetId: assetSplit.id,
      assignedToId: techA.id,
      createdById: adminA.id,
      dueAt: daysFromNow(2, 17),
      statusHistory: {
        create: {
          companyId: companyA.id,
          toStatus: "OPEN",
          changedById: adminA.id,
          note: "OS criada no seed.",
        },
      },
    },
  });

  const woDone = await prisma.workOrder.upsert({
    where: { companyId_number: { companyId: companyA.id, number: 2 } },
    update: {},
    create: {
      companyId: companyA.id,
      number: 2,
      title: "Preventiva mensal — Split Sala 2",
      description: "Manutenção preventiva conforme contrato.",
      type: "PREVENTIVE",
      priority: "MEDIUM",
      status: "DONE",
      clientId: clientA.id,
      siteId: siteA.id,
      assetId: assetSplit.id,
      assignedToId: techA.id,
      createdById: adminA.id,
      scheduledAt: daysFromNow(-5),
      startedAt: daysFromNow(-5, 10),
      completedAt: daysFromNow(-5, 11),
      statusHistory: {
        create: [
          { companyId: companyA.id, toStatus: "OPEN", changedById: adminA.id },
          {
            companyId: companyA.id,
            fromStatus: "OPEN",
            toStatus: "IN_PROGRESS",
            changedById: techA.id,
          },
          {
            companyId: companyA.id,
            fromStatus: "IN_PROGRESS",
            toStatus: "DONE",
            changedById: techA.id,
            note: "Serviço concluído e assinado pelo cliente.",
          },
        ],
      },
      execution: {
        create: {
          companyId: companyA.id,
          technicianId: techA.id,
          startedAt: daysFromNow(-5, 10),
          finishedAt: daysFromNow(-5, 11),
          laborMinutes: 60,
          diagnosis: "Filtros saturados e serpentina com poeira.",
          solution: "Filtros lavados, serpentina higienizada e dreno desobstruído.",
          observations: "Orientado o cliente a repetir a limpeza a cada 30 dias.",
          signedByName: "Marcos Síndico",
          signedAt: daysFromNow(-5, 11),
        },
      },
      items: {
        create: [
          {
            companyId: companyA.id,
            kind: "SERVICE",
            description: "Higienização completa do split",
            quantity: 1,
            unit: "serviço",
            position: 1,
          },
          {
            companyId: companyA.id,
            kind: "PART",
            description: "Fita de vedação",
            quantity: 1,
            unit: "un",
            position: 2,
          },
        ],
      },
    },
  });

  const inspection = await prisma.inspection.upsert({
    where: { id: "seed_inspection_a_1" },
    update: {},
    create: {
      id: "seed_inspection_a_1",
      companyId: companyA.id,
      assetId: assetSplit.id,
      templateId: template.id,
      technicianId: techA.id,
      status: "COMPLETED",
      scheduledFor: daysFromNow(-5),
      startedAt: daysFromNow(-5, 10),
      completedAt: daysFromNow(-5, 10),
      notes: "Inspeção feita junto com a preventiva.",
      scorePercent: 67,
      failedItemCount: 1,
      responses: {
        create: templateItems.map((item) => ({
          companyId: companyA.id,
          templateItemId: item.id,
          result: item.position === 3 ? "NOT_OK" : "OK",
          numberValue: item.type === "NUMBER" ? 12 : undefined,
          notes: item.position === 3 ? "Conexões com folga; reaperto recomendado." : undefined,
          respondedAt: daysFromNow(-5, 10),
        })),
      },
    },
  });

  // ── Empresa B (isolamento) ─────────────────────────────────
  const companyB = await prisma.company.upsert({
    where: { id: "seed_company_b" },
    update: {},
    create: {
      id: "seed_company_b",
      name: "Beta Serviços",
      email: "contato@beta.test",
      phone: "(21) 99999-0002",
    },
  });

  const adminB = await prisma.user.upsert({
    where: { email: "admin@b.test" },
    update: { companyId: companyB.id, role: "ADMIN", passwordHash, isActive: true },
    create: {
      companyId: companyB.id,
      name: "Bruno Beta",
      email: "admin@b.test",
      passwordHash,
      role: "ADMIN",
    },
  });

  const clientB = await prisma.client.upsert({
    where: { id: "seed_client_b" },
    update: {},
    create: {
      id: "seed_client_b",
      companyId: companyB.id,
      name: "Cliente Beta",
      email: "cliente@beta.test",
    },
  });

  const siteB = await prisma.site.upsert({
    where: { id: "seed_site_b" },
    update: {},
    create: {
      id: "seed_site_b",
      companyId: companyB.id,
      clientId: clientB.id,
      name: "Loja Centro",
      addressLine: "Av. Central",
      number: "45",
      city: "Rio de Janeiro",
      state: "RJ",
    },
  });

  await prisma.asset.upsert({
    where: { companyId_tag: { companyId: companyB.id, tag: "EL-001" } },
    update: {},
    create: {
      companyId: companyB.id,
      siteId: siteB.id,
      tag: "EL-001",
      name: "Quadro elétrico principal",
      category: "ELECTRICAL",
      criticality: "HIGH",
    },
  });

  console.log("Seed concluído.");
  console.log({
    empresaA: companyA.name,
    adminA: adminA.email,
    tecnicoA: techA.email,
    empresaB: companyB.name,
    adminB: adminB.email,
    ordens: [woOpen.number, woDone.number],
    inspecao: inspection.id,
  });
}

main()
  .catch((error) => {
    console.error("Falha no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
