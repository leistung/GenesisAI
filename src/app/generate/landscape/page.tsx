"use client";

import StyleGeneratorPage from "@/components/StyleGeneratorPage";
import { styleConfigs } from "@/lib/styles";

export default function LandscapePage() {
  return <StyleGeneratorPage style={styleConfigs.landscape} />;
}