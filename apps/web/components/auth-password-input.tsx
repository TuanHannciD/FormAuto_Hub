"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui";

export function AuthPasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return <div className="relative"><Input {...props} type={visible ? "text" : "password"} controlSize="lg" className="pr-14" /><button type="button" disabled={props.disabled} aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={visible} onClick={() => setVisible(!visible)} className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-[10px] text-secondary-foreground hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">{visible ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}</button></div>;
}
