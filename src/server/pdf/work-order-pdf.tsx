import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { formatDate, formatDateTime, formatMinutes, formatQuantity } from "@/lib/format";
import {
  workOrderItemKindLabels,
  workOrderPriorityLabels,
  workOrderStatusLabels,
  workOrderStatusTone,
  workOrderTypeLabels,
} from "@/lib/labels";
import type { getWorkOrder } from "@/server/services/work-orders";

export type WorkOrderPdfData = NonNullable<Awaited<ReturnType<typeof getWorkOrder>>>;

export type CompanyPdfData = {
  name: string;
  logoUrl: string | null;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 44,
    paddingHorizontal: 34,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1f2937",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
    paddingBottom: 10,
    marginBottom: 14,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 42, height: 42, objectFit: "contain" },
  company: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  documentLabel: { fontSize: 8, color: "#64748b", marginTop: 2, letterSpacing: 0.8 },
  osNumber: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right" },
  headerRight: { width: 250, alignItems: "flex-end" },
  osMeta: { fontSize: 8, color: "#64748b", textAlign: "right", marginTop: 2 },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 10 },
  badges: { flexDirection: "row", gap: 6, marginBottom: 12 },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    color: "#334155",
  },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#475569",
    marginBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 3,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  field: { width: "50%", marginBottom: 5, paddingRight: 10 },
  label: { fontSize: 7.5, color: "#64748b" },
  value: { fontSize: 9.5, color: "#0f172a" },
  block: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 7,
    marginBottom: 6,
  },
  paragraph: { fontSize: 9, color: "#0f172a" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    paddingVertical: 4,
    paddingHorizontal: 5,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  colDescription: { width: "56%" },
  colKind: { width: "16%" },
  colQty: { width: "12%", textAlign: "right" },
  colUnit: { width: "16%", textAlign: "right" },
  signatureRow: { flexDirection: "row", marginTop: 8, gap: 10 },
  signatureBox: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    padding: 6,
    minHeight: 74,
  },
  signatureImage: { height: 42, objectFit: "contain", marginBottom: 3 },
  signatureName: { fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  signatureHint: { fontSize: 7, color: "#64748b" },
  empty: { fontSize: 8.5, color: "#64748b", fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 34,
    right: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 5,
    fontSize: 7,
    color: "#64748b",
  },
});

function statusColor(status: WorkOrderPdfData["status"]) {
  const tone = workOrderStatusTone[status];
  if (tone === "success") return "#047857";
  if (tone === "warning") return "#b45309";
  if (tone === "info") return "#0369a1";
  return "#475569";
}

function copyText(value: string | null | undefined, fallback = "—") {
  return value && value.trim() ? value : fallback;
}

export function WorkOrderPdf({
  workOrder,
  company,
}: {
  workOrder: WorkOrderPdfData;
  company: CompanyPdfData;
}) {
  const generatedAt = formatDateTime(new Date());
  const execution = workOrder.execution;

  return (
    <Document
      title={`OS ${workOrder.number} — ${workOrder.title}`}
      author={company.name}
      creator="Manutenza"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              {company.logoUrl?.startsWith("http") ? (
                // eslint-disable-next-line jsx-a11y/alt-text -- componente do React PDF, não é uma tag HTML.
                <Image src={company.logoUrl} style={styles.logo} />
              ) : null}
              <View>
                <Text style={styles.company}>{company.name}</Text>
                <Text style={styles.documentLabel}>ORDEM DE SERVIÇO</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.osNumber}>OS #{workOrder.number}</Text>
            <Text style={styles.osMeta}>
              {workOrder.completedAt
                ? `Concluída em ${formatDateTime(workOrder.completedAt)}`
                : `Aberta em ${formatDateTime(workOrder.createdAt)}`}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{workOrder.title}</Text>

        <View style={styles.badges}>
          <Text style={styles.badge}>{workOrderTypeLabels[workOrder.type]}</Text>
          <Text style={styles.badge}>
            Prioridade {workOrderPriorityLabels[workOrder.priority].toLowerCase()}
          </Text>
          <Text style={{ ...styles.badge, color: statusColor(workOrder.status) }}>
            {workOrderStatusLabels[workOrder.status]}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente e local</Text>
          <View style={styles.grid}>
            <View style={styles.field}>
              <Text style={styles.label}>Cliente</Text>
              <Text style={styles.value}>{workOrder.client.name}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Local</Text>
              <Text style={styles.value}>
                {workOrder.site.name}
                {workOrder.site.city ? ` — ${workOrder.site.city}/${workOrder.site.state ?? ""}` : ""}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Ativo</Text>
              <Text style={styles.value}>
                {workOrder.asset
                  ? `${workOrder.asset.tag} — ${workOrder.asset.name}`
                  : "Sem ativo vinculado"}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Responsável</Text>
              <Text style={styles.value}>
                {workOrder.assignedTo?.name ?? "Não atribuído"}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Prazo</Text>
              <Text style={styles.value}>{formatDate(workOrder.dueAt)}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Agendada para</Text>
              <Text style={styles.value}>{formatDate(workOrder.scheduledAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solicitação</Text>
          <View style={styles.block}>
            <Text style={styles.paragraph}>
              {copyText(workOrder.description, "Sem descrição registrada.")}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Execução</Text>
          {execution ? (
            <>
              <View style={styles.grid}>
                <View style={styles.field}>
                  <Text style={styles.label}>Início</Text>
                  <Text style={styles.value}>{formatDateTime(execution.startedAt)}</Text>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Término</Text>
                  <Text style={styles.value}>{formatDateTime(execution.finishedAt)}</Text>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Tempo apontado</Text>
                  <Text style={styles.value}>{formatMinutes(execution.laborMinutes)}</Text>
                </View>
              </View>
              <View style={styles.block}>
                <Text style={styles.label}>Diagnóstico</Text>
                <Text style={styles.paragraph}>{copyText(execution.diagnosis)}</Text>
              </View>
              <View style={styles.block}>
                <Text style={styles.label}>Solução aplicada</Text>
                <Text style={styles.paragraph}>{copyText(execution.solution)}</Text>
              </View>
              {execution.observations ? (
                <View style={styles.block}>
                  <Text style={styles.label}>Observações</Text>
                  <Text style={styles.paragraph}>{execution.observations}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.empty}>Execução ainda não registrada.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços e peças</Text>
          {workOrder.items.length === 0 ? (
            <Text style={styles.empty}>Nenhum serviço ou peça lançado.</Text>
          ) : (
            <View>
              <View style={styles.tableHeader}>
                <Text style={styles.colDescription}>Descrição</Text>
                <Text style={styles.colKind}>Tipo</Text>
                <Text style={styles.colQty}>Qtd.</Text>
                <Text style={styles.colUnit}>Unidade</Text>
              </View>
              {workOrder.items.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={styles.colDescription}>{item.description}</Text>
                  <Text style={styles.colKind}>{workOrderItemKindLabels[item.kind]}</Text>
                  <Text style={styles.colQty}>{formatQuantity(item.quantity)}</Text>
                  <Text style={styles.colUnit}>{item.unit ?? "—"}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assinatura</Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              {execution?.signatureUrl?.startsWith("data:image/") ? (
                // eslint-disable-next-line jsx-a11y/alt-text -- componente do React PDF, não é uma tag HTML.
                <Image src={execution.signatureUrl} style={styles.signatureImage} />
              ) : (
                <Text style={styles.signatureHint}>Assinatura do cliente</Text>
              )}
              <Text style={styles.signatureName}>
                {execution?.signedByName ?? "__________________________"}
              </Text>
              <Text style={styles.signatureHint}>
                {execution?.signedAt
                  ? `Assinado em ${formatDateTime(execution.signedAt)}`
                  : "Aguardando assinatura"}
              </Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureHint}>Responsável técnico</Text>
              <Text style={styles.signatureName}>
                {workOrder.assignedTo?.name ?? workOrder.createdBy.name}
              </Text>
              <Text style={styles.signatureHint}>{company.name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>{company.name} · OS #{workOrder.number}</Text>
          <Text>Gerado por Manutenza em {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
}

export function renderWorkOrderPdf(
  workOrder: WorkOrderPdfData,
  company: CompanyPdfData,
) {
  return renderToBuffer(<WorkOrderPdf workOrder={workOrder} company={company} />);
}
