-- Migration V4: Multi-stage status tracking
-- Allows multiple stages to be in progress simultaneously
-- Each stage can be: vacant, in-progress, or completed

-- Add stage_status JSONB column to track status of all stages
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS stage_status JSONB DEFAULT '{}';

-- Initialize stage_status for existing designs based on current status
-- Set all stages before current status as 'completed', current as 'in-progress', rest as 'vacant'
UPDATE designs 
SET stage_status = 
  CASE 
    WHEN status = 'Payment Received' THEN 
      '{"Payment Received": "in-progress", "Pattern": "vacant", "Grading": "vacant", "Cutting": "vacant", "Stitching": "vacant", "Kaaj": "vacant", "Embroidery": "vacant", "Wash": "vacant", "Finishing": "vacant", "Photoshoot": "vacant", "Final Settlement": "vacant", "Dispatch": "vacant"}'::jsonb
    WHEN status = 'Pattern' THEN 
      '{"Payment Received": "completed", "Pattern": "in-progress", "Grading": "vacant", "Cutting": "vacant", "Stitching": "vacant", "Kaaj": "vacant", "Embroidery": "vacant", "Wash": "vacant", "Finishing": "vacant", "Photoshoot": "vacant", "Final Settlement": "vacant", "Dispatch": "vacant"}'::jsonb
    WHEN status = 'Grading' THEN 
      '{"Payment Received": "completed", "Pattern": "completed", "Grading": "in-progress", "Cutting": "vacant", "Stitching": "vacant", "Kaaj": "vacant", "Embroidery": "vacant", "Wash": "vacant", "Finishing": "vacant", "Photoshoot": "vacant", "Final Settlement": "vacant", "Dispatch": "vacant"}'::jsonb
    WHEN status = 'Cutting' THEN 
      '{"Payment Received": "completed", "Pattern": "completed", "Grading": "completed", "Cutting": "in-progress", "Stitching": "vacant", "Kaaj": "vacant", "Embroidery": "vacant", "Wash": "vacant", "Finishing": "vacant", "Photoshoot": "vacant", "Final Settlement": "vacant", "Dispatch": "vacant"}'::jsonb
    WHEN status = 'Stitching' THEN 
      '{"Payment Received": "completed", "Pattern": "completed", "Grading": "completed", "Cutting": "completed", "Stitching": "in-progress", "Kaaj": "vacant", "Embroidery": "vacant", "Wash": "vacant", "Finishing": "vacant", "Photoshoot": "vacant", "Final Settlement": "vacant", "Dispatch": "vacant"}'::jsonb
    WHEN status = 'Kaaj' THEN 
      '{"Payment Received": "completed", "Pattern": "completed", "Grading": "completed", "Cutting": "completed", "Stitching": "completed", "Kaaj": "in-progress", "Embroidery": "vacant", "Wash": "vacant", "Finishing": "vacant", "Photoshoot": "vacant", "Final Settlement": "vacant", "Dispatch": "vacant"}'::jsonb
    WHEN status = 'Embroidery' THEN 
      '{"Payment Received": "completed", "Pattern": "completed", "Grading": "completed", "Cutting": "completed", "Stitching": "completed", "Kaaj": "completed", "Embroidery": "in-progress", "Wash": "vacant", "Finishing": "vacant", "Photoshoot": "vacant", "Final Settlement": "vacant", "Dispatch": "vacant"}'::jsonb
    WHEN status = 'Wash' THEN 
      '{"Payment Received": "completed", "Pattern": "completed", "Grading": "completed", "Cutting": "completed", "Stitching": "completed", "Kaaj": "completed", "Embroidery": "completed", "Wash": "in-progress", "Finishing": "vacant", "Photoshoot": "vacant", "Final Settlement": "vacant", "Dispatch": "vacant"}'::jsonb
    WHEN status = 'Finishing' THEN 
      '{"Payment Received": "completed", "Pattern": "completed", "Grading": "completed", "Cutting": "completed", "Stitching": "completed", "Kaaj": "completed", "Embroidery": "completed", "Wash": "completed", "Finishing": "in-progress", "Photoshoot": "vacant", "Final Settlement": "vacant", "Dispatch": "vacant"}'::jsonb
    WHEN status = 'Photoshoot' THEN 
      '{"Payment Received": "completed", "Pattern": "completed", "Grading": "completed", "Cutting": "completed", "Stitching": "completed", "Kaaj": "completed", "Embroidery": "completed", "Wash": "completed", "Finishing": "completed", "Photoshoot": "in-progress", "Final Settlement": "vacant", "Dispatch": "vacant"}'::jsonb
    WHEN status = 'Final Settlement' THEN 
      '{"Payment Received": "completed", "Pattern": "completed", "Grading": "completed", "Cutting": "completed", "Stitching": "completed", "Kaaj": "completed", "Embroidery": "completed", "Wash": "completed", "Finishing": "completed", "Photoshoot": "completed", "Final Settlement": "in-progress", "Dispatch": "vacant"}'::jsonb
    WHEN status = 'Dispatch' THEN 
      '{"Payment Received": "completed", "Pattern": "completed", "Grading": "completed", "Cutting": "completed", "Stitching": "completed", "Kaaj": "completed", "Embroidery": "completed", "Wash": "completed", "Finishing": "completed", "Photoshoot": "completed", "Final Settlement": "completed", "Dispatch": "completed"}'::jsonb
    ELSE 
      '{"Payment Received": "vacant", "Pattern": "vacant", "Grading": "vacant", "Cutting": "vacant", "Stitching": "vacant", "Kaaj": "vacant", "Embroidery": "vacant", "Wash": "vacant", "Finishing": "vacant", "Photoshoot": "vacant", "Final Settlement": "vacant", "Dispatch": "vacant"}'::jsonb
  END
WHERE stage_status = '{}';

-- Add comment
COMMENT ON COLUMN designs.stage_status IS 'JSON object tracking status of each stage: vacant, in-progress, or completed';
