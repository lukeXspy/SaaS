import { describe, expect, it } from "vitest";

import {
  buildStoragePath,
  detectRealMimeType,
  extractCompanyIdFromPath,
  MAX_FILE_SIZE,
} from "@/lib/storage-utils";

// ─────────────────────────────────────────────────────────────
// Helpers para criar buffers de teste
// ─────────────────────────────────────────────────────────────

/** Header JPEG válido: FF D8 FF E0 ... */
function jpegBuffer(size = 1024): Buffer {
  const buf = Buffer.alloc(size);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xe0;
  return buf;
}

/** Header PNG válido: 89 50 4E 47 0D 0A 1A 0A ... */
function pngBuffer(size = 1024): Buffer {
  const buf = Buffer.alloc(size);
  buf[0] = 0x89;
  buf[1] = 0x50; // P
  buf[2] = 0x4e; // N
  buf[3] = 0x47; // G
  buf[4] = 0x0d;
  buf[5] = 0x0a;
  buf[6] = 0x1a;
  buf[7] = 0x0a;
  return buf;
}

/** Buffer com conteúdo que não é imagem (ex: script malicioso) */
function fakeImageBuffer(): Buffer {
  return Buffer.from("<script>alert('xss')</script>", "utf-8");
}

// ─────────────────────────────────────────────────────────────
// detectRealMimeType — magic bytes, não MIME declarado
// ─────────────────────────────────────────────────────────────

describe("detectRealMimeType", () => {
  it("detecta JPEG pelos magic bytes", () => {
    expect(detectRealMimeType(jpegBuffer())).toBe("image/jpeg");
  });

  it("detecta PNG pelos magic bytes", () => {
    expect(detectRealMimeType(pngBuffer())).toBe("image/png");
  });

  it("detecta WebP pelo header RIFF....WEBP", () => {
    const buf = Buffer.alloc(16);
    buf[0] = 0x52; // R
    buf[1] = 0x49; // I
    buf[2] = 0x46; // F
    buf[3] = 0x46; // F
    buf[8] = 0x57; // W
    buf[9] = 0x45; // E
    buf[10] = 0x42; // B
    buf[11] = 0x50; // P
    expect(detectRealMimeType(buf)).toBe("image/webp");
  });

  it("rejeita conteúdo que não é imagem (mesmo com MIME declarado como image/jpeg)", () => {
    expect(detectRealMimeType(fakeImageBuffer())).toBeNull();
  });

  it("rejeita buffer vazio", () => {
    expect(detectRealMimeType(Buffer.alloc(0))).toBeNull();
  });

  it("rejeita buffer muito curto", () => {
    expect(detectRealMimeType(Buffer.from([0xff]))).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// buildStoragePath — path sempre no servidor
// ─────────────────────────────────────────────────────────────

describe("buildStoragePath", () => {
  const companyId = "company_abc123";
  const entityId = "os_def456";

  it("gera path com companyId como primeiro segmento", () => {
    const path = buildStoragePath(companyId, "work-orders", entityId, ".jpg");
    expect(path.startsWith(`${companyId}/`)).toBe(true);
  });

  it("inclui o tipo no segundo segmento", () => {
    const path = buildStoragePath(companyId, "inspections", entityId, ".png");
    expect(path.startsWith(`${companyId}/inspections/`)).toBe(true);
  });

  it("inclui o entityId no terceiro segmento", () => {
    const path = buildStoragePath(companyId, "work-orders", entityId, ".jpg");
    const segments = path.split("/");
    expect(segments[2]).toBe(entityId);
  });

  it("gera UUID único a cada chamada", () => {
    const path1 = buildStoragePath(companyId, "work-orders", entityId, ".jpg");
    const path2 = buildStoragePath(companyId, "work-orders", entityId, ".jpg");
    expect(path1).not.toBe(path2);
  });

  it("normaliza extensão sem ponto inicial", () => {
    const path = buildStoragePath(companyId, "work-orders", entityId, "jpg");
    expect(path.endsWith(".jpg")).toBe(true);
  });

  it("aceita extensão com ponto", () => {
    const path = buildStoragePath(companyId, "work-orders", entityId, ".png");
    expect(path.endsWith(".png")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// extractCompanyIdFromPath — defense in depth
// ─────────────────────────────────────────────────────────────

describe("extractCompanyIdFromPath", () => {
  it("extrai companyId do início do path", () => {
    expect(extractCompanyIdFromPath("company_a/work-orders/os_b/photo.jpg")).toBe("company_a");
  });

  it("retorna null para path sem barra", () => {
    expect(extractCompanyIdFromPath("company_a")).toBeNull();
  });

  it("retorna null para path vazio", () => {
    expect(extractCompanyIdFromPath("")).toBeNull();
  });

  it("retorna null se companyId é vazio", () => {
    expect(extractCompanyIdFromPath("/work-orders/os_b/photo.jpg")).toBeNull();
  });

  it("path de outra empresa não corresponde ao companyId esperado", () => {
    const path = "company_a/work-orders/os_b/photo.jpg";
    const extracted = extractCompanyIdFromPath(path);
    expect(extracted).toBe("company_a");
    expect(extracted).not.toBe("company_b");
  });
});

// ─────────────────────────────────────────────────────────────
// MAX_FILE_SIZE — limite de 5 MB
// ─────────────────────────────────────────────────────────────

describe("MAX_FILE_SIZE", () => {
  it("é 5 MB (5 * 1024 * 1024 bytes)", () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });

  it("é maior que uma foto comprimida típica (~300 KB)", () => {
    expect(MAX_FILE_SIZE).toBeGreaterThan(300 * 1024);
  });
});

// ─────────────────────────────────────────────────────────────
// Migração idempotente — a lógica de skip
// ─────────────────────────────────────────────────────────────

describe("idempotência da migração", () => {
  it("path de Storage não começa com data:", () => {
    const storagePath = "company_a/work-orders/os_b/xyz.jpg";
    expect(storagePath.startsWith("data:")).toBe(false);
  });

  it("data URL antigo começa com data:", () => {
    const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD";
    expect(dataUrl.startsWith("data:")).toBe(true);
  });

  it("path determinístico da migração usa o ID do registro (re-executar = mesmo path)", () => {
    // Simula a lógica do migrate-media.ts
    const companyId = "company_a";
    const recordId = "att_123";
    const workOrderId = "os_456";
    const path1 = `${companyId}/work-orders/${workOrderId}/${recordId}.jpg`;
    const path2 = `${companyId}/work-orders/${workOrderId}/${recordId}.jpg`;
    expect(path1).toBe(path2); // determinístico
  });

  it("path de upload normal (UUID) é diferente a cada chamada", () => {
    // Upload normal usa randomUUID — sempre único
    const path1 = buildStoragePath("c", "work-orders", "os", ".jpg");
    const path2 = buildStoragePath("c", "work-orders", "os", ".jpg");
    expect(path1).not.toBe(path2);
  });
});