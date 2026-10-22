"use client";

import { ArrowLeft, Camera, CheckCircle2, ChevronDown, FileText, Loader2, PlayCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { PhotoUploader } from "@/components/photo-uploader";
import { PhotoGallery } from "@/components/photo-gallery";
import { saveInspectionResponsesAction, completeInspectionAction, startInspectionAction } from "@/server/actions/inspections";
import { inspectionResultLabels, inspectionStatusLabels, inspectionStatusTone } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { initialActionState } from "@/server/actions/state";
import { useActionState } from "react";

type ResponseItem = {
  id: string;
  templateItem: {
    id: string;
    label: string;
    helpText: string | null;
    type: string;
    required: boolean;
    requiresPhotoOnFail: boolean;
    minValue: number | null;
    maxValue: number | null;
    unit: string | null;
  };
  result: string | null;
  textValue: string | null;
  numberValue: number | null;
  notes: string | null;
  attachments: { id: string; url: string; fileName: string }[];
};

type InspectionData = {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
  template: { name: string; description: string | null };
  asset: {
    tag: string;
    name: string | null;
    site: {
      name: string;
      city: string | null;
      state: string | null;
    };
  };
  technician: { id: string; name: string } | null;
  technicianId: string | null;
  scheduledFor: string | null;
  startedAt: string | null;
  user: { id: string; role: "ADMIN" | "TECHNICIAN" };
  responses: ResponseItem[];
};

function InspectionItem({
  item,
  index,
  onChange,
  disabled,
}: {
  item: ResponseItem;
  index: number;
  onChange: (id: string, field: keyof ResponseItem, value: unknown) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const t = item.templateItem;
  const hasPhotos = item.attachments.length > 0;

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 p-3 bg-muted/30"
        disabled={disabled}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="font-medium truncate">{t.label}</p>
            {t.helpText && <p className="text-xs text-muted-foreground">{t.helpText}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.result && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                item.result === "OK" ? "bg-green-100 text-green-800" :
                item.result === "NOT_OK" ? "bg-red-100 text-red-800" :
                "bg-slate-100 text-slate-800"
              }`}
            >
              {inspectionResultLabels[item.result as keyof typeof inspectionResultLabels]}
            </span>
          )}
          {hasPhotos && (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <Camera aria-hidden className="size-3" />
              {item.attachments.length}
            </span>
          )}
          <ChevronDown aria-hidden className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="p-3 space-y-3 bg-background">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Resultado</Label>
              <NativeSelect
                value={item.result ?? ""}
                onChange={(e) => onChange(item.id, "result", e.target.value)}
                disabled={disabled}
              >
                <option value="">— Selecione —</option>
                <option value="OK">Conforme</option>
                <option value="NOT_OK">Não conforme</option>
                <option value="NA">Não se aplica</option>
              </NativeSelect>
            </div>

            {t.type === "NUMBER" && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Valor</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={item.numberValue ?? ""}
                  onChange={(e) => onChange(item.id, "numberValue", e.target.value ? Number(e.target.value) : null)}
                  disabled={disabled}
                  placeholder={t.minValue !== null || t.maxValue !== null ? `Mín: ${t.minValue ?? "—"} | Máx: ${t.maxValue ?? "—"}` : ""}
                />
                {t.unit && <span className="text-xs text-muted-foreground">Unidade: {t.unit}</span>}
              </div>
            )}

            {t.type === "TEXT" && (
              <div className="sm:col-span-2 flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Texto</Label>
                <Input
                  value={item.textValue ?? ""}
                  onChange={(e) => onChange(item.id, "textValue", e.target.value)}
                  disabled={disabled}
                  placeholder="Digite a observação ou medição"
                />
              </div>
            )}

            <div className="sm:col-span-2 flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Input
                value={item.notes ?? ""}
                onChange={(e) => onChange(item.id, "notes", e.target.value)}
                disabled={disabled}
                placeholder="Notas adicionais…"
              />
            </div>

            <div className="sm:col-span-2">
              <PhotoUploader
                target={{ inspectionResponseId: item.id }}
                disabled={disabled}
                hint={`Máx. 5 fotos por item`}
              />
              {item.attachments.length > 0 && (
                <PhotoGallery photos={item.attachments} canDelete={!disabled} emptyText="" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CampoInspectionExecutePage({ params }: { params: Promise<{ id: string }> }) {
  // All hooks must be called unconditionally at the top level
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localResponses, setLocalResponses] = useState<ResponseItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [startState, startAction] = useActionState(startInspectionAction, initialActionState);
  const [completeState, completeAction] = useActionState(completeInspectionAction, initialActionState);

  // Fetch inspection data
  useEffect(() => {
    let mounted = true;
    async function fetchInspection() {
      try {
        const { id } = await params;
        const res = await fetch(`/api/campo/inspecoes/${id}`);
        if (!res.ok) throw new Error("Inspeção não encontrada");
        const data = await res.json();
        if (mounted) {
          setInspection(data);
          setLocalResponses(data.responses ?? []);
        }
      } catch {
        if (mounted) setError("Erro ao carregar inspeção");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchInspection();
    return () => { mounted = false; };
  }, [params]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-destructive">{error ?? "Inspeção não encontrada"}</p>
        <Link href="/campo/inspecoes" className="text-center text-primary hover:underline">
          Voltar para inspeções
        </Link>
      </div>
    );
  }

  const user = inspection.user;
  const isTechnician = user.role === "TECHNICIAN";
  const canExecute = isTechnician ? inspection.technicianId === user.id : true;
  const isPending = inspection.status === "PENDING";
  const isInProgress = inspection.status === "IN_PROGRESS";
  const isCompleted = inspection.status === "COMPLETED";
  const isCanceled = inspection.status === "CANCELED";
  const canEdit = (isPending || isInProgress) && canExecute;

  const updateResponse = (respId: string, field: keyof ResponseItem, value: unknown) => {
    setLocalResponses((prev) =>
      prev.map((r) => (r.id === respId ? { ...r, [field]: value } : r)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = localResponses.map((r) => ({
      id: r.id,
      result: r.result ?? undefined,
      textValue: r.textValue ?? undefined,
      numberValue: r.numberValue ?? undefined,
      notes: r.notes ?? undefined,
    }));
    const formData = new FormData();
    formData.append("id", inspection.id);
    formData.append("responses", JSON.stringify(payload));
    await saveInspectionResponsesAction(initialActionState, formData);
    setSaving(false);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("id", inspection.id);
    startAction(formData);
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("id", inspection.id);
    completeAction(formData);
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/campo/inspecoes"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para inspeções
      </Link>

      <PageHeader
        title={inspection.template.name}
        description={inspection.template.description ?? undefined}
        action={
          <div className="flex items-center gap-2">
            {!isCanceled && (
              <Link
                href={`/app/inspecoes/${inspection.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver na gestão
              </Link>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-lg">{inspection.asset.tag}</CardTitle>
            {inspection.asset.name && <span className="text-sm text-muted-foreground">{inspection.asset.name}</span>}
            <StatusBadge tone={inspectionStatusTone[inspection.status]}>
              {inspectionStatusLabels[inspection.status]}
            </StatusBadge>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span>{inspection.asset.site.name}</span>
            {inspection.asset.site.city && <span>{inspection.asset.site.city}, {inspection.asset.site.state}</span>}
            {inspection.technician && <span>Técnico: {inspection.technician.name}</span>}
            {inspection.scheduledFor && <span>Agendada: {formatDate(inspection.scheduledFor)}</span>}
            {inspection.startedAt && <span>Iniciada: {formatDateTime(inspection.startedAt)}</span>}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!isPending && !isInProgress && !isCompleted ? (
            <div className="text-center py-8 text-muted-foreground">
              <XCircle aria-hidden className="size-12 mx-auto mb-2 text-destructive/50" />
              <p>Esta inspeção está {inspection.status === "CANCELED" ? "cancelada" : "finalizada"} e não pode ser editada.</p>
            </div>
          ) : (
            <>
              {isPending && canExecute && (
                <form onSubmit={handleStart}>
                  <input type="hidden" name="id" value={inspection.id} />
                  <button type="submit" disabled={!!(startState.error || startState.success)} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    <PlayCircle aria-hidden className="size-5" />
                    {startState.error || startState.success ? "Processando…" : "Iniciar inspeção"}
                  </button>
                  {startState.error && <p role="alert" className="text-sm text-destructive mt-2">{startState.error}</p>}
                  {startState.success && <p role="status" className="text-sm text-green-700 mt-2">{startState.success}</p>}
                </form>
              )}

              {(isInProgress || isCompleted) && (
                <div className="space-y-3">
                  {localResponses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum item neste checklist.</p>
                  ) : (
                    localResponses.map((r, i) => (
                      <InspectionItem
                        key={r.id}
                        item={r}
                        index={i}
                        onChange={updateResponse}
                        disabled={!canEdit}
                      />
                    ))
                  )}

                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                      >
                        {saving ? <Loader2 aria-hidden className="animate-spin size-4" /> : <CheckCircle2 aria-hidden className="size-4" />}
                        {saving ? "Salvando…" : "Salvar respostas"}
                      </button>
                    )}

                    {isInProgress && canEdit && (
                      <form onSubmit={handleComplete} className="flex-1 sm:w-auto">
                        <button
                          type="submit"
                          disabled={!!(completeState.error || completeState.success)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <FileText aria-hidden className="size-4" />
                          Concluir inspeção
                        </button>
                        {completeState.error && <p role="alert" className="text-sm text-destructive w-full">{completeState.error}</p>}
                        {completeState.success && <p role="status" className="text-sm text-green-700 w-full">{completeState.success}</p>}
                      </form>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}