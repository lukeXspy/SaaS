"use client";

import type { AssetCategory, AssetStatus, Criticality } from "@prisma/client";
import { useActionState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { NativeSelect } from "@/components/native-select";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  assetCategoryOptions,
  criticalityOptions,
  assetStatusLabels,
} from "@/lib/labels";
import { createAssetAction, updateAssetAction } from "@/server/actions/assets";
import { initialActionState } from "@/server/actions/state";

export type SiteOption = {
  id: string;
  name: string;
  clientName: string;
};

export type AssetFormData = {
  id: string;
  siteId: string;
  tag: string;
  name: string;
  category: AssetCategory;
  criticality: Criticality;
  status: AssetStatus;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  locationNote: string | null;
  installationDate: string | null;
  warrantyUntil: string | null;
  notes: string | null;
};

export function AssetForm({
  sites,
  asset,
}: {
  sites: SiteOption[];
  asset?: AssetFormData;
}) {
  const action = asset ? updateAssetAction : createAssetAction;
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {asset ? <input type="hidden" name="id" value={asset.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tag">TAG *</Label>
          <Input
            id="tag"
            name="tag"
            required
            maxLength={40}
            defaultValue={asset?.tag}
            placeholder="Ex.: CH-01"
            className="uppercase"
            autoCapitalize="characters"
            aria-invalid={Boolean(state.fieldErrors?.tag)}
          />
          <p className="text-xs text-muted-foreground">
            Identificação única do equipamento nesta empresa. Aparece no QR Code.
          </p>
          <FieldError errors={state.fieldErrors?.tag} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome do ativo *</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={120}
            defaultValue={asset?.name}
            placeholder="Ex.: Chiller principal"
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="siteId">Local *</Label>
        <NativeSelect
          id="siteId"
          name="siteId"
          required
          defaultValue={asset?.siteId ?? ""}
          aria-invalid={Boolean(state.fieldErrors?.siteId)}
        >
          <option value="" disabled>
            Selecione o local
          </option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.clientName} — {site.name}
            </option>
          ))}
        </NativeSelect>
        <FieldError errors={state.fieldErrors?.siteId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Categoria *</Label>
          <NativeSelect
            id="category"
            name="category"
            required
            defaultValue={asset?.category ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.category)}
          >
            <option value="" disabled>
              Selecione
            </option>
            {assetCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors?.category} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="criticality">Criticidade *</Label>
          <NativeSelect
            id="criticality"
            name="criticality"
            required
            defaultValue={asset?.criticality ?? "MEDIUM"}
            aria-invalid={Boolean(state.fieldErrors?.criticality)}
          >
            {criticalityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors?.criticality} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Situação *</Label>
          <NativeSelect
            id="status"
            name="status"
            required
            defaultValue={asset?.status ?? "ACTIVE"}
            aria-invalid={Boolean(state.fieldErrors?.status)}
          >
            {(Object.keys(assetStatusLabels) as AssetStatus[]).map((value) => (
              <option key={value} value={value}>
                {assetStatusLabels[value]}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors?.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="manufacturer">Fabricante</Label>
          <Input
            id="manufacturer"
            name="manufacturer"
            maxLength={80}
            defaultValue={asset?.manufacturer ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" name="model" maxLength={80} defaultValue={asset?.model ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="serialNumber">Número de série</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            maxLength={80}
            defaultValue={asset?.serialNumber ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2 sm:col-span-1">
          <Label htmlFor="locationNote">Localização detalhada</Label>
          <Input
            id="locationNote"
            name="locationNote"
            maxLength={120}
            defaultValue={asset?.locationNote ?? ""}
            placeholder="Ex.: Cobertura, sala de máquinas"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="installationDate">Data de instalação</Label>
          <Input
            id="installationDate"
            name="installationDate"
            type="date"
            defaultValue={asset?.installationDate ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.installationDate)}
          />
          <FieldError errors={state.fieldErrors?.installationDate} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="warrantyUntil">Garantia até</Label>
          <Input
            id="warrantyUntil"
            name="warrantyUntil"
            type="date"
            defaultValue={asset?.warrantyUntil ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.warrantyUntil)}
          />
          <FieldError errors={state.fieldErrors?.warrantyUntil} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="asset-notes">Observações técnicas</Label>
        <Textarea
          id="asset-notes"
          name="notes"
          rows={3}
          maxLength={1000}
          defaultValue={asset?.notes ?? ""}
          placeholder="Histórico, particularidades, cuidados…"
        />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton className="w-full sm:w-auto">
        {asset ? "Salvar alterações" : "Cadastrar ativo"}
      </SubmitButton>
    </form>
  );
}
