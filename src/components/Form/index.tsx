import React from 'react';
import { Form as AntdForm } from 'antd';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { useController } from 'react-hook-form';
import _ from 'lodash'

type AntdFormItemProps = React.ComponentProps<typeof AntdForm.Item>;

export type FormItemProps<TFieldValues extends FieldValues = FieldValues> = {
    children: React.ReactNode;
    control?: Control<TFieldValues>;
    name: FieldPath<TFieldValues>;
} & Omit<AntdFormItemProps, 'name' | 'normalize' | 'rules' | 'validateStatus'>;

// TODO: Support `onBlur` `ref`
// FIXME: `Touched` does not change in devtool
export const FormItem = <TFieldValues extends FieldValues = FieldValues>({
    children,
    control,
    name,
    help,
    hasFeedback = false,
    ...props
}: FormItemProps<TFieldValues>) => {
    const { field, fieldState, formState: { errors } } = useController({ name, control });
    const handleNormalize: AntdFormItemProps['normalize'] = (value) => {
        field.onChange(value);
        return value;
    };
    return (
        <AntdForm.Item
            hasFeedback={hasFeedback}
            name={name as string}
            // initialValue={field.value}
            normalize={handleNormalize}
            validateStatus={fieldState.invalid ? 'error' : undefined}
            help={(errors[name]?.message ?? help) as string}
            {...props}
        >
            {children}
        </AntdForm.Item>
    );
};