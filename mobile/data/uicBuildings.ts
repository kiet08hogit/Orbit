export type UICBuilding = {
  id: string;
  name: string;
  shortName?: string;
  category: "Academic" | "Library" | "Recreation" | "Housing" | "Food" | "Transit" | "Other";
  coordinates: [number, number]; // [lng, lat]
};

export const uicBuildings: UICBuilding[] = [
  {
    id: "arc",
    name: "Academic and Residential Complex",
    shortName: "ARC",
    category: "Housing",
    coordinates: [-87.6506, 41.8745],
  },
  {
    id: "sce",
    name: "Student Center East",
    shortName: "SCE",
    category: "Food",
    coordinates: [-87.64807327722833, 41.87176450337234],
  },
  {
    id: "addams_hall",
    name: "Addams Hall",
    shortName: "AH",
    category: "Academic",
    coordinates: [-87.64900121806708, 41.87094498558426],
  },
  {
    id: "bsb",
    name: "Behavioral Sciences Building",
    shortName: "BSB",
    category: "Academic",
    coordinates: [-87.65227190551478, 41.87376360399818],
  },
  {
    id: "burnham_hall",
    name: "Burnham Hall",
    shortName: "BH",
    category: "Academic",
    coordinates: [-87.6495352193654, 41.87100362474029],
  },
  {
    id: "grant_hall",
    name: "Grant Hall",
    shortName: "GH",
    category: "Academic",
    coordinates: [-87.6494501829802, 41.87284225473778],
  },
  {
    id: "henry_hall",
    name: "Henry Hall",
    shortName: "HH",
    category: "Academic",
    coordinates: [-87.65055054595406, 41.874071812543406],
  },
  {
    id: "lc_a",
    name: "Lecture Center A",
    shortName: "LC A",
    category: "Academic",
    coordinates: [-87.64984441230222, 41.8720486206541],
  },
  {
    id: "lc_b",
    name: "Lecture Center B",
    shortName: "LC B",
    category: "Academic",
    coordinates: [-87.6491750418909, 41.872207865461185],
  },
  {
    id: "lc_c",
    name: "Lecture Center C",
    shortName: "LC C",
    category: "Academic",
    coordinates: [-87.6487891032567, 41.872097998238374],
  },
  {
    id: "lc_d",
    name: "Lecture Center D",
    shortName: "LC D",
    category: "Academic",
    coordinates: [-87.64866477932077, 41.871630274234924],
  },
  {
    id: "lc_e",
    name: "Lecture Center E",
    shortName: "LC E",
    category: "Academic",
    coordinates: [-87.64922837510224, 41.87162292636316],
  },
  {
    id: "lc_f",
    name: "Lecture Center F",
    shortName: "LC F",
    category: "Academic",
    coordinates: [-87.64984405127318, 41.87164903041386],
  },
  {
    id: "lincoln_hall",
    name: "Lincoln Hall",
    shortName: "LH",
    category: "Academic",
    coordinates: [-87.64943815815064, 41.872494749530794],
  },
  {
    id: "stevenson_hall",
    name: "Stevenson Hall",
    shortName: "SH",
    category: "Academic",
    coordinates: [-87.65033734601529, 41.8728430083608],
  },
  {
    id: "uh",
    name: "University Hall",
    shortName: "UH",
    category: "Academic",
    coordinates: [-87.651203, 41.873858],
  },
  {
    id: "taft_hall",
    name: "Taft Hall",
    shortName: "TH",
    category: "Academic",
    coordinates: [-87.649517, 41.871283],
  },
  {
    id: "commons_south",
    name: "Commons South",
    shortName: "CS",
    category: "Other",
    coordinates: [-87.647538, 41.873326],
  },
  {
    id: "sel_west",
    name: "Science and Engineering Laboratory West",
    shortName: "SEL West",
    category: "Academic",
    coordinates: [-87.649206, 41.870433],
  },
  {
    id: "sel_east",
    name: "Science and Engineering Laboratory East",
    shortName: "SEL East",
    category: "Academic",
    coordinates: [-87.648484, 41.870933],
  },
  {
    id: "daley_library",
    name: "Richard J Daley Library",
    shortName: "Daley Library",
    category: "Library",
    coordinates: [-87.650158, 41.8718],
  },
];

export const defaultLocation = {
  name: "Academic and Residential Complex",
  lat: 41.8745,
  lng: -87.6506,
};
