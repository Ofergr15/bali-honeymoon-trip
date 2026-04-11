-- Revert all image URLs to NULL
-- Run this in Supabase SQL Editor to clear bad images

-- Clear all activity images
UPDATE activities SET image_url = NULL;

-- Clear all hotel images
UPDATE hotels SET image_url = NULL;

-- Verify
SELECT
  (SELECT COUNT(*) FROM activities WHERE image_url IS NOT NULL) as activities_with_images,
  (SELECT COUNT(*) FROM hotels WHERE image_url IS NOT NULL) as hotels_with_images;
