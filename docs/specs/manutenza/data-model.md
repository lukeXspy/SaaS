# Manutenza — Modelo de dados (Prisma / PostgreSQL)

Convenções:
- Toda entidade de negócio carrega `companyId` (tenant). Exceção: `PasswordResetToken` (infra de auth, escopado por `userId`).
- Nada é apagado fisicamente: `isActive`, `status = CANCELED`, arquivamento.
- Enums em inglês; rótulos pt-BR em `src/lib/labels.ts`.
- Índices compostos começam por `companyId`, porque toda consulta é escopada.
- `Decimal` só onde precisa (quantidade, coordenadas). Não há dinheiro no MVP.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────────────────────────────────
// TENANT
// ─────────────────────────────────────────────────────────────

model Company {
  id                String   @id @default(cuid())
  name              String
  legalName         String?
  document          String? // CNPJ/CPF sem máscara
  email             String?
  phone             String?
  logoUrl           String?
  timezone          String   @default("America/Sao_Paulo")
  reportFooter      String?
  workOrderSequence Int      @default(0) // contador atômico de OS
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  users               User[]
  clients             Client[]
  sites               Site[]
  assets              Asset[]
  checklistTemplates  ChecklistTemplate[]
  checklistItems      ChecklistTemplateItem[]
  inspections         Inspection[]
  inspectionResponses InspectionResponse[]
  workOrders          WorkOrder[]
  executions          WorkOrderExecution[]
  workOrderItems      WorkOrderItem[]
  statusHistory       WorkOrderStatusHistory[]
  attachments         Attachment[]
  invites             Invite[]

  @@index([name])
}

// ─────────────────────────────────────────────────────────────
// PESSOAS E ACESSO
// ─────────────────────────────────────────────────────────────

model User {
  id           String    @id @default(cuid())
  companyId    String
  company      Company   @relation(fields: [companyId], references: [id], onDelete: Restrict)
  name         String
  email        String    @unique // login global; 1 empresa por usuário no MVP
  passwordHash String? // null enquanto convite não aceito
  role         UserRole  @default(TECHNICIAN)
  phone        String?
  isActive     Boolean   @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  assignedWorkOrders WorkOrder[]             @relation("WorkOrderAssignee")
  createdWorkOrders  WorkOrder[]             @relation("WorkOrderCreator")
  executions         WorkOrderExecution[]
  inspections        Inspection[]            @relation("InspectionTechnician")
  attachments        Attachment[]
  invitesSent        Invite[]                @relation("InviteSender")
  statusChanges      WorkOrderStatusHistory[]
  resetTokens        PasswordResetToken[]

  @@index([companyId, role])
  @@index([companyId, isActive])
}

model Invite {
  id          String    @id @default(cuid())
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Restrict)
  email       String
  role        UserRole  @default(TECHNICIAN)
  token       String    @unique
  expiresAt   DateTime
  acceptedAt  DateTime?
  invitedById String
  invitedBy   User      @relation("InviteSender", fields: [invitedById], references: [id], onDelete: Restrict)
  createdAt   DateTime  @default(now())

  @@unique([companyId, email])
  @@index([companyId, acceptedAt])
}

model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([expiresAt])
}

// ─────────────────────────────────────────────────────────────
// CLIENTES / LOCAIS / ATIVOS
// ─────────────────────────────────────────────────────────────

model Client {
  id        String   @id @default(cuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Restrict)
  name      String
  tradeName String?
  document  String?
  email     String?
  phone     String?
  notes     String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sites      Site[]
  workOrders WorkOrder[]

  @@index([companyId, name])
  @@index([companyId, isActive])
}

model Site {
  id           String   @id @default(cuid())
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id], onDelete: Restrict)
  clientId     String
  client       Client   @relation(fields: [clientId], references: [id], onDelete: Restrict)
  name         String // "Loja Centro", "Galpão 2"
  addressLine  String
  number       String?
  complement   String?
  district     String?
  city         String
  state        String // UF
  postalCode   String?
  latitude     Decimal? @db.Decimal(10, 7)
  longitude    Decimal? @db.Decimal(10, 7)
  contactName  String?
  contactPhone String?
  notes        String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  assets     Asset[]
  workOrders WorkOrder[]

  @@index([companyId, clientId])
  @@index([companyId, city])
}

model Asset {
  id               String        @id @default(cuid())
  companyId        String
  company          Company       @relation(fields: [companyId], references: [id], onDelete: Restrict)
  siteId           String
  site             Site          @relation(fields: [siteId], references: [id], onDelete: Restrict)
  tag              String // código interno: "CH-001"
  name             String
  category         AssetCategory @default(OTHER)
  manufacturer     String?
  model            String?
  serialNumber     String?
  installationDate DateTime?     @db.Date
  warrantyUntil    DateTime?     @db.Date
  criticality      Criticality   @default(MEDIUM)
  status           AssetStatus   @default(ACTIVE)
  locationNote     String? // "3º andar, sala 12"
  notes            String?
  qrToken          String        @unique @default(cuid()) // curto na URL: /a/{qrToken}
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  workOrders  WorkOrder[]
  inspections Inspection[]
  attachments Attachment[]

  @@unique([companyId, tag])
  @@index([companyId, siteId])
  @@index([companyId, serialNumber])
  @@index([companyId, status, category])
  @@index([companyId, name])
}

// ─────────────────────────────────────────────────────────────
// CHECKLISTS
// ─────────────────────────────────────────────────────────────

model ChecklistTemplate {
  id          String        @id @default(cuid())
  companyId   String
  company     Company       @relation(fields: [companyId], references: [id], onDelete: Restrict)
  name        String
  description String?
  category    AssetCategory? // null = serve qualquer ativo
  isActive    Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  items       ChecklistTemplateItem[]
  inspections Inspection[]

  @@index([companyId, isActive])
  @@index([companyId, category])
}

model ChecklistTemplateItem {
  id                  String            @id @default(cuid())
  companyId           String
  company             Company           @relation(fields: [companyId], references: [id], onDelete: Restrict)
  templateId          String
  template            ChecklistTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  position            Int // 1000, 2000... permite reordenar sem colisão
  label               String
  helpText            String?
  type                ChecklistItemType
  required            Boolean           @default(true)
  requiresPhotoOnFail Boolean           @default(false)
  minValue            Decimal?          @db.Decimal(12, 3)
  maxValue            Decimal?          @db.Decimal(12, 3)
  unit                String? // "°C", "bar", "V"
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  responses InspectionResponse[]

  @@index([templateId, position])
  @@index([companyId, templateId])
}

// ─────────────────────────────────────────────────────────────
// ORDENS DE SERVIÇO
// ─────────────────────────────────────────────────────────────

model WorkOrder {
  id          String            @id @default(cuid())
  companyId   String
  company     Company           @relation(fields: [companyId], references: [id], onDelete: Restrict)
  number      Int // sequencial por empresa
  title       String
  description String?
  type        WorkOrderType
  priority    WorkOrderPriority @default(MEDIUM)
  status      WorkOrderStatus   @default(OPEN)

  clientId String
  client   Client @relation(fields: [clientId], references: [id], onDelete: Restrict)
  siteId   String
  site     Site   @relation(fields: [siteId], references: [id], onDelete: Restrict)
  assetId  String?
  asset    Asset? @relation(fields: [assetId], references: [id], onDelete: Restrict)

  assignedToId String?
  assignedTo   User?   @relation("WorkOrderAssignee", fields: [assignedToId], references: [id], onDelete: Restrict)
  createdById  String
  createdBy    User    @relation("WorkOrderCreator", fields: [createdById], references: [id], onDelete: Restrict)

  dueAt       DateTime? // prazo
  scheduledAt DateTime?
  startedAt   DateTime?
  completedAt DateTime?
  canceledAt  DateTime?
  cancelReason String?

  // inspeção executada como corpo desta OS (1:1)
  inspection Inspection? @relation("WorkOrderInspection")

  // OS gerada a partir de item reprovado
  originInspectionId String?
  originInspection   Inspection? @relation("InspectionGeneratedWorkOrders", fields: [originInspectionId], references: [id], onDelete: SetNull)

  execution     WorkOrderExecution?
  items         WorkOrderItem[]
  attachments   Attachment[]
  statusHistory WorkOrderStatusHistory[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([companyId, number])
  @@index([companyId, status, dueAt])
  @@index([companyId, assignedToId, status])
  @@index([companyId, clientId, status])
  @@index([companyId, type, status])
  @@index([companyId, createdAt])
  @@index([originInspectionId])
}

model WorkOrderStatusHistory {
  id          String           @id @default(cuid())
  companyId   String
  company     Company          @relation(fields: [companyId], references: [id], onDelete: Restrict)
  workOrderId String
  workOrder   WorkOrder        @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  fromStatus  WorkOrderStatus?
  toStatus    WorkOrderStatus
  changedById String?
  changedBy   User?            @relation(fields: [changedById], references: [id], onDelete: SetNull)
  note        String?
  createdAt   DateTime         @default(now())

  @@index([companyId, workOrderId, createdAt])
}

model WorkOrderExecution {
  id                String    @id @default(cuid())
  companyId         String
  company           Company   @relation(fields: [companyId], references: [id], onDelete: Restrict)
  workOrderId       String    @unique
  workOrder         WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  technicianId      String
  technician        User      @relation(fields: [technicianId], references: [id], onDelete: Restrict)
  startedAt         DateTime?
  finishedAt        DateTime?
  laborMinutes      Int?
  diagnosis         String?
  solution          String?
  observations      String?
  signedByName      String?
  signedAt          DateTime?
  signatureUrl      String? // storageKey da assinatura (canvas → PNG)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  attachments Attachment[]

  @@index([companyId, technicianId])
}

model WorkOrderItem {
  id          String           @id @default(cuid())
  companyId   String
  company     Company          @relation(fields: [companyId], references: [id], onDelete: Restrict)
  workOrderId String
  workOrder   WorkOrder        @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  kind        WorkOrderItemKind
  description String
  quantity    Decimal          @default(1) @db.Decimal(12, 3)
  unit        String? // "un", "m", "h"
  notes       String?
  position    Int              @default(0)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([companyId, workOrderId])
}

// ─────────────────────────────────────────────────────────────
// INSPEÇÕES
// ─────────────────────────────────────────────────────────────

model Inspection {
  id           String           @id @default(cuid())
  companyId    String
  company      Company          @relation(fields: [companyId], references: [id], onDelete: Restrict)
  assetId      String
  asset        Asset            @relation(fields: [assetId], references: [id], onDelete: Restrict)
  templateId   String
  template     ChecklistTemplate @relation(fields: [templateId], references: [id], onDelete: Restrict)
  technicianId String?
  technician   User?            @relation("InspectionTechnician", fields: [technicianId], references: [id], onDelete: Restrict)

  // quando a inspeção é o corpo de uma OS do tipo INSPECTION
  workOrderId String?    @unique
  workOrder   WorkOrder? @relation("WorkOrderInspection", fields: [workOrderId], references: [id], onDelete: SetNull)

  status         InspectionStatus @default(PENDING)
  scheduledFor   DateTime?
  startedAt      DateTime?
  completedAt    DateTime?
  notes          String?
  scorePercent   Int? // % de itens OK entre os respondidos (N/A não conta)
  failedItemCount Int             @default(0)
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  responses           InspectionResponse[]
  generatedWorkOrders WorkOrder[]          @relation("InspectionGeneratedWorkOrders")

  @@index([companyId, status, scheduledFor])
  @@index([companyId, technicianId, status])
  @@index([companyId, assetId])
}

model InspectionResponse {
  id             String                 @id @default(cuid())
  companyId      String
  company        Company                @relation(fields: [companyId], references: [id], onDelete: Restrict)
  inspectionId   String
  inspection     Inspection             @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  templateItemId String
  templateItem   ChecklistTemplateItem  @relation(fields: [templateItemId], references: [id], onDelete: Restrict)
  result         InspectionResult? // null = ainda não respondido
  textValue      String?
  numberValue    Decimal?               @db.Decimal(12, 3)
  notes          String?
  respondedAt    DateTime?
  createdAt      DateTime               @default(now())
  updatedAt      DateTime               @updatedAt

  attachments Attachment[]

  @@unique([inspectionId, templateItemId])
  @@index([companyId, inspectionId])
  @@index([companyId, result])
}

// ─────────────────────────────────────────────────────────────
// ANEXOS
// ─────────────────────────────────────────────────────────────

model Attachment {
  id          String         @id @default(cuid())
  companyId   String
  company     Company        @relation(fields: [companyId], references: [id], onDelete: Restrict)
  kind        AttachmentKind
  storageKey  String         @unique // "{companyId}/{entidade}/{id}.jpg"
  fileName    String
  mimeType    String
  sizeBytes   Int
  width       Int?
  height      Int?

  workOrderId          String?
  workOrder            WorkOrder?            @relation(fields: [workOrderId], references: [id], onDelete: SetNull)
  executionId          String?
  execution            WorkOrderExecution?   @relation(fields: [executionId], references: [id], onDelete: SetNull)
  inspectionId         String?
  inspection           Inspection?           @relation(fields: [inspectionId], references: [id], onDelete: SetNull)
  inspectionResponseId String?
  inspectionResponse   InspectionResponse?   @relation(fields: [inspectionResponseId], references: [id], onDelete: SetNull)
  assetId              String?
  asset                Asset?                @relation(fields: [assetId], references: [id], onDelete: SetNull)
  uploadedById         String?
  uploadedBy           User?                 @relation(fields: [uploadedById], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())

  @@index([companyId, workOrderId])
  @@index([companyId, executionId])
  @@index([companyId, inspectionId])
  @@index([companyId, inspectionResponseId])
  @@index([companyId, assetId])
}

// ─────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────

enum UserRole {
  ADMIN
  TECHNICIAN
}

enum AssetCategory {
  ELECTRICAL
  REFRIGERATION
  HVAC
  AUTOMATION
  MECHANICAL
  CIVIL
  OTHER
}

enum AssetStatus {
  ACTIVE
  INACTIVE
  DECOMMISSIONED
}

enum Criticality {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum WorkOrderType {
  CORRECTIVE
  PREVENTIVE
  INSPECTION
}

enum WorkOrderPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum WorkOrderStatus {
  OPEN
  IN_PROGRESS
  WAITING_PARTS
  DONE
  CANCELED
}

enum WorkOrderItemKind {
  SERVICE
  PART
}

enum ChecklistItemType {
  TRI_STATE // OK / Não OK / N/A
  TEXT
  NUMBER
  PHOTO
}

enum InspectionResult {
  OK
  NOT_OK
  NA
}

enum InspectionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELED
}

enum AttachmentKind {
  PHOTO
  SIGNATURE
  DOCUMENT
}
```

## Regras de integridade que o schema não expressa (ficam no service)

1. `Site.clientId` precisa pertencer ao mesmo `Client` informado na OS.
2. `Asset.siteId` precisa pertencer ao mesmo `Site` da OS (quando houver ativo).
3. Transições de status permitidas — ver `work-order-status.ts`.
4. Técnico só pode ser atribuído se `role = TECHNICIAN` e `isActive = true` (ou ADMIN, se o dono também executa — decisão pendente).
5. `Company.workOrderSequence` incrementado em transação com a criação da OS.
6. `Inspection.completedAt` só é preenchido quando todos os itens `required` foram respondidos e os `NOT_OK` que exigem foto têm foto.
7. Geração de OS a partir de inspeção é idempotente: no máximo uma OS por item reprovado (`failedItemCount` + tabela de origem), protegida por transação.
8. `Attachment` deve ter exatamente um vínculo (workOrder, execution, inspection, inspectionResponse ou asset) — validar no service; opcionalmente CHECK no Postgres.

## Decisão de migração futura

Se uma pessoa precisar atuar em mais de uma empresa, entrará uma tabela `Membership (userId, companyId, role)` e `User.companyId` sai. O schema atual concentra o vínculo em `User`, então a migração afeta auth e guards — está isolada em `src/server/auth` e `src/server/permissions`.
