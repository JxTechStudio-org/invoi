import { Steps } from 'antd'
import type { StepsProps } from 'antd'

interface ProcessStepsProps {
    items: StepsProps['items']
    current: number
    size?: StepsProps['size']
    percent?: number
}

export default function ProcessSteps({ items, current, size = 'default', percent }: ProcessStepsProps) {
    return (
        <Steps
            current={current}
            items={items}
            size={size}
            titlePlacement="vertical"
            percent={percent}
        />
    )
}
