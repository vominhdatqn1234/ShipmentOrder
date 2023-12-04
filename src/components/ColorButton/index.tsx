import { ConfigProvider, Button, theme, ButtonProps } from 'antd';
import React from 'react';
const { useToken } = theme;

interface ColorButtonProps extends ButtonProps {
    children?: React.ReactNode;
    override: string;
}
const ColorButton = ({ children, override, ...restProps }: ColorButtonProps) => {
    const { token } = useToken();
    const overrideColor = (token as any)?.[override] as any || override;
    const modifiedTheme = {
        token: {
            ...token, colorPrimary: overrideColor, colorPrimaryHover: overrideColor, colorPrimaryBorderHover: overrideColor, colorPrimaryTextHover: overrideColor,
        },
    };

    return (
        <ConfigProvider theme={modifiedTheme} >
            <Button {...restProps}>{children}</Button>
        </ConfigProvider>
    );
};

export default ColorButton;