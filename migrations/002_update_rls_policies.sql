-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to trips" ON trips;
DROP POLICY IF EXISTS "Allow all access to days" ON days;
DROP POLICY IF EXISTS "Allow all access to hotels" ON hotels;
DROP POLICY IF EXISTS "Allow all access to activities" ON activities;
DROP POLICY IF EXISTS "Allow all access to places" ON places;

-- TRIPS: All approved users can view
CREATE POLICY "Approved users can view trips" ON trips
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
    )
  );

-- TRIPS: Editors and above can modify
CREATE POLICY "Editors can modify trips" ON trips
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
      AND users.role IN ('editor', 'admin', 'super_user')
    )
  );

-- DAYS: All approved users can view
CREATE POLICY "Approved users can view days" ON days
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
    )
  );

-- DAYS: Editors and above can modify
CREATE POLICY "Editors can modify days" ON days
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
      AND users.role IN ('editor', 'admin', 'super_user')
    )
  );

-- ACTIVITIES: All approved users can view
CREATE POLICY "Approved users can view activities" ON activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
    )
  );

-- ACTIVITIES: Editors and above can modify
CREATE POLICY "Editors can modify activities" ON activities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
      AND users.role IN ('editor', 'admin', 'super_user')
    )
  );

-- HOTELS: All approved users can view
CREATE POLICY "Approved users can view hotels" ON hotels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
    )
  );

-- HOTELS: Editors and above can modify
CREATE POLICY "Editors can modify hotels" ON hotels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
      AND users.role IN ('editor', 'admin', 'super_user')
    )
  );

-- PLACES: Same pattern
CREATE POLICY "Approved users can view places" ON places
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
    )
  );

CREATE POLICY "Editors can modify places" ON places
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
      AND users.role IN ('editor', 'admin', 'super_user')
    )
  );
