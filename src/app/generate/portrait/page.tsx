"use client";

import StyleGeneratorPage from "@/components/StyleGeneratorPage";
import { styleConfigs } from "@/lib/styles";

export default function PortraitPage() {
  return <StyleGeneratorPage style={styleConfigs.portrait} />;
}