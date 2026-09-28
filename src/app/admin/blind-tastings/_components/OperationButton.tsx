"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { runOperation } from "../actions";
import { operationFields, type Field, type Operation } from "../fields";
import BottlePicker from "./BottlePicker";
import { buttonClass, inputClass, RawJson } from "./shared";
export type Defaults = Record<string, string | number | boolean | undefined>;
export type Choices = Record<string, { value: string; label: string }[]>;
export default function OperationButton({
  operation,
  label,
  id,
  version,
  defaults = {},
  choices = {},
  context = {},
  disabled,
  description,
}: {
  operation: Operation;
  label: string;
  id?: number;
  version?: number;
  defaults?: Defaults;
  choices?: Choices;
  context?: Defaults;
  disabled?: boolean;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [output, setOutput] = useState<string>();
  const [download, setDownload] = useState<number>();
  const key = useRef("");
  const fingerprint = useRef("");
  const router = useRouter();
  function changeOpen(value: boolean) {
    if (pending) return;
    setOpen(value);
    if (value) {
      setError("");
      setConflict(false);
      setOutput(undefined);
      setDownload(undefined);
      key.current = crypto.randomUUID();
      fingerprint.current = "";
    }
  }
  function submit(form: FormData) {
    for (const [name, value] of Object.entries(context)) {
      if (value !== undefined) form.set(name, String(value));
    }
    const fp = JSON.stringify(
      [...form.entries()].map(([k, v]) => [k, typeof v === "string" ? v : [v.name, v.size, v.lastModified]]),
    );
    if (fingerprint.current && fingerprint.current !== fp) key.current = crypto.randomUUID();
    fingerprint.current = fp;
    start(async () => {
      let r;
      try {
        r = await runOperation(operation, id, version, key.current, form);
      } catch {
        setError("서버와 연결하지 못했습니다. 같은 내용으로 다시 시도해 주세요.");
        return;
      }
      if (!r.success) {
        setError(r.error);
        setConflict(r.conflict);
        return;
      }
      toast.success(`${label} 처리가 완료되었습니다.`);
      router.refresh();
      if (operation === "export" && r.id) setDownload(r.id);
      else if (operation === "auto") setOutput(r.resultJson ?? "배분이 완료되었습니다.");
      else {
        setOpen(false);
        if (operation === "createNotice" && r.id) router.push(`/admin/blind-tastings/notices/${r.id}`);
      }
    });
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <button type="button" className={buttonClass} disabled={disabled}>
          {label}
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
        onInteractOutside={(e) => {
          if (pending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (pending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            {description ?? "입력한 내용으로 처리합니다. 변경 사유와 대상 정보를 확인해 주세요."}
          </DialogDescription>
        </DialogHeader>
        {download ? (
          <div className="space-y-4">
            <p>현재 결과와 통계를 파일로 준비했습니다.</p>
            <a className={buttonClass} href={`/admin/blind-tastings/files/export/${download}`} download>
              결과 파일 다운로드
            </a>
            <p className="typo-regular-13 leading-relaxed text-gray-500">
              다운로드 실패 시 이 링크로 다시 시도할 수 있습니다.
            </p>
          </div>
        ) : output ? (
          <RawJson value={output} />
        ) : (
          <form action={submit} className="space-y-4">
            <fieldset disabled={pending || conflict} className="space-y-4">
              {(operationFields[operation] as Field[])
                .filter((f) => !Object.hasOwn(context, f.name))
                .map((field) => {
                  const options = choices[field.name] ?? field.options;
                  const value = defaults[field.name];
                  const inputId = `${operation}-${id ?? "new"}-${field.name}`;
                  return (
                    <div key={field.name}>
                      <label htmlFor={inputId} className="typo-medium-14 mb-2 block leading-relaxed">
                        {field.label}
                        {field.required ? " *" : ""}
                      </label>
                      {["reviewBottleId", "saleBottleId"].includes(field.name) ? (
                        <BottlePicker
                          name={field.name}
                          label={field.label}
                          kind={field.name === "saleBottleId" ? "sale" : "review"}
                          initial={typeof value === "number" ? value : undefined}
                        />
                      ) : field.type === "checkbox" ? (
                        <input
                          id={inputId}
                          name={field.name}
                          type="checkbox"
                          defaultChecked={value === true}
                          className="h-5 w-5 accent-amber-600"
                        />
                      ) : field.type === "file" ? (
                        <input
                          id={inputId}
                          name={field.name}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          required={field.required}
                          className={inputClass}
                        />
                      ) : options && field.multiple ? (
                        <div
                          role="group"
                          aria-label={field.label}
                          className="max-h-60 space-y-2 overflow-auto rounded-lg border p-3"
                        >
                          {options.length === 0 && <p className="typo-regular-14">선택 가능한 샘플이 없습니다.</p>}
                          {options.map((o) => (
                            <label
                              key={o.value}
                              className="typo-regular-14 flex items-center gap-3 py-2 leading-relaxed"
                            >
                              <input
                                type="checkbox"
                                name={field.name}
                                value={o.value}
                                className="h-5 w-5 accent-amber-600"
                              />
                              {o.label}
                            </label>
                          ))}
                        </div>
                      ) : options ? (
                        <select
                          id={inputId}
                          name={field.name}
                          multiple={field.multiple}
                          required={field.required}
                          defaultValue={field.multiple ? [] : value === undefined ? "" : String(value)}
                          className={inputClass}
                        >
                          {!field.multiple && <option value="">선택해 주세요</option>}
                          {options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          id={inputId}
                          name={field.name}
                          defaultValue={String(value ?? "")}
                          required={field.required}
                          maxLength={field.maxLength}
                          rows={5}
                          className={inputClass}
                        />
                      ) : (
                        <input
                          id={inputId}
                          name={field.name}
                          type={field.type ?? "text"}
                          defaultValue={String(value ?? "")}
                          required={field.required}
                          min={field.min}
                          max={field.max}
                          maxLength={field.maxLength}
                          step={field.name === "abv" ? "any" : undefined}
                          className={inputClass}
                        />
                      )}
                      {field.multiple && (
                        <p className="typo-regular-12 mt-2 leading-relaxed text-gray-500">
                          배분·배송할 샘플을 모두 선택해 주세요.
                        </p>
                      )}
                      {field.hint && <p className="typo-regular-13 mt-2 leading-relaxed text-gray-600">{field.hint}</p>}
                    </div>
                  );
                })}
            </fieldset>
            {error && (
              <p role="alert" className="typo-medium-14 leading-relaxed text-red-700">
                {error}
              </p>
            )}
            {conflict ? (
              <button
                type="button"
                className={buttonClass}
                onClick={() => {
                  router.refresh();
                  setOpen(false);
                }}
              >
                최신 상태 불러오기
              </button>
            ) : (
              <button type="submit" disabled={pending} className={`${buttonClass} w-full border-amber-600 bg-amber-50`}>
                {pending ? "처리 중…" : `${label} 실행`}
              </button>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
