export type User = { id: string; username: string; name: string; role: 'admin' | 'user' };
export type Report = { id: string; title: string; category: string; description: string; embed_url: string; created_at: string; updated_at: string | null };
export const categories = ['Penjualan', 'Keuangan', 'SDM', 'Operasional', 'Produksi', 'Lainnya'] as const;
