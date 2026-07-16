import { useValues } from 'kea'

import { LemonBanner } from '@posthog/lemon-ui'

import { sharingLogic } from 'lib/components/Sharing/sharingLogic'
import { teamLogic } from 'scenes/teamLogic'

import { DashboardPlacement } from '~/types'

import { dashboardAutoRefreshRestrictionText, getDashboardAutoRefreshRestriction } from './dashboardAutoRefresh'
import { dashboardLogic } from './dashboardLogic'

const AUTHENTICATED_DASHBOARD_PLACEMENTS = [
    DashboardPlacement.Dashboard,
    DashboardPlacement.ProjectHomepage,
    DashboardPlacement.Builtin,
]

export function DashboardAutoRefreshRestrictionBanner({
    placement,
}: {
    placement: DashboardPlacement
}): JSX.Element | null {
    if (!AUTHENTICATED_DASHBOARD_PLACEMENTS.includes(placement)) {
        return null
    }

    return <DashboardAutoRefreshRestrictionBannerContent />
}

function DashboardAutoRefreshRestrictionBannerContent(): JSX.Element | null {
    const { dashboard } = useValues(dashboardLogic)
    const { currentTeam } = useValues(teamLogic)
    const { sharingConfiguration } = useValues(sharingLogic({ dashboardId: dashboard?.id }))
    const restriction = getDashboardAutoRefreshRestriction(dashboard, currentTeam?.timezone ?? 'UTC')

    if (!restriction || !sharingConfiguration?.enabled || sharingConfiguration.auto_refresh_interval === 0) {
        return null
    }

    return <LemonBanner type="warning">{dashboardAutoRefreshRestrictionText(restriction)}</LemonBanner>
}
