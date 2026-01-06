-- السماح للجميع بعرض الأيتام (بما في ذلك الزوار غير المسجلين)
CREATE POLICY "Anyone can view orphans" 
ON public.orphans 
FOR SELECT 
TO anon, authenticated
USING (true);