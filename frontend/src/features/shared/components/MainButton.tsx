import { Button } from 'antd'
import type { ComponentProps } from 'react'

interface MainButtonProps extends ComponentProps<typeof Button> {
  text?: string;
}
export default function MainButton({ text = 'Click Me', icon = null, iconPosition = 'start', onClick, loading = false, type = 'primary', disabled = false , style, ...restProps }: MainButtonProps) {
  return (
    <Button
      type={type}
      icon={icon}
      iconPosition={iconPosition}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      {...restProps}
      style={{ ...style, width: 'fit-content' }}
    >
      {text}
    </Button>
  );
}
