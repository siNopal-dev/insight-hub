// SQL fragments are internal constants. Only bind values from requests.
// A role never grants category access by itself. Both admin and user need an active group.
export const categoryAccess = `EXISTS (
  SELECT 1 FROM public.profiles ap
  JOIN public.access_groups ag ON ag.id=ap.access_group_id AND ag.is_active
  WHERE ap.id=$1::uuid AND ap.is_active
    AND ap.role IN ('admin','user')
    AND (ag.all_categories OR EXISTS (
      SELECT 1 FROM public.access_group_categories ac
      WHERE ac.access_group_id=ag.id AND ac.category_id=c.id
    ))
)`;
export const adminAccess = `EXISTS (
  SELECT 1 FROM public.profiles admin_profile
  WHERE admin_profile.id=$1::uuid AND admin_profile.is_active AND admin_profile.role='admin'
)`;
export const reportColumns = `r.id,r.title,r.category_id,c.name AS category,
  r.description,r.embed_url,r.created_at,r.updated_at`;
export const reportSelect = `SELECT ${reportColumns}
  FROM public.reports r JOIN public.report_categories c ON c.id=r.category_id
  WHERE r.is_active AND c.is_active AND ${categoryAccess}`;
