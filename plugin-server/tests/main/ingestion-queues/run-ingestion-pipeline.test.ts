import Redis from 'ioredis'

import { Hub } from '../../../src/types'
import { DependencyUnavailableError } from '../../../src/utils/db/error'
import { createHub } from '../../../src/utils/db/hub'
import { UUIDT } from '../../../src/utils/utils'
import { createTaskRunner } from '../../../src/worker/worker'
import { createOrganization, createTeam, POSTGRES_DELETE_TABLES_QUERY } from '../../helpers/sql'

describe('workerTasks.runEventPipeline()', () => {
    let hub: Hub
    let redis: Redis.Redis
    let closeHub: () => Promise<void>
    let piscinaTaskRunner: ({ task, args }) => Promise<any>

    beforeAll(async () => {
        ;[hub, closeHub] = await createHub()
        redis = await hub.redisPool.acquire()
        piscinaTaskRunner = createTaskRunner(hub)
        await hub.postgres.query(POSTGRES_DELETE_TABLES_QUERY) // Need to clear the DB to avoid unique constraint violations on ids
    })

    afterAll(async () => {
        await hub.redisPool.release(redis)
        await closeHub()
    })

    beforeEach(() => {
        // Use fake timers to ensure that we don't need to wait on e.g. retry logic.
        jest.useFakeTimers({ advanceTimers: 30 })
    })

    afterEach(() => {
        jest.clearAllTimers()
        jest.useRealTimers()
        jest.clearAllMocks()
    })

    test('throws DependencyUnavailableError on postgres errors', async () => {
        const errorMessage =
            'connection to server at "posthog-pgbouncer" (171.20.65.128), port 6543 failed: server closed the connection unexpectedly'
        const organizationId = await createOrganization(hub.postgres)
        const teamId = await createTeam(hub.postgres, organizationId)

        jest.spyOn(hub.db.postgres, 'query').mockImplementationOnce(() => {
            return Promise.reject(new Error(errorMessage))
        })

        await expect(
            piscinaTaskRunner({
                task: 'runEventPipeline',
                args: {
                    event: {
                        distinctId: 'asdf',
                        ip: '',
                        team_id: teamId,
                        event: 'some event',
                        properties: {},
                        eventUuid: new UUIDT().toString(),
                    },
                },
            })
        ).rejects.toEqual(new DependencyUnavailableError(errorMessage, 'Postgres', new Error(errorMessage)))
    })
})
