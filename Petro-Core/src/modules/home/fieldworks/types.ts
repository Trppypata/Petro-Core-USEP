export interface FieldWork {
  title: string;
  description: string;
  path?: string;
}

export const fieldWorksList: FieldWork[] = [
  {
    title: "Geohazards Assessment",
    description:
      "Comprehensive analysis of geological hazards and their potential impacts on human settlements, infrastructure, and the environment.",
    path: "/field-works/geohazard",
  },
  {
    title: "Hydrogeologic Sampling",
    description:
      "Collection and analysis of groundwater samples to assess water quality, aquifer properties, contamination levels, and sustainable management strategies.",
    path: "/field-works/hydrogeologic",
  },
  {
    title: "Structural Geology Assessment",
    description:
      "Detailed examination of rock deformation, fault systems, and tectonic features to understand geological structures and their implications for resource exploration.",
    path: "/field-works/structural-geology",
  },
  {
    title: "Engineering Geological and Geohazards Assessment Report",
    description:
      "Technical evaluation of geological conditions and hazards for engineering projects,.",
    path: "/field-works/engineering-geological",
  },
  {
    title: "Quadrangle Mapping",
    description:
      "Systematic field mapping of geological units, structures, and resources within standardized quadrangle areas to create comprehensive geological maps.",
    path: "/field-works/quadrangle-mapping",
  },
  {
    title: "Research",
    description:
      "Geological research studies and academic papers on various earth science topics and findings, contributing to the advancement of geoscience knowledge.",
    path: "/field-works/research",
  },
];
