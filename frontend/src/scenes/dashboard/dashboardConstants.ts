import { DashboardAutoRefreshInterval } from '~/queries/schema/schema-general'

export const AUTO_REFRESH_INITIAL_INTERVAL_SECONDS = DashboardAutoRefreshInterval.SECONDS

/**
 * Cold-start one-shot threshold: if data is older than this when a shared dashboard loads,
 * trigger one immediate force_blocking refresh. Aligned with the periodic interval and the
 * backend throttle (`SHARED_FORCE_BLOCKING_STALENESS_WINDOW`).
 */

/** Default project-tree folder for dashboards that haven't been filed anywhere (mirrors the backend's `base_folder`). */
export const UNFILED_DASHBOARDS_FOLDER = 'Unfiled/Dashboards'
