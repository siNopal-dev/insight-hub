export type User = {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  department: string | null;
  access_group_id: string | null;
  access_group: string | null;
  all_categories: boolean;
};
export type Category = { id: string; name: string; slug: string };
export type Report = {
  id: string;
  title: string;
  category_id: string;
  category: string;
  description: string;
  embed_url: string;
  created_at: string;
  updated_at: string | null;
};
