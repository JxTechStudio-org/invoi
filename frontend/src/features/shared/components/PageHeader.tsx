import { LeftOutlined } from '@ant-design/icons'
import { Breadcrumb } from 'antd'
import type { ReactNode } from 'react'


interface PageHeaderProps {
    pageIcon: ReactNode
    pagename1: string
    pagename2?: string
    page1path?: string
}

export default function PageHeader({ pageIcon, pagename1, pagename2, page1path }: PageHeaderProps) {
    return (
        <Breadcrumb
            separator={<LeftOutlined />}
            items={[
                { title: pageIcon },
                {
                    href: pagename2 ? page1path : undefined,
                    title: <span>{pagename1}</span>
                },
                ...(pagename2 ? [{ title: <span>{pagename2}</span> }] : [])
            ]}
            style={{ marginBottom: 10 }}
        />
    )
}
