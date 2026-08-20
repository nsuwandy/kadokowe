"use client";

import { useState } from "react";
import { CldUploadWidget, CldImage } from "next-cloudinary";

/**
 * Image picker — FR-10.10.
 *
 * Upload runs through Cloudinary, which applies resizing, format conversion
 * and optimisation on delivery. That is the point of routing catalogue
 * imagery there rather than through the host's image pipeline: the host's
 * optimisation allowance is the capped resource on the free tier (SRS §13.2),
 * and a thousand products would exhaust it.
 *
 * When no upload preset is configured the field degrades to a plain text
 * input for the public ID. Development and CI have no Cloudinary account, and
 * a form that cannot be filled in without one would block work that has
 * nothing to do with images.
 */
export function ImageField({
  name,
  defaultValue,
  label = "Image",
  hint,
}: {
  name: string;
  defaultValue?: string | null;
  label?: string;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const canUpload = Boolean(preset && cloud);

  const labelCls = "text-[0.6875rem] font-bold uppercase tracking-[0.14em]";

  return (
    <div className="flex flex-col gap-2">
      <span className={labelCls}>{label}</span>
      <input type="hidden" name={name} value={value} />

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden border border-line bg-warm">
          {value && cloud ? (
            <CldImage
              src={value}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-[0.625rem] uppercase tracking-[0.1em] text-muted">
              {value ? "set" : "none"}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {canUpload ? (
            <div className="flex flex-wrap gap-2">
              <CldUploadWidget
                uploadPreset={preset}
                options={{ multiple: false, sources: ["local", "url"], maxFileSize: 10_000_000 }}
                onSuccess={(result) => {
                  const info = result?.info;
                  if (info && typeof info === "object" && "public_id" in info) {
                    setValue(String(info.public_id));
                  }
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="border border-ink bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-red"
                  >
                    {value ? "Replace image" : "Upload image"}
                  </button>
                )}
              </CldUploadWidget>

              {value && (
                <button
                  type="button"
                  onClick={() => setValue("")}
                  className="border border-line px-4 py-2 text-xs font-semibold hover:border-ink"
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Cloudinary public ID"
                className="w-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-red"
              />
              <p className="text-xs text-muted">
                Uploading is unavailable until Cloudinary is configured. Paste a
                public ID, or leave blank for a labelled placeholder.
              </p>
            </>
          )}
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
