"use client";

import StyleGeneratorPage from "@/components/StyleGeneratorPage";
import { styleConfigs } from "@/lib/styles";

export default function CreativePage() {
  return <StyleGeneratorPage style={styleConfigs.creative} />;
}