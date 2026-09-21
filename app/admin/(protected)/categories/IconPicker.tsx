"use client";

import { useState, useRef, useEffect } from "react";
import * as Icons from "lucide-react";
import { ChevronDown, Search } from "lucide-react";

/**
 * The old icon field was just a plain text input with a browser
 * <datalist> — you had to already know the exact icon name (e.g.
 * "Building2") and got no visual feedback of what it actually looked
 * like. This replaces it with an actual picker: click, see real icon
 * shapes in a grid, click one, done — with a live preview on the
 * closed button too.
 */
const ICON_OPTIONS = [
  "Cog", "Building2", "Cpu", "Truck", "Sprout", "Briefcase", "Layers",
  "Shirt", "FlaskConical", "UtensilsCrossed", "Stethoscope", "Package",
  "Zap", "Mountain", "Sofa", "Laptop", "Printer", "Recycle", "Wrench",
  "HardHat", "Microscope", "Dumbbell", "Smartphone", "Car", "Baby",
  "Factory", "Hammer", "Drill", "Bike", "Tractor", "Gamepad2", "Camera",
  "Headphones", "Speaker", "Bricks", "PanelTop", "Pipette", "Wheat",
  "Beef", "Leaf", "LayoutGrid", "Lamp", "PaintRoller", "ToyBrick",
  "Backpack", "ShoppingBag", "Watch", "Armchair", "Droplets",
  "HeartPulse", "Tent", "Forklift", "Bolt", "Flame", "Scissors",
  "Palette", "Music", "BookOpen", "Gift", "PawPrint",
  "TreePine", "Fish", "Star", "Home", "ShieldCheck"
];

export default function IconPicker({
  name,
  defaultValue = "Package",
  onChange
}: {
  name: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const SelectedIcon = (Icons as any)[value] ?? Icons.Package;
  const filtered = ICON_OPTIONS.filter((i) => i.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1 block text-xs font-bold text-ink-800">آیکون</label>
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm transition hover:border-camel-300"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-camel-50 text-camel-600">
          <SelectedIcon className="h-4 w-4" />
        </span>
        <span className="flex-1 text-right text-ink-700">{value}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-72 rounded-xl2 border border-line bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-ink-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی آیکون..."
              className="w-full text-xs focus:outline-none"
            />
          </div>
          <div className="grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto">
            {filtered.map((iconName) => {
              const Icon = (Icons as any)[iconName] ?? Icons.Package;
              const selected = iconName === value;
              return (
                <button
                  key={iconName}
                  type="button"
                  title={iconName}
                  onClick={() => {
                    setValue(iconName);
                    onChange?.(iconName);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                    selected
                      ? "bg-camel-500 text-white"
                      : "text-ink-600 hover:bg-camel-50 hover:text-camel-600"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-6 py-4 text-center text-xs text-ink-400">آیکونی پیدا نشد</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
