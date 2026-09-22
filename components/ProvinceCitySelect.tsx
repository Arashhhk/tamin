"use client";

import { useState } from "react";
import { provinces, provinceCities } from "@/lib/iran-locations";

/**
 * Province is required (buyers must give sellers at least the
 * province so shipping/logistics can be estimated); city is optional
 * and its options depend on whichever province is currently chosen —
 * standard cascading select. Both render as plain native <select>
 * elements with `name` attributes, so the surrounding server-action
 * <form> in app/rfq/new/page.tsx reads them via FormData exactly like
 * any other field; the client-side state here only exists to drive
 * which <option>s the city select shows.
 */
export default function ProvinceCitySelect({
  defaultProvince = "",
  defaultCity = ""
}: {
  defaultProvince?: string;
  defaultCity?: string;
}) {
  const [province, setProvince] = useState(defaultProvince);
  const cities = province ? provinceCities[province] ?? [] : [];

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="province" className="mb-1.5 block text-sm font-bold text-ink-800">
          استان
        </label>
        <select
          id="province"
          name="province"
          required
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
        >
          <option value="">انتخاب کنید</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="city" className="mb-1.5 block text-sm font-bold text-ink-800">
          شهر <span className="font-normal text-ink-400">(اختیاری)</span>
        </label>
        <select
          id="city"
          name="city"
          disabled={!province}
          defaultValue={defaultCity}
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400 disabled:bg-sand disabled:text-ink-300"
        >
          <option value="">
            {province ? "انتخاب کنید (اختیاری)" : "ابتدا استان را انتخاب کنید"}
          </option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
