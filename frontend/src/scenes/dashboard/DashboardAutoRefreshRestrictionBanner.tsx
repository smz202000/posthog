import { useValues } from 'kea'

import { LemonBanner } from '@posthog/lemon-ui'

import { sharingLogic } from 'lib/components/Sharing/sharingLogic'
import { teamLogic } from 'scenes/teamLogic'

import { dashboardAutoRefreshRestrictionText, getDashboardAutoRefreshRestriction } from './dashboardAutoRefresh'
import { dashboardLogic } from './dashboardLogic'

export function DashboardAutoRefreshRestrictionBanner(): JSX.Element | null {
    const { dashboard } = useValues(dashboardLogic)
    const { currentTeam } = useValues(teamLogic)
    const { sharingConfiguration } = useValues(sharingLogic({ dashboardId: dashboard?.id }))
    const restriction = getDashboardAutoRefreshRestriction(dashboard, currentTeam?.timezone ?? 'UTC')

    if (!restriction || !sharingConfiguration?.enabled || sharingConfiguration.auto_refresh_interval === 0) {
        return null
    }

    return <LemonBanner type="warning">{dashboardAutoRefreshRestrictionText(restriction)}</LemonBanner>
}
