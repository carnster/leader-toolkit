-- Change measurement_timeline from text to text array
ALTER TABLE decision_briefs 
ALTER COLUMN measurement_timeline TYPE text[] USING 
  CASE 
    WHEN measurement_timeline IS NULL THEN NULL
    WHEN measurement_timeline = '' THEN NULL
    ELSE string_to_array(measurement_timeline, ',')
  END;