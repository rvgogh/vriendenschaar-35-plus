-- Allow superusers to insert events
CREATE POLICY "Superusers can insert events" 
ON public.events 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'superuser'::app_role));

-- Allow superusers to update events
CREATE POLICY "Superusers can update events" 
ON public.events 
FOR UPDATE 
USING (has_role(auth.uid(), 'superuser'::app_role));

-- Allow superusers to delete events
CREATE POLICY "Superusers can delete events" 
ON public.events 
FOR DELETE 
USING (has_role(auth.uid(), 'superuser'::app_role));