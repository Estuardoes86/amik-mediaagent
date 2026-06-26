import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });
const HS_BASE = 'https://api.hubapi.com';

function getToken() { return process.env.HUBSPOT_API_KEY; }

async function hsGet(path, params = {}) {
  const key = `hs:${path}:${JSON.stringify(params)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const res = await axios.get(`${HS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
    params
  });
  cache.set(key, res.data);
  return res.data;
}

async function hsPost(path, body = {}) {
  const res = await axios.post(`${HS_BASE}${path}`, body, {
    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
  });
  return res.data;
}

/* ── Pipelines ── */
export async function getPipelines() {
  const data = await hsGet('/crm/v3/pipelines/deals');
  return data.results || [];
}

/* ── Pipeline stages ── */
export async function getPipelineStages(pipelineId) {
  const data = await hsGet(`/crm/v3/pipelines/deals/${pipelineId}/stages`);
  return data.results || [];
}

/* ── Deals by stage ── */
export async function getDealsByStage(pipelineId, after = null) {
  const stages = await getPipelineStages(pipelineId);
  const stageMap = {};
  for (const s of stages) stageMap[s.id] = s.label;

  // Get all deals in pipeline
  const params = {
    limit: 100,
    properties: 'dealname,dealstage,amount,closedate,createdate,pipeline,hs_lastmodifieddate,hubspot_owner_id',
    filterGroups: JSON.stringify([{ filters: [{ propertyName:'pipeline', operator:'EQ', value:pipelineId }] }])
  };
  if (after) params.after = after;

  const data = await hsPost('/crm/v3/objects/deals/search', {
    filterGroups: [{ filters: [{ propertyName:'pipeline', operator:'EQ', value:pipelineId }] }],
    properties: ['dealname','dealstage','amount','closedate','createdate','pipeline','hs_lastmodifieddate'],
    limit: 200
  });

  const deals = data.results || [];
  const byStage = {};
  for (const s of stages) byStage[s.label] = { count:0, amount:0, deals:[], stageId:s.id, order:s.displayOrder };

  for (const d of deals) {
    const stageLabel = stageMap[d.properties.dealstage] || d.properties.dealstage || 'Sin etapa';
    if (!byStage[stageLabel]) byStage[stageLabel] = { count:0, amount:0, deals:[], stageId:d.properties.dealstage, order:999 };
    byStage[stageLabel].count++;
    byStage[stageLabel].amount += parseFloat(d.properties.amount || 0);
    byStage[stageLabel].deals.push(d);
  }
  return { byStage, stages, stageMap, total: deals.length };
}

/* ── Contacts summary ── */
export async function getContactsSummary(daysBack = 30) {
  const since = new Date(); since.setDate(since.getDate() - daysBack);
  const sinceTs = since.getTime();

  const data = await hsPost('/crm/v3/objects/contacts/search', {
    filterGroups: [{ filters: [{ propertyName:'createdate', operator:'GTE', value: sinceTs }] }],
    properties: ['firstname','lastname','email','phone','hs_lead_status','lifecyclestage','createdate','hubspot_owner_id','source'],
    sorts: [{ propertyName:'createdate', direction:'DESCENDING' }],
    limit: 200
  });

  const contacts = data.results || [];
  const byStatus = {};
  const bySource = {};

  for (const c of contacts) {
    const status = c.properties.hs_lead_status || 'Sin estado';
    const lc = c.properties.lifecyclestage || 'Sin etapa';
    const source = c.properties.source || 'Orgánico';
    byStatus[status] = (byStatus[status]||0) + 1;
    bySource[source] = (bySource[source]||0) + 1;
  }

  return { total: contacts.length, byStatus, bySource, recent: contacts.slice(0,10) };
}

/* ── Admissions funnel ── */
// Maps UPSJB-style deal stages to standard funnel steps
const FUNNEL_MAP = {
  interesado:  ['interesado','nuevo','lead','nuevo lead','interested'],
  inscrito:    ['inscrito','inscripcion','inscription','registrado'],
  ingresante:  ['ingresante','postulante','postulado','applicant'],
  pagante:     ['pagante','pago','paid','payment','pago realizado'],
  matriculado: ['matriculado','matricula','enrolled','matriculation'],
};

export async function getAdmissionsFunnel(pipelineId) {
  const { byStage, stages } = await getDealsByStage(pipelineId);

  // Build normalized funnel
  const funnel = { interesado:0, inscrito:0, ingresante:0, pagante:0, matriculado:0 };
  const raw = {};

  for (const [stageName, data] of Object.entries(byStage)) {
    raw[stageName] = data.count;
    const normalized = stageName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    for (const [funnelKey, aliases] of Object.entries(FUNNEL_MAP)) {
      if (aliases.some(a => normalized.includes(a))) {
        funnel[funnelKey] += data.count;
        break;
      }
    }
  }

  // If no mapping found, distribute raw stages in order
  const totalMapped = Object.values(funnel).reduce((s,v)=>s+v,0);
  if (totalMapped === 0) {
    const sorted = Object.entries(byStage).sort((a,b)=>a[1].order-b[1].order);
    const keys = Object.keys(funnel);
    sorted.forEach(([name, data], i) => {
      if (i < keys.length) funnel[keys[i]] = data.count;
    });
  }

  // Conversion rates between stages
  const steps = Object.entries(funnel);
  const conversions = [];
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i-1][1]; const curr = steps[i][1];
    conversions.push({ from:steps[i-1][0], to:steps[i][0], rate: prev>0 ? ((curr/prev)*100).toFixed(1) : '0.0' });
  }

  return { funnel, conversions, raw, stages };
}

/* ── Owner list ── */
export async function getOwners() {
  const data = await hsGet('/crm/v3/owners');
  return (data.results||[]).map(o => ({ id:o.id, name:`${o.firstName} ${o.lastName}`, email:o.email }));
}

/* ── Recent activity ── */
export async function getRecentDeals(limit = 20) {
  const data = await hsPost('/crm/v3/objects/deals/search', {
    filterGroups: [],
    properties: ['dealname','dealstage','amount','createdate','hs_lastmodifieddate','pipeline'],
    sorts: [{ propertyName:'createdate', direction:'DESCENDING' }],
    limit
  });
  return data.results || [];
}

/* ── Full dashboard summary ── */
export async function getHubspotSummary(pipelineId, daysBack = 30) {
  const [pipelines, contacts, recentDeals] = await Promise.all([
    getPipelines(),
    getContactsSummary(daysBack),
    getRecentDeals(10)
  ]);

  // Use first pipeline if none specified
  const pipeline = pipelines.find(p=>p.id===pipelineId) || pipelines[0];
  if (!pipeline) return { error: 'No pipelines found', contacts, recentDeals };

  const funnel = await getAdmissionsFunnel(pipeline.id);

  return {
    pipeline: { id:pipeline.id, label:pipeline.label },
    funnel,
    contacts,
    recentDeals,
    pipelines: pipelines.map(p=>({ id:p.id, label:p.label }))
  };
}
