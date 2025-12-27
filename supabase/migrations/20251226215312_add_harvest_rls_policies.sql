-- Migration: Add UPDATE and DELETE RLS policies for harvests table
-- The harvests table currently only has INSERT and SELECT policies
-- This migration adds UPDATE and DELETE policies to complete CRUD access

-- Add UPDATE policy: Users can update their own harvests
CREATE POLICY "Users can update own harvests"
ON "public"."harvests"
FOR UPDATE
USING ("created_by" = "auth"."uid"())
WITH CHECK ("created_by" = "auth"."uid"());

-- Add DELETE policy: Users can delete their own harvests
CREATE POLICY "Users can delete own harvests"
ON "public"."harvests"
FOR DELETE
USING ("created_by" = "auth"."uid"());

-- Add index for common query patterns if not exists
CREATE INDEX IF NOT EXISTS idx_harvests_grow_id ON "public"."harvests" ("grow_id");
CREATE INDEX IF NOT EXISTS idx_harvests_shelf_id ON "public"."harvests" ("shelf_id");
CREATE INDEX IF NOT EXISTS idx_harvests_harvest_date ON "public"."harvests" ("harvest_date" DESC);
CREATE INDEX IF NOT EXISTS idx_harvests_created_by ON "public"."harvests" ("created_by");
