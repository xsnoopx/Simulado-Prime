import { getSupabase } from './supabase';
import { getExperienceDetails } from './achievements';

/**
 * Safely stringifies an object to prevent circular serialization errors.
 */
export function safeStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch (err: any) {
    try {
      const seen = new WeakSet();
      return JSON.stringify(value, (key, val) => {
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) {
            return "[Circular]";
          }
          seen.add(val);
          if (val instanceof HTMLElement || val.nodeType || val.constructor?.name === 'HTMLDivElement' || val.stateNode) {
            return "[DOMElement]";
          }
        }
        return val;
      });
    } catch (_) {
      return "";
    }
  }
}

/**
 * Synchronizes all local user settings and study statistics to the active Supabase user session.
 */
export async function syncAllDataToSupabase() {
  if (typeof window === 'undefined') return;
  try {
    const client = await getSupabase();
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError || !session?.user) {
      return;
    }

    // Retrieve all relevant items from localStorage
    const userProfileStr = localStorage.getItem('user_profile');
    const simuladoStatsStr = localStorage.getItem('simulado_stats');
    const achievementsStr = localStorage.getItem('cosmos_unlocked_achievements_v1');
    const studyMusicEnabledStr = localStorage.getItem('study_music_enabled');
    const studyMusicVolumeStr = localStorage.getItem('study_music_volume');
    const hapticEnabledStr = localStorage.getItem('haptic_feedback_enabled');
    const timerEnabledStr = localStorage.getItem('simulado_timer_enabled');
    const timerSecondsStr = localStorage.getItem('simulado_timer_seconds');
    const seenAchievementsStr = localStorage.getItem('cosmos_seen_ach_notifications_v1');
    const appRatedStr = localStorage.getItem('cosmos_app_rated');

    // Parse structures
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
    const simuladoStats = simuladoStatsStr ? JSON.parse(simuladoStatsStr) : null;
    const achievements = achievementsStr ? JSON.parse(achievementsStr) : null;
    const seenAchievements = seenAchievementsStr ? JSON.parse(seenAchievementsStr) : null;

    // Build the sync schema payload
    const syncData: any = {};

    if (userProfile) {
      const isOwnerByEmail = session.user.email?.toLowerCase() === "klession@gmail.com";
      if (userProfile.avatarFrameId === 'frame_owner' && !isOwnerByEmail) {
        userProfile.avatarFrameId = 'frame_01';
        localStorage.setItem('user_profile', JSON.stringify(userProfile));
      }
      
      syncData.name = userProfile.name;
      syncData.avatarId = userProfile.avatarId;
      syncData.customAvatarUrl = userProfile.customAvatarUrl;
      syncData.avatarFrameId = userProfile.avatarFrameId || 'frame_01';
      syncData.isPremium = !!userProfile.isPremium;
      // Also write key directly for profile compatibility
      syncData.user_profile = userProfile;
    }
    
    if (simuladoStats) {
      syncData.simulado_stats = simuladoStats;
    }
    
    if (achievements) {
      syncData.unlocked_achievements = achievements;
    }
    
    if (seenAchievements) {
      syncData.cosmos_seen_ach_notifications_v1 = seenAchievements;
    }

    if (studyMusicEnabledStr !== null) {
      syncData.study_music_enabled = studyMusicEnabledStr;
    }
    
    if (studyMusicVolumeStr !== null) {
      syncData.study_music_volume = studyMusicVolumeStr;
    }
    
    if (hapticEnabledStr !== null) {
      syncData.haptic_feedback_enabled = hapticEnabledStr;
    }
    
    if (timerEnabledStr !== null) {
      syncData.simulado_timer_enabled = timerEnabledStr;
    }
    
    if (timerSecondsStr !== null) {
      syncData.simulado_timer_seconds = timerSecondsStr;
    }
    
    if (appRatedStr !== null) {
      syncData.cosmos_app_rated = appRatedStr;
    }

    // Merge onto existing user_metadata safely
    const currentMeta = session.user.user_metadata || {};
    const mergedMeta = { ...currentMeta, ...syncData };

    // Prevent circular or useless updates if metadata is identical
    const changed = Object.keys(syncData).some((key) => {
      return safeStringify(currentMeta[key]) !== safeStringify(syncData[key]);
    });

    if (changed) {
      const { error: updateError } = await client.auth.updateUser({
        data: mergedMeta
      });

      if (updateError) {
        if (updateError.message?.toLowerCase().includes("session") || updateError.message?.toLowerCase().includes("auth")) {
          console.log("[Supabase Sync] Session inactive or missing during upload (expected during logout/reset):", updateError.message);
        } else {
          console.warn("[Supabase Sync] Error during upload:", updateError.message);
        }
      } else {
        console.log("[Supabase Sync] Successfully mirrored all local data to Supabase.");
      }
    }

    // Global and Real-time Ranking integration: Upsert user record into Supabase "ranking" table
    if (session.user && userProfile) {
      try {
        const xpInfo = getExperienceDetails(simuladoStats);
        
        const isOwnerByEmail = session.user.email?.toLowerCase() === "klession@gmail.com";
        let verifiedFrameId = userProfile.avatarFrameId || session.user.user_metadata?.avatarFrameId || 'frame_01';
        if (verifiedFrameId === 'frame_owner' && !isOwnerByEmail) {
          verifiedFrameId = 'frame_01';
        }

        const rankingPayload = {
          id: session.user.id,
          name: userProfile.name || session.user.user_metadata?.name || 'Explorador',
          avatar_id: userProfile.avatarId || session.user.user_metadata?.avatarId || 'default',
          custom_avatar_url: userProfile.customAvatarUrl || session.user.user_metadata?.customAvatarUrl || null,
          avatar_frame_id: verifiedFrameId,
          is_premium: !!userProfile.isPremium || !!session.user.user_metadata?.isPremium,
          xp: xpInfo.xp,
          stats: simuladoStats || {},
          updated_at: new Date().toISOString()
        };

        const { error: rankError } = await client
          .from('ranking')
          .upsert(rankingPayload, { onConflict: 'id' });

        if (rankError) {
          console.warn("[Supabase Sync] Failed to upsert to 'ranking' table. Ensure table exists in Supabase. Details:", rankError.message);
        } else {
          console.log("[Supabase Sync] Successfully synchronized global ranking score.");
        }
      } catch (rankErr) {
        console.warn("[Supabase Sync] Exception during ranking table sync:", rankErr);
      }
    }
  } catch (err) {
    console.warn("[Supabase Sync] Exception during upload:", err);
  }
}

/**
 * Downloads all settings, stats, profile parameters, and achievements from Supabase 
 * and populates the client context and localStorage.
 */
export async function syncAllDataFromSupabase() {
  if (typeof window === 'undefined') return;
  try {
    const client = await getSupabase();
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError || !session?.user) {
      return;
    }

    const metadata = session.user.user_metadata;
    if (!metadata) return;

    let changed = false;

    // 1. Synchronize study statistics
    if (metadata.simulado_stats) {
      try {
        const localStatsStr = localStorage.getItem('simulado_stats');
        const localStats = localStatsStr ? JSON.parse(localStatsStr) : null;
        
        // Use Supabase stats if different or local is empty
        if (safeStringify(localStats) !== safeStringify(metadata.simulado_stats)) {
          localStorage.setItem('simulado_stats', safeStringify(metadata.simulado_stats));
          window.dispatchEvent(new CustomEvent('stats-updated', { detail: metadata.simulado_stats }));
          changed = true;
        }
      } catch (_) {}
    }

    // 2. Synchronize unlocked achievements
    if (metadata.unlocked_achievements) {
      try {
        const localAchStr = localStorage.getItem('cosmos_unlocked_achievements_v1');
        const localAch = localAchStr ? JSON.parse(localAchStr) : [];
        const merged = Array.from(new Set([...localAch, ...metadata.unlocked_achievements]));
        
        if (merged.length > localAch.length) {
          localStorage.setItem('cosmos_unlocked_achievements_v1', safeStringify(merged));
          window.dispatchEvent(new CustomEvent('achievements-synced', { detail: merged }));
          changed = true;
        }
      } catch (_) {}
    }

    // 3. Synchronize seen achievement notifications
    if (metadata.cosmos_seen_ach_notifications_v1) {
      try {
        const localSeenStr = localStorage.getItem('cosmos_seen_ach_notifications_v1');
        const localSeen = localSeenStr ? JSON.parse(localSeenStr) : [];
        const merged = Array.from(new Set([...localSeen, ...metadata.cosmos_seen_ach_notifications_v1]));
        
        if (merged.length > localSeen.length) {
          localStorage.setItem('cosmos_seen_ach_notifications_v1', safeStringify(merged));
          changed = true;
        }
      } catch (_) {}
    }

    // 4. Synchronize user profile structure
    const lastUpdatedStr = localStorage.getItem('profile_last_updated');
    const lastUpdated = lastUpdatedStr ? parseInt(lastUpdatedStr, 10) : 0;
    const isRecentlyUpdated = Date.now() - lastUpdated < 15000; // 15 seconds lock

    const profile: any = {};
    const saved = localStorage.getItem('user_profile');
    if (saved) {
      try {
        Object.assign(profile, JSON.parse(saved));
      } catch (_) {}
    }
    
    let profileChanged = false;
    const premiumFromMeta = metadata.isPremium !== undefined 
      ? !!metadata.isPremium 
      : (metadata.user_profile?.isPremium !== undefined ? !!metadata.user_profile.isPremium : false);
    
    if (premiumFromMeta && !profile.isPremium) {
      profile.isPremium = true;
      profileChanged = true;
    } else if (!premiumFromMeta && profile.isPremium) {
      // In case premium is revoked or not matched
      profile.isPremium = false;
      profileChanged = true;
    }

    if (!isRecentlyUpdated) {
      const isOwnerByEmail = session.user.email?.toLowerCase() === "klession@gmail.com";

      if (metadata.name && profile.name !== metadata.name) {
        profile.name = metadata.name;
        profileChanged = true;
      }
      if (metadata.avatarId && profile.avatarId !== metadata.avatarId) {
        profile.avatarId = metadata.avatarId;
        profileChanged = true;
      }
      if (metadata.customAvatarUrl && profile.customAvatarUrl !== metadata.customAvatarUrl) {
        profile.customAvatarUrl = metadata.customAvatarUrl;
        profileChanged = true;
      }
      if (metadata.avatarFrameId && profile.avatarFrameId !== metadata.avatarFrameId) {
        let frameToSet = metadata.avatarFrameId;
        if (frameToSet === 'frame_owner' && !isOwnerByEmail) {
          frameToSet = 'frame_01';
        }
        if (profile.avatarFrameId !== frameToSet) {
          profile.avatarFrameId = frameToSet;
          profileChanged = true;
        }
      }
    }
    if (profileChanged || !saved) {
      localStorage.setItem('user_profile', safeStringify(profile));
      changed = true;
    }

    // 5. Synchronize all educational preferences & feature toggles
    if (metadata.study_music_enabled !== undefined && localStorage.getItem('study_music_enabled') !== metadata.study_music_enabled) {
      localStorage.setItem('study_music_enabled', metadata.study_music_enabled);
      changed = true;
    }
    if (metadata.study_music_volume !== undefined && localStorage.getItem('study_music_volume') !== metadata.study_music_volume) {
      localStorage.setItem('study_music_volume', metadata.study_music_volume);
      changed = true;
    }
    if (metadata.haptic_feedback_enabled !== undefined && localStorage.getItem('haptic_feedback_enabled') !== metadata.haptic_feedback_enabled) {
      localStorage.setItem('haptic_feedback_enabled', metadata.haptic_feedback_enabled);
      changed = true;
    }
    if (metadata.simulado_timer_enabled !== undefined && localStorage.getItem('simulado_timer_enabled') !== metadata.simulado_timer_enabled) {
      localStorage.setItem('simulado_timer_enabled', metadata.simulado_timer_enabled);
      changed = true;
    }
    if (metadata.simulado_timer_seconds !== undefined && localStorage.getItem('simulado_timer_seconds') !== String(metadata.simulado_timer_seconds)) {
      localStorage.setItem('simulado_timer_seconds', String(metadata.simulado_timer_seconds));
      changed = true;
    }
    if (metadata.cosmos_app_rated !== undefined && localStorage.getItem('cosmos_app_rated') !== metadata.cosmos_app_rated) {
      localStorage.setItem('cosmos_app_rated', metadata.cosmos_app_rated);
      changed = true;
    }

    if (changed) {
      window.dispatchEvent(new CustomEvent('supabase-data-synced'));
    }
  } catch (err) {
    console.warn("[Supabase Sync] Exception during download:", err);
  }
}
