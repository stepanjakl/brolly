"use client";

import { Button, type ButtonProps } from "react-aria-components";

/**
 * Icon button with a native hover tooltip. React Aria's Button filters DOM
 * props through an allowlist, so `title` is silently dropped - the tooltip
 * lives on a plain wrapper span instead. One `label` feeds both the tooltip
 * and aria-label so they can't drift.
 */
export default function TitledButton({
  label,
  wrapperClassName,
  ...buttonProps
}: ButtonProps & { label: string; wrapperClassName?: string }) {
  return (
    <span title={label} className={wrapperClassName}>
      <Button aria-label={label} {...buttonProps} />
    </span>
  );
}
