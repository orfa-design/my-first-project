"use client";

import { useActionState, useRef } from "react";
import type { FormState } from "@/lib/form";
import { setPosterAction } from "./actions";
import { shrinkInputFile } from "./shrink-image";

/** «Додати афішу» до наявної події: вибір фото одразу його й завантажує. */
export function PosterUpload({ eventId, label }: { eventId: string; label: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setPosterAction.bind(null, eventId), {});
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="cal-upload">
      <label className="cal-link">
        {pending ? "Завантажую…" : label}
        <input
          type="file"
          name="poster"
          accept="image/*"
          hidden
          onChange={async (e) => {
            await shrinkInputFile(e.currentTarget);
            formRef.current?.requestSubmit();
          }}
        />
      </label>
      {state.error && <span className="cal-error">{state.error}</span>}
    </form>
  );
}
