// Canonical category tree for تامین — parent categories with their
// subcategories. Used by the seed script to populate MongoDB. Kept as a
// single source of truth so admin-added categories and this default tree
// don't drift out of sync in shape (name/slug/icon).

export interface CategorySeed {
  name: string;
  slug: string;
  icon: string;
  children: { name: string; slug: string; icon: string }[];
}

export const categoryTree: CategorySeed[] = [
  {
    name: "وسایل الکترونیکی",
    slug: "electronics",
    icon: "Cpu",
    children: [
      { name: "موبایل", slug: "mobile-phones", icon: "Smartphone" },
      { name: "لپ‌تاپ و رایانه", slug: "laptop-computer", icon: "Laptop" },
      { name: "لوازم جانبی دیجیتال", slug: "digital-accessories", icon: "Headphones" },
      { name: "کنسول و بازی", slug: "gaming-console", icon: "Gamepad2" },
      { name: "دوربین و فیلم‌برداری", slug: "camera", icon: "Camera" },
      { name: "لوازم صوتی و تصویری", slug: "audio-video", icon: "Speaker" }
    ]
  },
  {
    name: "وسایل نقلیه",
    slug: "vehicles",
    icon: "Truck",
    children: [
      { name: "خودرو سواری", slug: "car", icon: "Car" },
      { name: "موتورسیکلت", slug: "motorcycle", icon: "Bike" },
      { name: "قطعات و لوازم یدکی", slug: "auto-parts", icon: "Wrench" },
      { name: "ماشین‌آلات سنگین", slug: "heavy-vehicles", icon: "Forklift" },
      { name: "وسایل نقلیه کشاورزی", slug: "agri-vehicles", icon: "Tractor" }
    ]
  },
  {
    name: "صنعتی و کارگاهی",
    slug: "industrial",
    icon: "Factory",
    children: [
      { name: "ماشین‌آلات صنعتی", slug: "machinery", icon: "Cog" },
      { name: "تجهیزات کارگاهی", slug: "workshop-equipment", icon: "Hammer" },
      { name: "ابزار برقی صنعتی", slug: "industrial-power-tools", icon: "Drill" },
      { name: "ایمنی و HSE", slug: "safety", icon: "HardHat" },
      { name: "تجهیزات آزمایشگاهی", slug: "lab-equipment", icon: "Microscope" }
    ]
  },
  {
    name: "ابزار و یراق",
    slug: "tools",
    icon: "Wrench",
    children: [
      { name: "ابزار دستی", slug: "hand-tools", icon: "Hammer" },
      { name: "ابزار برقی خانگی", slug: "power-tools", icon: "Drill" },
      { name: "یراق‌آلات", slug: "hardware", icon: "Bolt" },
      { name: "تجهیزات جوشکاری", slug: "welding", icon: "Flame" }
    ]
  },
  {
    name: "ساختمانی و مصالح",
    slug: "construction",
    icon: "Building2",
    children: [
      { name: "مصالح ساختمانی", slug: "building-materials", icon: "Bricks" },
      { name: "فلزات و ورق", slug: "metals", icon: "Layers" },
      { name: "عایق و نما", slug: "insulation-facade", icon: "PanelTop" },
      { name: "سیم، کابل و برق ساختمان", slug: "electrical-wiring", icon: "Zap" },
      { name: "لوله و اتصالات", slug: "piping", icon: "Pipette" }
    ]
  },
  {
    name: "خوراکی و کشاورزی",
    slug: "food-agriculture",
    icon: "Sprout",
    children: [
      { name: "محصولات کشاورزی", slug: "agriculture", icon: "Wheat" },
      { name: "مواد غذایی", slug: "food", icon: "UtensilsCrossed" },
      { name: "دام و طیور", slug: "livestock", icon: "Beef" },
      { name: "نهاده‌های کشاورزی", slug: "agri-supplies", icon: "Leaf" }
    ]
  },
  {
    name: "تزئینی و دکوراسیون",
    slug: "decor",
    icon: "Sofa",
    children: [
      { name: "مبلمان", slug: "furniture", icon: "Sofa" },
      { name: "فرش و کفپوش", slug: "flooring-rugs", icon: "LayoutGrid" },
      { name: "لوازم روشنایی", slug: "lighting", icon: "Lamp" },
      { name: "دکوراسیون داخلی", slug: "interior-decor", icon: "PaintRoller" }
    ]
  },
  {
    name: "کودک و نوزاد",
    slug: "kids-baby",
    icon: "Baby",
    children: [
      { name: "لوازم نوزاد", slug: "baby-gear", icon: "Baby" },
      { name: "اسباب‌بازی", slug: "toys", icon: "ToyBrick" },
      { name: "پوشاک کودک", slug: "kids-clothing", icon: "Shirt" },
      { name: "لوازم تحصیل کودک", slug: "kids-school", icon: "Backpack" }
    ]
  },
  {
    name: "پوشاک و مد",
    slug: "fashion",
    icon: "Shirt",
    children: [
      { name: "پوشاک مردانه", slug: "men-clothing", icon: "Shirt" },
      { name: "پوشاک زنانه", slug: "women-clothing", icon: "Shirt" },
      { name: "کیف و کفش", slug: "bags-shoes", icon: "ShoppingBag" },
      { name: "ساعت و اکسسوری", slug: "accessories", icon: "Watch" }
    ]
  },
  {
    name: "اداری و تجاری",
    slug: "office-business",
    icon: "Briefcase",
    children: [
      { name: "لوازم اداری", slug: "office-supplies", icon: "Briefcase" },
      { name: "مبلمان اداری", slug: "office-furniture", icon: "Armchair" },
      { name: "تجهیزات چاپ", slug: "printing-equipment", icon: "Printer" },
      { name: "نرم‌افزار و فناوری اطلاعات", slug: "it-software", icon: "Laptop" }
    ]
  },
  {
    name: "سلامت و پزشکی",
    slug: "health-medical",
    icon: "Stethoscope",
    children: [
      { name: "تجهیزات پزشکی", slug: "medical-equipment", icon: "Stethoscope" },
      { name: "لوازم بهداشتی", slug: "hygiene", icon: "Droplets" },
      { name: "تجهیزات و لوازم سلامت", slug: "health-supplies", icon: "HeartPulse" }
    ]
  },
  {
    name: "ورزش و سرگرمی",
    slug: "sports-leisure",
    icon: "Dumbbell",
    children: [
      { name: "لوازم ورزشی", slug: "sports-equipment", icon: "Dumbbell" },
      { name: "دوچرخه", slug: "bicycle", icon: "Bike" },
      { name: "کمپ و طبیعت‌گردی", slug: "camping", icon: "Tent" }
    ]
  }
];
