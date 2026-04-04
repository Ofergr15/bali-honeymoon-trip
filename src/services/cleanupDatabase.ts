import { supabase } from '../lib/supabase';

/**
 * DATABASE CLEANUP UTILITY
 *
 * This function:
 * 1. Finds ALL trips in the database
 * 2. Identifies which trip has the most data (activities + hotels + days)
 * 3. Keeps ONLY that trip
 * 4. Deletes all other duplicate trips and their associated data
 * 5. Returns the ID of the kept trip
 */
export async function cleanupDatabase(): Promise<{
  success: boolean;
  keptTripId: string | null;
  deletedTrips: number;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    console.log('🧹 Starting database cleanup...');

    // Step 1: Get ALL trips
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id, created_at');

    if (tripsError) throw tripsError;
    if (!trips || trips.length === 0) {
      console.log('✅ No trips found - database is clean');
      return { success: true, keptTripId: null, deletedTrips: 0, errors: [] };
    }

    console.log(`📊 Found ${trips.length} trips in database`);

    // Step 2: For each trip, count associated data
    const tripScores = await Promise.all(
      trips.map(async (trip) => {
        const [
          { count: daysCount },
          { count: activitiesCount },
          { count: hotelsCount }
        ] = await Promise.all([
          supabase.from('days').select('id', { count: 'exact', head: true }).eq('trip_id', trip.id),
          supabase.from('activities').select('id', { count: 'exact', head: true }).eq('trip_id', trip.id),
          supabase.from('hotels').select('id', { count: 'exact', head: true }).in('day_id',
            (await supabase.from('days').select('id').eq('trip_id', trip.id)).data?.map(d => d.id) || []
          )
        ]);

        const score = (daysCount || 0) + (activitiesCount || 0) * 2 + (hotelsCount || 0) * 2;

        console.log(`   Trip ${trip.id.slice(0, 8)}... - Days: ${daysCount}, Activities: ${activitiesCount}, Hotels: ${hotelsCount}, Score: ${score}`);

        return {
          id: trip.id,
          createdAt: trip.created_at,
          daysCount: daysCount || 0,
          activitiesCount: activitiesCount || 0,
          hotelsCount: hotelsCount || 0,
          score
        };
      })
    );

    // Step 3: Find trip with highest score (most data)
    tripScores.sort((a, b) => {
      // First sort by score (higher is better)
      if (b.score !== a.score) return b.score - a.score;
      // If same score, prefer older trip (created first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const tripToKeep = tripScores[0];
    const tripsToDelete = tripScores.slice(1);

    console.log(`✅ Keeping trip: ${tripToKeep.id.slice(0, 8)}... (Score: ${tripToKeep.score}, Created: ${tripToKeep.createdAt})`);
    console.log(`🗑️  Will delete ${tripsToDelete.length} duplicate trips`);

    // Step 4: Delete duplicate trips and their data
    for (const trip of tripsToDelete) {
      try {
        console.log(`   Deleting trip ${trip.id.slice(0, 8)}...`);

        // Get day IDs for this trip
        const { data: days } = await supabase
          .from('days')
          .select('id')
          .eq('trip_id', trip.id);

        const dayIds = days?.map(d => d.id) || [];

        // Delete hotels (linked to days)
        if (dayIds.length > 0) {
          const { error: hotelsError } = await supabase
            .from('hotels')
            .delete()
            .in('day_id', dayIds);

          if (hotelsError) {
            console.error(`   ❌ Failed to delete hotels for trip ${trip.id}:`, hotelsError);
            errors.push(`Hotels deletion failed for ${trip.id}: ${hotelsError.message}`);
          }
        }

        // Delete activities (linked to trip)
        const { error: activitiesError } = await supabase
          .from('activities')
          .delete()
          .eq('trip_id', trip.id);

        if (activitiesError) {
          console.error(`   ❌ Failed to delete activities for trip ${trip.id}:`, activitiesError);
          errors.push(`Activities deletion failed for ${trip.id}: ${activitiesError.message}`);
        }

        // Delete days
        const { error: daysError } = await supabase
          .from('days')
          .delete()
          .eq('trip_id', trip.id);

        if (daysError) {
          console.error(`   ❌ Failed to delete days for trip ${trip.id}:`, daysError);
          errors.push(`Days deletion failed for ${trip.id}: ${daysError.message}`);
        }

        // Delete trip
        const { error: tripError } = await supabase
          .from('trips')
          .delete()
          .eq('id', trip.id);

        if (tripError) {
          console.error(`   ❌ Failed to delete trip ${trip.id}:`, tripError);
          errors.push(`Trip deletion failed for ${trip.id}: ${tripError.message}`);
        } else {
          console.log(`   ✅ Deleted trip ${trip.id.slice(0, 8)}...`);
        }
      } catch (err) {
        console.error(`   ❌ Error deleting trip ${trip.id}:`, err);
        errors.push(`Exception deleting ${trip.id}: ${err}`);
      }
    }

    // Step 5: Clean up orphaned data (safety check)
    console.log('🧹 Cleaning up orphaned data...');

    // Find and delete orphaned days (days with no trip)
    const { data: allDays } = await supabase
      .from('days')
      .select('id, trip_id');

    if (allDays) {
      const validTripId = tripToKeep.id;
      const orphanedDays = allDays.filter(day => day.trip_id !== validTripId);

      if (orphanedDays.length > 0) {
        console.log(`   Found ${orphanedDays.length} orphaned days`);
        const orphanedDayIds = orphanedDays.map(d => d.id);

        // Delete hotels linked to orphaned days
        await supabase.from('hotels').delete().in('day_id', orphanedDayIds);

        // Delete the orphaned days
        await supabase.from('days').delete().in('id', orphanedDayIds);

        console.log(`   ✅ Cleaned up ${orphanedDays.length} orphaned days`);
      }
    }

    // Find and delete orphaned activities (activities with no trip)
    const { data: allActivities } = await supabase
      .from('activities')
      .select('id, trip_id');

    if (allActivities) {
      const validTripId = tripToKeep.id;
      const orphanedActivities = allActivities.filter(a => a.trip_id !== validTripId);

      if (orphanedActivities.length > 0) {
        console.log(`   Found ${orphanedActivities.length} orphaned activities`);
        await supabase.from('activities').delete().in('id', orphanedActivities.map(a => a.id));
        console.log(`   ✅ Cleaned up ${orphanedActivities.length} orphaned activities`);
      }
    }

    console.log('✅ Database cleanup complete!');
    console.log(`📊 Final state: 1 trip (${tripToKeep.id.slice(0, 8)}...) with ${tripToKeep.daysCount} days, ${tripToKeep.activitiesCount} activities, ${tripToKeep.hotelsCount} hotels`);

    return {
      success: true,
      keptTripId: tripToKeep.id,
      deletedTrips: tripsToDelete.length,
      errors
    };

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    errors.push(`Fatal error: ${error}`);
    return {
      success: false,
      keptTripId: null,
      deletedTrips: 0,
      errors
    };
  }
}

/**
 * Verify database integrity after cleanup
 */
export async function verifyDatabase(): Promise<{
  tripCount: number;
  daysCount: number;
  activitiesCount: number;
  hotelsCount: number;
  orphanedDays: number;
  orphanedActivities: number;
  orphanedHotels: number;
}> {
  const { count: tripCount } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true });

  const { count: daysCount } = await supabase
    .from('days')
    .select('id', { count: 'exact', head: true });

  const { count: activitiesCount } = await supabase
    .from('activities')
    .select('id', { count: 'exact', head: true });

  const { count: hotelsCount } = await supabase
    .from('hotels')
    .select('id', { count: 'exact', head: true });

  // Check for orphans
  const { data: trips } = await supabase.from('trips').select('id');
  const validTripIds = trips?.map(t => t.id) || [];

  const { data: days } = await supabase.from('days').select('id, trip_id');
  const orphanedDays = days?.filter(d => !validTripIds.includes(d.trip_id)).length || 0;
  const validDayIds = days?.map(d => d.id) || [];

  const { data: activities } = await supabase.from('activities').select('id, trip_id');
  const orphanedActivities = activities?.filter(a => !validTripIds.includes(a.trip_id)).length || 0;

  const { data: hotels } = await supabase.from('hotels').select('id, day_id');
  const orphanedHotels = hotels?.filter(h => !validDayIds.includes(h.day_id)).length || 0;

  return {
    tripCount: tripCount || 0,
    daysCount: daysCount || 0,
    activitiesCount: activitiesCount || 0,
    hotelsCount: hotelsCount || 0,
    orphanedDays,
    orphanedActivities,
    orphanedHotels
  };
}
