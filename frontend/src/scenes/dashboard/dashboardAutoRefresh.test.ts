import { DashboardType, QueryBasedInsightModel } from '~/types'

import { getDashboardAutoRefreshRestriction } from './dashboardAutoRefresh'

function dashboardWithRange(dateFrom: string): DashboardType<QueryBasedInsightModel> {
    return {
        id: 1,
        name: 'Dashboard',
        filters: { date_from: dateFrom },
        tiles: [],
    } as DashboardType<QueryBasedInsightModel>
}

describe('dashboard auto-refresh eligibility', () => {
    it.each([
        ['-30d', null],
        ['-31d', 'dashboard'],
    ])('handles dashboard range %s', (dateFrom, expectedSource) => {
        expect(getDashboardAutoRefreshRestriction(dashboardWithRange(dateFrom), 'UTC')?.source ?? null).toBe(
            expectedSource
        )
    })

    it('identifies the insight whose effective range is too long', () => {
        const dashboard = {
            ...dashboardWithRange('-7d'),
            filters: {},
            tiles: [
                {
                    id: 1,
                    color: null,
                    insight: {
                        id: 2,
                        name: 'Long-running trend',
                        filters: {},
                        query: {
                            kind: 'InsightVizNode',
                            source: { kind: 'TrendsQuery', dateRange: { date_from: '-90d' } },
                        },
                    },
                },
            ],
        } as DashboardType<QueryBasedInsightModel>

        expect(getDashboardAutoRefreshRestriction(dashboard, 'UTC')).toEqual({
            source: 'insight',
            insightName: 'Long-running trend',
            dateRangeLabel: 'Last 90 days',
        })
    })
})
