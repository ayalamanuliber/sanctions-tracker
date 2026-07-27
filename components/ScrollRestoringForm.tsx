"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useTransition,
  type FormEvent,
  type FormHTMLAttributes,
} from "react";

type Props = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  navigationKey: string;
  restoreKey: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ScrollRestoringForm({
  navigationKey,
  restoreKey,
  onSubmit,
  ...props
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const savedPosition = window.sessionStorage.getItem(restoreKey);
    if (!savedPosition) return;

    window.sessionStorage.removeItem(restoreKey);
    const top = Number(savedPosition);
    if (!Number.isFinite(top)) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo({ top, behavior: "instant" }));
    });
  }, [navigationKey, restoreKey]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    window.sessionStorage.setItem(restoreKey, String(window.scrollY));
    onSubmit?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();
    const form = event.currentTarget;
    const target = new URL(form.action || window.location.href);
    target.search = "";
    for (const [key, raw] of new FormData(form).entries()) {
      if (typeof raw === "string" && raw) target.searchParams.append(key, raw);
    }

    startTransition(() => {
      router.replace(`${target.pathname}${target.search}${target.hash}`, {
        scroll: false,
      });
    });
  }

  return (
    <form
      {...props}
      aria-busy={isPending}
      data-pending={isPending ? "true" : "false"}
      onSubmit={handleSubmit}
    />
  );
}
