import React from 'react';
import { HeroSectionVisual } from '../../components/dallou/HeroSectionVisual';
import { FeaturePillsBar } from '../../components/dallou/FeaturePillsBar';
import { HowItWorksMockup } from '../../components/dallou/HowItWorksMockup';
import { GroupagesMockupSection } from '../../components/dallou/GroupagesMockupSection';
import { MarketplaceMockupSection } from '../../components/dallou/MarketplaceMockupSection';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-10 sm:space-y-16 pb-16 overflow-x-hidden">
      {/* 1. HERO SECTION: CHINE ➔ SÉNÉGAL, HEADLINE, 3 CTAS & LOGISTICS VISUAL */}
      <HeroSectionVisual />

      {/* 2. VALUE PROPOSITION BAR: MARKETPLACE, GROUPAGES, SOURCING, B2B */}
      <FeaturePillsBar />

      {/* 3. COMMENT ÇA MARCHE ? (6-STEPS WORKFLOW WITH ICONS) */}
      <HowItWorksMockup />

      {/* 4. GROUPAGES SECTION: ACTIVE MOQS & 4 SHOWCASED GROUPAGES */}
      <GroupagesMockupSection />

      {/* 5. MARKETPLACE SECTION: SEARCH, CATEGORY ICONS & CATALOG */}
      <MarketplaceMockupSection />
    </div>
  );
};
