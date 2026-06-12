// Audit Engine: 3-tier analysis of paid media accounts
// Tier 1: Tracking health
// Tier 2: Account structure
// Tier 3: Signal quality & optimization

export function runAudit(metaData, googleData) {
  const findings = [];
  let score = 100;

  // ─── TIER 1: TRACKING ────────────────────────────────────────────
  const trackingIssues = auditTracking(metaData, googleData);
  findings.push(...trackingIssues.findings);
  score -= trackingIssues.deduction;

  // ─── TIER 2: STRUCTURE ───────────────────────────────────────────
  const structureIssues = auditStructure(metaData, googleData);
  findings.push(...structureIssues.findings);
  score -= structureIssues.deduction;

  // ─── TIER 3: SIGNAL / OPTIMIZATION ──────────────────────────────
  const signalIssues = auditSignal(metaData, googleData);
  findings.push(...signalIssues.findings);
  score -= signalIssues.deduction;

  // Sort by priority
  findings.sort((a, b) => {
    const order = { P0: 0, P1: 1, P2: 2 };
    return order[a.priority] - order[b.priority];
  });

  return {
    score: Math.max(0, Math.round(score)),
    findings,
    tiers: {
      tracking: { score: Math.max(0, 100 - trackingIssues.deduction), issues: trackingIssues.findings.length },
      structure: { score: Math.max(0, 100 - structureIssues.deduction), issues: structureIssues.findings.length },
      signal: { score: Math.max(0, 100 - signalIssues.deduction), issues: signalIssues.findings.length }
    },
    runAt: new Date().toISOString()
  };
}

function auditTracking(metaData, googleData) {
  const findings = [];
  let deduction = 0;

  // Check pixel health
  if (metaData?.pixels?.length === 0) {
    findings.push({
      id: 'no-pixel',
      priority: 'P0',
      tier: 'tracking',
      title: 'No se detectó Pixel de Meta activo',
      description: 'No hay ningún pixel configurado en la cuenta. Sin pixel, Meta no puede optimizar por conversiones reales.',
      action: 'Instalar Meta Pixel + CAPI server-side en el sitio web del cliente.',
      impact: 'Optimización ciega — CPL estimado +60% sobre benchmark',
      deduction: 25
    });
    deduction += 25;
  }

  // Check for CAPI setup (inferred from pixel events)
  if (metaData?.pixels?.length > 0) {
    const hasRecentFire = metaData.pixels.some(p => {
      if (!p.last_fired_time) return false;
      const lastFire = new Date(p.last_fired_time);
      const hoursAgo = (Date.now() - lastFire) / 3600000;
      return hoursAgo < 48;
    });

    if (!hasRecentFire) {
      findings.push({
        id: 'pixel-stale',
        priority: 'P0',
        tier: 'tracking',
        title: 'Pixel sin actividad en +48h',
        description: 'El Pixel de Meta no ha registrado eventos en las últimas 48 horas. Puede indicar CAPI roto, cambios en el sitio, o pérdida de cookies.',
        action: 'Verificar instalación del pixel, revisar CAPI events, testear con Meta Pixel Helper.',
        impact: 'Conversiones no registradas — datos de optimización comprometidos',
        deduction: 20
      });
      deduction += 20;
    }
  }

  // Google conversion tracking check
  if (googleData?.conversions?.length === 0) {
    findings.push({
      id: 'no-google-conv',
      priority: 'P0',
      tier: 'tracking',
      title: 'Sin acciones de conversión en Google Ads',
      description: 'No se detectaron conversiones configuradas en Google Ads. Las campañas optimizan por clics, no por leads o ventas.',
      action: 'Configurar al menos 1 acción de conversión (lead form submit, thank you page).',
      impact: 'Smart bidding inoperativo — CPA potencialmente 2-3x mayor',
      deduction: 20
    });
    deduction += 20;
  }

  return { findings, deduction };
}

function auditStructure(metaData, googleData) {
  const findings = [];
  let deduction = 0;

  // ML Starvation check: ad sets with <50 conversions/week
  if (metaData?.adSetInsights) {
    const starvedSets = metaData.adSetInsights.filter(adset => {
      const leads = adset.actions?.find(a => a.action_type === 'lead');
      return !leads || parseInt(leads.value) < 50;
    });

    const starvationRate = metaData.adSetInsights.length > 0
      ? starvedSets.length / metaData.adSetInsights.length
      : 0;

    if (starvationRate > 0.5 && starvedSets.length > 5) {
      const waste = estimateWaste(starvedSets);
      findings.push({
        id: 'ml-starvation',
        priority: 'P1',
        tier: 'structure',
        title: `ML Starvation: ${starvedSets.length} ad sets con señal insuficiente`,
        description: `${starvedSets.length} de ${metaData.adSetInsights.length} ad sets tienen menos de 50 conversiones/semana. El algoritmo de Meta no tiene suficiente señal para optimizar correctamente.`,
        action: `Consolidar a ${Math.ceil(metaData.adSetInsights.length * 0.3)} grupos como máximo. Fusionar audiencias similares.`,
        impact: `Desperdicio estimado: S/ ${waste.toFixed(0)}/mes`,
        deduction: 12
      });
      deduction += 12;
    }
  }

  // Creative fatigue: ads running 14+ days without refresh
  if (metaData?.creativeInsights) {
    const fatiguedAds = metaData.creativeInsights.filter(ad => {
      const ctr = parseFloat(ad.ctr || 0);
      return ctr < 0.8; // Below 0.8% CTR indicates fatigue
    });

    if (fatiguedAds.length > 3) {
      findings.push({
        id: 'creative-fatigue',
        priority: 'P1',
        tier: 'structure',
        title: `Fatiga creativa detectada en ${fatiguedAds.length} anuncios`,
        description: `${fatiguedAds.length} anuncios tienen CTR por debajo del 0.8% — señal de fatiga de audiencia. La repetición excesiva del mismo creativo reduce el rendimiento gradualmente.`,
        action: 'Pausar los anuncios con CTR < 0.8% y rotar 3-5 variantes nuevas de creatividad.',
        impact: '+15-25% CTR estimado con creativos frescos',
        deduction: 8
      });
      deduction += 8;
    }
  }

  // Naming convention check
  if (metaData?.campaigns) {
    const badNaming = metaData.campaigns.filter(c => {
      // Check for proper convention: CLIENTE_CAMPAÑA_OBJETIVO
      return !c.name.includes('_') || c.name.length < 10;
    });

    if (badNaming.length > metaData.campaigns.length * 0.3) {
      findings.push({
        id: 'naming-convention',
        priority: 'P2',
        tier: 'structure',
        title: 'Naming convention inconsistente',
        description: `${badNaming.length} campañas no siguen la convención CLIENTE_OBJETIVO_AUDIENCIA. Dificulta la automatización de reportes y el análisis rápido.`,
        action: 'Renombrar campañas siguiendo: CLIENTE_OBJETIVO_AUDIENCIA_FECHA.',
        impact: 'Mejora reportabilidad y eficiencia operativa',
        deduction: 3
      });
      deduction += 3;
    }
  }

  // Google: low quality score keywords
  if (googleData?.keywords) {
    const lowQS = googleData.keywords.filter(k => k.qualityScore && k.qualityScore < 5);
    if (lowQS.length > 5) {
      findings.push({
        id: 'low-quality-score',
        priority: 'P1',
        tier: 'structure',
        title: `${lowQS.length} keywords con Quality Score bajo en Google`,
        description: `${lowQS.length} keywords con QS < 5. Esto eleva el CPC y reduce la elegibilidad de subasta. Afecta directamente el costo por click.`,
        action: 'Revisar relevancia de anuncio, landing page y keyword intent. Pausar keywords con QS ≤ 3.',
        impact: '-20% CPC estimado mejorando QS a 7+',
        deduction: 10
      });
      deduction += 10;
    }
  }

  return { findings, deduction };
}

function auditSignal(metaData, googleData) {
  const findings = [];
  let deduction = 0;

  // CPL trend analysis
  if (metaData?.insightsSummary) {
    const { cpl, spend, leads } = metaData.insightsSummary;
    if (cpl && cpl > 0) {
      // High CPL relative to spend (heuristic: if CPL > spend/leads*1.3)
      const impliedCpl = leads > 0 ? spend / leads : null;
      if (impliedCpl && impliedCpl > cpl * 1.3) {
        findings.push({
          id: 'cpl-spike',
          priority: 'P0',
          tier: 'signal',
          title: 'CPL anómalo detectado en últimas 48h',
          description: `El CPL real (S/ ${impliedCpl.toFixed(2)}) está 30%+ por encima del benchmark histórico. Puede indicar saturación de audiencia, cambios en el algoritmo o competencia estacional.`,
          action: 'Revisar distribución de budget por ad set. Evaluar expansión de audiencia o nuevos creativos.',
          impact: 'Acción inmediata puede reducir CPL spike en 24-48h',
          deduction: 15
        });
        deduction += 15;
      }
    }
  }

  // Frequency check (Meta)
  if (metaData?.insightsSummary) {
    // Frequency > 3.5 indicates audience saturation
    const highFreqCampaigns = metaData.campaignInsights?.filter(c =>
      parseFloat(c.frequency || 0) > 3.5
    ) || [];

    if (highFreqCampaigns.length > 0) {
      findings.push({
        id: 'audience-saturation',
        priority: 'P1',
        tier: 'signal',
        title: `Saturación de audiencia en ${highFreqCampaigns.length} campaña(s)`,
        description: `${highFreqCampaigns.length} campañas con frecuencia > 3.5. La misma persona ve el anuncio demasiadas veces — genera fatiga y aumenta el CPL.`,
        action: 'Ampliar audiencias lookalilike al 3-5%, o activar exclusiones de audiencia ya convertida.',
        impact: 'Reducir frecuencia a 2-2.5 puede bajar CPL 15-20%',
        deduction: 8
      });
      deduction += 8;
    }
  }

  // Google: low conversion rate
  if (googleData?.campaigns) {
    const lowConvRate = googleData.campaigns.filter(c =>
      c.convRate && parseFloat(c.convRate) < 0.02 && c.clicks > 100
    );

    if (lowConvRate.length > 0) {
      findings.push({
        id: 'low-conv-rate-google',
        priority: 'P1',
        tier: 'signal',
        title: `Tasa de conversión baja en ${lowConvRate.length} campaña(s) Google`,
        description: `${lowConvRate.length} campañas de Google Ads con tasa de conversión < 2% y más de 100 clicks. Posible problema de landing page o targeting de intención.',`,
        action: 'Auditar landing pages de destino. Verificar coherencia keyword → anuncio → landing.',
        impact: 'Doblar conv. rate puede reducir CPA 50% sin cambiar el presupuesto',
        deduction: 10
      });
      deduction += 10;
    }
  }

  return { findings, deduction };
}

function estimateWaste(starvedSets) {
  // Estimate monthly waste from fragmented ad sets
  const totalSpend = starvedSets.reduce((sum, s) => sum + parseFloat(s.spend || 0), 0);
  return totalSpend * 4.3 * 0.25; // 4.3 weeks/month * 25% waste factor
}
