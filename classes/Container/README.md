# Container

This is the base class for dealing with containers

## States

ecs state | description
--- | ---
`pending` | requested to start - but not yet active (queue has not picked it up)
`spinning up` | queue worker has started build process for a new container
`updating` | queue worker has begun updating an existing container
`running` | container is in a ready state
`spinning down` | queue worker has begun process to terminate a container
`stopped` | container is spun-down, and no longer active

### Normal Flow

ecs state | is active | state change reason
--- | --- | ---
`pending` | `false` | user requests container to start
`spinning up` | `true` | queue worker began spinning up container
`running` | `true` | spin-up completed
`spinning down` | `true` | pull request closed, or user requested stop
`stopped` | `false` | spin-down completed

#### Additional Notes

It is possible that a container is never explicitly requested by the user, thus `pending` is skipped, and the initial state will then be `spinning up`.

### Updates

A normal update will be applied after `running`

ecs state | is active | state change reason
--- | --- | ---
`pending` | `false` | user requests container to start
`spinning up` | `true` | queue worker began spinning up container
`running` | `true` | spin-up completed
`updating` | `true` | user pushed changes to active branch
`running` | `true` | update completed
`spinning down` | `true` | pull request closed, or user requested stop
`stopped` | `false` | spin-down completed

#### Additional Notes

If an update request is run against a branch that does not have an active container, it will essentially follow the normal create flow.
