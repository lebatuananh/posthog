import { LemonButton, LemonDivider } from '@posthog/lemon-ui'
import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { LemonLabel } from 'lib/components/LemonLabel/LemonLabel'
import { InspectorListItemConsole } from '../../playerInspectorLogic'

export interface ItemConsoleLogProps {
    item: InspectorListItemConsole
    expanded: boolean
    setExpanded: (expanded: boolean) => void
}

export function ItemConsoleLog({ item, expanded, setExpanded }: ItemConsoleLogProps): JSX.Element {
    return (
        <>
            <LemonButton noPadding onClick={() => setExpanded(!expanded)} status={'primary-alt'} fullWidth>
                <div className="p-2 text-xs cursor-pointer truncate font-mono flex-1">{item.data.content}</div>
                {item.data.count > 1 ? (
                    <span
                        className={`bg-${
                            item.highlightColor || 'primary-alt'
                        } rounded-lg px-1 mx-2 text-light text-xs font-semibold`}
                    >
                        {item.data.count}
                    </span>
                ) : null}
            </LemonButton>

            {expanded && (
                <div className="p-2 text-xs border-t">
                    {item.data.count > 1 ? (
                        <>
                            <div className="italic">
                                This log occurred <b>{item.data.count}</b> times in a row.
                            </div>
                            <LemonDivider dashed />
                        </>
                    ) : null}
                    <CodeSnippet language={Language.JavaScript} wrap copyDescription="console log">
                        {item.data.lines.join(' ')}
                    </CodeSnippet>

                    {item.data.trace.length ? (
                        <>
                            <LemonDivider dashed />
                            <LemonLabel>Stack trace</LemonLabel>
                            <CodeSnippet language={Language.Markup} wrap copyDescription="stack trace">
                                {item.data.trace.join('\n')}
                            </CodeSnippet>
                        </>
                    ) : null}
                </div>
            )}
        </>
    )
}
