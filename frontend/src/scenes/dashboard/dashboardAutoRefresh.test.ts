import { DashboardType, QueryBasedInsightModel } from '~/types'

import { getDashboardAutoRefreshRestriction } from './dashboardAutoRefresh'

function dashboardWithRange(dateFrom: string): DashboardType<QueryBasedInsightModel> {
    return {
        id: 1,
        name: 'Dashboard',
        filters: { date_from: dateFrom },
        tiles: [
            {
                id: 1,
                color: null,
                insight: {
                    id: 2,
                    name: 'Trend',
                    query: { kind: 'InsightVizNode', source: { kind: 'TrendsQuery' } },
                },
            },
        ],
    } as unknown as DashboardType<QueryBasedInsightModel>
}

describe('dashboard auto-refresh eligibility', () => {
    it.each([
        ['-30d', null],
        ['-31d', 'dashboard'],
        ['-1dStart', null],
        ['invalid-date-range', 'dashboard'],
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
                        query: {
                            kind: 'InsightVizNode',
                            source: { kind: 'TrendsQuery', dateRange: { date_from: '-90d' } },
                        },
                    },
                },
            ],
        } as unknown as DashboardType<QueryBasedInsightModel>

        expect(getDashboardAutoRefreshRestriction(dashboard, 'UTC')).toEqual({
            source: 'insight',
            insightName: 'Long-running trend',
            dateRangeLabel: 'Last 90 days',
        })
    })

    it('uses persisted dashboard filters instead of temporary overrides', () => {
        const dashboard = {
            ...dashboardWithRange('-7d'),
            persisted_filters: { date_from: '-90d' },
        }

        expect(getDashboardAutoRefreshRestriction(dashboard, 'UTC')?.source).toBe('dashboard')
    })

    it('does not use temporary overrides when persisted filters are null', () => {
        const dashboard = {
            ...dashboardWithRange('-90d'),
            persisted_filters: null,
        }

        expect(getDashboardAutoRefreshRestriction(dashboard, 'UTC')).toBeNull()
    })

    it('allows a tile override shorter than the dashboard range', () => {
        const dashboard = dashboardWithRange('-90d')
        dashboard.tiles[0].filters_overrides = { date_from: '-7d' }

        expect(getDashboardAutoRefreshRestriction(dashboard, 'UTC')).toBeNull()
    })
})
