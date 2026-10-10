-- Migration: an SKU, once assigned, can never be changed or cleared.
-- Enforced in the database so no screen, script or manual query can
-- edit it by mistake. (Deleting a design is still allowed; its SKU is
-- simply retired, never reused.)
CREATE OR REPLACE FUNCTION prevent_design_sku_change() RETURNS trigger AS $$
BEGIN
  IF OLD.sku IS NOT NULL AND NEW.sku IS DISTINCT FROM OLD.sku THEN
    RAISE EXCEPTION 'SKU % is permanent and cannot be changed', OLD.sku;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS designs_sku_immutable ON designs;
CREATE TRIGGER designs_sku_immutable
  BEFORE UPDATE OF sku ON designs
  FOR EACH ROW EXECUTE FUNCTION prevent_design_sku_change();
