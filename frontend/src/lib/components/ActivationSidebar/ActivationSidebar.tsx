import { LemonButton, LemonButtonProps, LemonButtonWithSideAction } from '@posthog/lemon-ui'
import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { navigationLogic } from '~/layout/navigation/navigationLogic'
import { activationLogic, ActivationTaskType } from './activationLogic'
import './ActivationSidebar.scss'
import { Progress } from 'antd'
import { IconCheckmark, IconClose } from '../icons'
import { SessionRecording as SessionRecordingConfig } from 'scenes/project/Settings/SessionRecording'
import { ProfessorHog } from '../hedgehogs'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'

const Task = ({ id, name, description, completed, canSkip, skipped, url }: ActivationTaskType): JSX.Element => {
    const displaySideAction = !completed && !skipped && canSkip
    const { runTask, skipTask } = useActions(activationLogic)
    const { reportActivationSideBarTaskClicked } = useActions(eventUsageLogic)

    const content = (
        <div className="my-4 mx-2">
            <p className="m-0">{name}</p>
            {!completed && !skipped && <p className="font-normal text-xs mt-2 mb-0 mx-0">{description}</p>}
        </div>
    )

    const params: Partial<LemonButtonProps> = {
        id,
        fullWidth: true,
        type: 'secondary',
        icon: completed ? <IconCheckmark /> : skipped ? <IconClose /> : null,
        status: completed ? 'primary-alt' : skipped ? 'muted' : undefined,
        tooltip: name,
    }
    if (url) {
        params.to = url
        params.targetBlank = true
    } else {
        params.onClick = () => {
            runTask(id)
            reportActivationSideBarTaskClicked(id)
        }
    }
    return (
        <li>
            {displaySideAction ? (
                <LemonButtonWithSideAction
                    {...params}
                    sideAction={{
                        icon: <IconClose />,
                        tooltip: 'Skip task',
                        onClick: () => skipTask(id),
                        status: 'muted',
                    }}
                >
                    {content}
                </LemonButtonWithSideAction>
            ) : (
                <LemonButton {...params}>{content}</LemonButton>
            )}
        </li>
    )
}

const ActivationSidebar = (): JSX.Element => {
    const { isActivationSideBarShown } = useValues(navigationLogic)
    const { hideActivationSideBar } = useActions(navigationLogic)
    const { activeTasks, completedTasks, completionPercent, showSessionRecordingConfig } = useValues(activationLogic)
    const { setShowSessionRecordingConfig } = useActions(activationLogic)

    return (
        <div className={clsx('ActivationSideBar', !isActivationSideBarShown && 'ActivationSideBar--hidden')}>
            <div className="ActivationSideBar__content pt-2 px-4 pb-16">
                <div className="ActivationSideBar__close_button">
                    <LemonButton
                        icon={<IconClose />}
                        onClick={() => {
                            if (showSessionRecordingConfig) {
                                setShowSessionRecordingConfig(false)
                            } else {
                                hideActivationSideBar()
                            }
                        }}
                    />
                </div>
                {showSessionRecordingConfig ? (
                    <SessionRecordingConfig />
                ) : (
                    <>
                        <h2 className="subtitle">Quick Start</h2>
                        <p>
                            Use our Quick Start guide to learn about everything PostHog can do for you and your product.
                        </p>
                        <div className="my-4 flex items-center justify-center">
                            <div className="flex flex-col items-center">
                                <Progress
                                    type="circle"
                                    strokeWidth={10}
                                    percent={completionPercent}
                                    format={() => activeTasks.length}
                                    strokeColor="#345cff" // primary-light
                                />
                                <p className="text-muted mt-2">still to go</p>
                            </div>
                            <div className="ActivationSideBar__hog">
                                <ProfessorHog className="max-h-full w-auto object-contain" />
                            </div>
                        </div>
                        {activeTasks.length > 0 && (
                            <div className="mt-4">
                                <div className="text-muted uppercase text-xs">What's next?</div>
                                <ul>
                                    {activeTasks.map((task: ActivationTaskType) => (
                                        <Task key={task.id} {...task} />
                                    ))}
                                </ul>
                            </div>
                        )}
                        {completedTasks.length > 0 && (
                            <div className="mt-4">
                                <div className="text-muted uppercase text-xs">Completed</div>
                                <ul>
                                    {completedTasks.map((task: ActivationTaskType) => (
                                        <Task key={task.id} {...task} />
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default ActivationSidebar
