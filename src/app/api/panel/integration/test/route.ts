import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { editableTenantSession, unauthorized } from '@/lib/guards';
import { inspectExternalMenuSource } from '@/lib/external-menu';

const schema = z.object({ menuApiUrl: z.string().trim().min(8).max(2048) });

const messages: Record<string, string> = {
  INVALID_URL: 'API adresi geçerli veya güvenli değil.',
  CONNECTION_FAILED: 'API kaynağına ulaşılamadı ya da bağlantı zaman aşımına uğradı.',
  RESPONSE_TOO_LARGE: 'API yanıtı izin verilen 2 MB sınırını aşıyor.',
  INVALID_JSON: 'API geçerli bir JSON yanıtı döndürmedi.',
  INVALID_PAYLOAD: 'JSON içinde geçerli bir categories dizisi bulunamadı.',
  NO_PRODUCTS: 'Kategori yapısı bulundu ancak kullanılabilir ürün bulunamadı.',
  UNSAFE_RESPONSE_URL: 'API güvenli olmayan bir adrese yönlendirme yaptı.',
};

export async function POST(request: Request) {
  const context = await editableTenantSession();
  if (!context) return unauthorized();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT', message: 'Geçerli bir API adresi yazın.' }, { status: 400 });
  const tenant = await db.tenant.findUnique({ where: { id: context.session.tenantId }, select: { slug: true } });
  if (!tenant) return NextResponse.json({ error: 'TENANT_NOT_FOUND', message: 'İşletme hesabı bulunamadı.' }, { status: 404 });

  try {
    const result = await inspectExternalMenuSource(parsed.data.menuApiUrl, tenant.slug);
    return NextResponse.json({ data: { categoryCount: result.categoryCount, productCount: result.productCount, resolvedUrl: result.url } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'CONNECTION_FAILED';
    const status = code.startsWith('HTTP_') ? Number(code.slice(5)) : 422;
    return NextResponse.json({ error: code, message: code.startsWith('HTTP_') ? `API ${status} durum koduyla yanıt verdi.` : messages[code] || 'API bağlantısı doğrulanamadı.' }, { status: status >= 400 && status < 600 ? status : 422 });
  }
}
