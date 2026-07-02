import React, { useState, useEffect } from 'react';
import { socialApi } from '../api.js';

/* ══════════════════════════════════════════════
   Publicaciones por red — cada plataforma su cuadro
   Top 3 destacadas + tabla de métricas (— honesto)
══════════════════════════════════════════════ */

const PLAT_META = {
  facebook:  { color:'#1877F2', bg:'#EFF6FF', label:'Facebook',  icon:'f' },
  instagram: { color:'#E1306C', bg:'#FFF0F5', label:'Instagram', icon:'◈' },
  youtube:   { color:'#FF0000', bg:'#FFF5F5', label:'YouTube',   icon:'▶' },
};

// Columnas reales por plataforma. null = la red no expone ese dato (se muestra "—")
const COLS = {
  facebook: [
    { key:'likes',    label:'Likes'      },
    { key:'comments', label:'Comentarios'},
    { key:'shares',   label:'Compartidos'},
    { key:'engaged',  label:'Interacc.'  },
    { key:'eng_rate', label:'Eng. Rate'  },  // calculado si hay seguidores
    { key:'views',    label:'Reprod.',   na:true },
    { key:'clicks',   label:'Clics',     na:true },
  ],
  instagram: [
    { key:'likes',    label:'Likes'      },
    { key:'comments', label:'Comentarios'},
    { key:'shares',   label:'Compartidos', na:true },
    { key:'engaged',  label:'Interacc.'  },
    { key:'eng_rate', label:'Eng. Rate'  },
    { key:'views',    label:'Reprod.',   na:true },
    { key:'clicks',   label:'Clics',     na:true },
  ],
  youtube: [
    { key:'views',       label:'Reprod.'    },
    { key:'likes',       label:'Likes'      },
    { key:'comentarios', label:'Comentarios'},
    { key:'engaged',     label:'Interacc.'  },
    { key:'eng',         label:'Eng. Rate'  },
    { key:'shares',      label:'Compartidos', na:true },
    { key:'clicks',      label:'Clics',       na:true },
  ],
};

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : n);

// Obtiene el valor de una columna para una publicación, respetando na y campos por plataforma
function cellValue(plat, post, col, seguidores) {
  if (col.na) return '—';
  if (col.key === 'engaged') {
    const e = post.engaged ?? ((post.likes||0) + (post.comments||post.comentarios||0) + (post.shares||0));
    return fmt(e);
  }
  if (col.key === 'eng_rate') {
    // FB/IG: interacciones ÷ seguidores * 100 (si hay seguidores)
    const e = post.engaged ?? 0;
    if (!seguidores) return '—';
    return ((e / seguidores) * 100).toFixed(2) + '%';
  }
  if (col.key === 'eng') { // YouTube ya trae eng calculado
    return post.eng != null ? post.eng + '%' : '—';
  }
  const v = post[col.key];
  return (v == null) ? '—' : fmt(v);
}

function Card({ children, p=20, style={} }) {
  return <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:p, boxShadow:'0 1px 3px rgba(0,0,0,.06)', ...style }}>{children}</div>;
}

/* Top 3 tarjetas de una red */
function Top3({ plat, posts, seguidores }) {
  const meta = PLAT_META[plat];
  const top = [...posts].sort((a,b)=>(b.engaged??b.views??0)-(a.engaged??a.views??0)).slice(0,3);
  const medals = ['🥇','🥈','🥉'];
  if (!top.length) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
      {top.map((post,i)=>(
        <div key={post.id||i} style={{ background:meta.bg, border:`1px solid ${meta.color}33`, borderLeft:`3px solid ${meta.color}`, borderRadius:10, padding:'14px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:18 }}>{medals[i]}</span>
            <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:meta.color, background:'#fff', padding:'2px 8px', borderRadius:20 }}>{post.tipo||'Post'}</span>
          </div>
          <div style={{ fontSize:12, color:'#374151', lineHeight:1.4, marginBottom:10, minHeight:34, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {post.texto || '(sin texto)'}
          </div>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            {plat==='youtube' ? (
              <Stat label="Reprod." value={fmt(post.views)} color={meta.color}/>
            ) : null}
            <Stat label="Likes" value={fmt(post.likes)} color={meta.color}/>
            <Stat label="Coment." value={fmt(post.comments ?? post.comentarios)} color={meta.color}/>
            {plat==='facebook' ? <Stat label="Comp." value={fmt(post.shares)} color={meta.color}/> : null}
            <Stat label="Interacc." value={fmt(post.engaged ?? post.views)} color={meta.color}/>
          </div>
          <div style={{ fontSize:10, color:'#9CA3AF', marginTop:10 }}>{post.fecha}</div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:800, fontSize:18, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:.5, textTransform:'uppercase', color:'#9CA3AF', marginTop:2 }}>{label}</div>
    </div>
  );
}

/* Tabla de todas las publicaciones de una red */
function PostsTable({ plat, posts, seguidores }) {
  const meta = PLAT_META[plat];
  const cols = COLS[plat];
  const [sortK, setSortK] = useState(plat==='youtube'?'views':'engaged');

  const sorted = [...posts].sort((a,b)=>{
    const av = a[sortK] ?? (sortK==='engaged'?(a.views||0):0);
    const bv = b[sortK] ?? (sortK==='engaged'?(b.views||0):0);
    return bv - av;
  });

  return (
    <Card p={0}>
      <div style={{ padding:'12px 20px', borderBottom:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#6B7280' }}>
          {posts.length} publicaciones
        </span>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table className="table" style={{ minWidth:820 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', minWidth:240 }}>PUBLICACIÓN</th>
              <th style={{ textAlign:'center' }}>FECHA</th>
              {cols.map(c=>(
                <th key={c.key} style={{ textAlign:'right', cursor:c.na?'default':'pointer', color: sortK===c.key ? meta.color : (c.na?'#C4C9D0':undefined) }}
                    onClick={()=>!c.na && setSortK(c.key)}>
                  {c.label}{!c.na && ' ↕'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((post,i)=>(
              <tr key={post.id||i}>
                <td style={{ fontWeight:500, color:'#111827', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.texto || '(sin texto)'}</td>
                <td style={{ textAlign:'center', color:'#9CA3AF', fontSize:11 }}>{post.fecha}</td>
                {cols.map(c=>(
                  <td key={c.key} style={{ textAlign:'right', color: c.na ? '#C4C9D0' : (sortK===c.key ? meta.color : '#374151'), fontWeight: sortK===c.key?700:400, fontFamily:'var(--mono)' }}>
                    {cellValue(plat, post, c, seguidores)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function PublicacionesRedes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plat, setPlat] = useState('facebook');

  useEffect(() => {
    let alive = true;
    socialApi.getAll()
      .then(r => { if (alive) setData(r.data); })
      .catch(() => { if (alive) setData(null); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  if (loading) return (
    <div style={{ padding:'60px 0', textAlign:'center', color:'#9CA3AF' }}>
      <span className="spinner"/> <span style={{ marginLeft:10 }}>Cargando publicaciones…</span>
    </div>
  );

  // data puede venir como { facebook:{...}, instagram:{...}, youtube:{...} } o array
  const getPlat = (p) => {
    if (!data) return null;
    if (Array.isArray(data)) return data.find(d=>d.plataforma===p);
    return data[p] || (data.plataformas && data.plataformas[p]) || null;
  };

  const current = getPlat(plat);
  const posts = current?.publicaciones || [];
  const seguidores = current?.seguidores || 0;
  const meta = PLAT_META[plat];

  return (
    <div>
      {/* Selector de red */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {Object.keys(PLAT_META).map(p=>{
          const m = PLAT_META[p];
          const active = plat===p;
          return (
            <button key={p} onClick={()=>setPlat(p)}
              style={{
                display:'flex', alignItems:'center', gap:8, padding:'9px 18px',
                borderRadius:10, cursor:'pointer', fontFamily:'var(--font-semi)',
                fontSize:12.5, fontWeight:700,
                border:`1px solid ${active?m.color:'#E5E7EB'}`,
                background: active ? m.bg : '#fff',
                color: active ? m.color : '#6B7280', transition:'all .15s',
              }}>
              <span style={{ width:20, height:20, borderRadius:5, background:m.color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900 }}>{m.icon}</span>
              {m.label}
              {getPlat(p)?.publicaciones?.length ? <span style={{ fontSize:10, opacity:.6 }}>({getPlat(p).publicaciones.length})</span> : null}
            </button>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <Card style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>
          No hay publicaciones disponibles para {meta.label} en este momento.
        </Card>
      ) : (
        <>
          {/* Top 3 de la red */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:20, height:2, background:meta.color, borderRadius:2 }}/>
            <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:meta.color }}>
              Top 3 · {meta.label}
            </span>
          </div>
          <Top3 plat={plat} posts={posts} seguidores={seguidores}/>

          {/* Tabla completa */}
          <div style={{ display:'flex', alignItems:'center', gap:10, margin:'24px 0 14px' }}>
            <div style={{ width:20, height:2, background:meta.color, borderRadius:2 }}/>
            <span style={{ fontFamily:'var(--font-semi)', fontSize:10, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:meta.color }}>
              Todas las publicaciones
            </span>
          </div>
          <PostsTable plat={plat} posts={posts} seguidores={seguidores}/>

          <div style={{ marginTop:14, fontSize:11, color:'#9CA3AF', display:'flex', gap:8, alignItems:'center' }}>
            <span>ℹ️</span>
            <span>Las columnas con "—" son métricas que {meta.label} no expone públicamente por publicación vía API.</span>
          </div>
        </>
      )}
    </div>
  );
}
