import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const runtime = process.env.GAME_SYSTEM_DESIGN_RUNTIME || path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skill-runtimes', 'game-system-design');
const require = createRequire(path.join(runtime, 'package.json'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fail = message => { throw new Error(message); };
const finite = (x, name, min = 0) => Number.isFinite(x) && x >= min ? x : fail(`${name} must be >= ${min}`);
const element = (style, children, extra = {}) => ({type: 'div', props: {...extra, style: {display:'flex', boxSizing:'border-box', flexShrink:0, ...style}, children}});

export async function render(spec, output) {
  const satori = require('satori').default;
  const {Resvg} = require('@resvg/resvg-js');
  const ELK = require('elkjs/lib/elk.bundled.js');
  const fontFile = path.join(runtime, 'fonts', 'fonts.json');
  if (!fs.existsSync(fontFile)) fail('Run scripts/setup.py first to prepare fonts.');
  const fonts = JSON.parse(fs.readFileSync(fontFile, 'utf8'));
  const family = fonts[0].family;
  const satoriFonts = fonts.map(f => ({name: family, data: fs.readFileSync(f.path), weight:f.weight, style:'normal'}));
  const glyphs = new Set(JSON.parse(fs.readFileSync(path.join(runtime, 'fonts', 'glyphs.json'), 'utf8')));
  let minFont = Infinity;
  let counter = 0;
  const callouts = new Set();
  const boxes = [];
  const texts = [];
  const fontSize = n => { const v = finite(n ?? 26, 'fontSize', 26); minFont = Math.min(minFont, v); return v; };
  const text = (value, size = 26, style = {}) => {
    const str = String(value ?? '');
    for (const char of str) if (!/\s/u.test(char) && !glyphs.has(char.codePointAt(0))) fail(`Font lacks glyph: ${char}`);
    texts.push(str);
    return element({fontSize:fontSize(size), lineHeight:1.45, overflowWrap:'anywhere', ...style}, str);
  };
  const label = (value, size, callout, style = {}) => {
    const children = [];
    if (callout !== undefined) {
      if (!/^[1-9]\d?$/.test(String(callout))) fail('callout must be a number from 1 to 99');
      if (callouts.has(String(callout))) fail(`Duplicate callout: ${callout}`);
      callouts.add(String(callout));
      children.push(text(callout, 26, {width:40,height:40,border:'2px solid #b02020',borderRadius:20,color:'#b02020',justifyContent:'center',alignItems:'center',lineHeight:1}));
    }
    children.push(text(value, size, {flex:1,minWidth:0,...style}));
    return element({gap:12,alignItems:'flex-start',width:'100%'},children);
  };
  function component(c, parentId = null) {
    if (!c || typeof c !== 'object') fail('Component must be an object');
    const id = c.id || `c${++counter}`;
    if (boxes.some(b=>b.id === id)) fail(`Duplicate component id: ${id}`);
    const record = {id, parent:parentId, type:c.type};
    boxes.push(record);
    const size = fontSize(c.fontSize);
    const base = {minWidth:0, flexDirection:'column', gap:c.gap ?? 16};
    if (c.width !== undefined) base.width = typeof c.width === 'number' ? finite(c.width,'width',1) : c.width;
    if (c.height !== undefined) base.height = finite(c.height,'height',1);
    if (c.flex !== undefined) base.flex = finite(c.flex,'flex',0);
    let children;
    switch(c.type) {
      case 'column': case 'row': case 'panel': case 'grid': {
        if (!Array.isArray(c.children)) fail(`${c.type}.children must be an array`);
        base.padding = c.padding ?? (c.type === 'panel' ? 20 : 0);
        if (c.type === 'panel') {base.border = '2px solid #777';base.backgroundColor='#fafafa';}
        if (c.type === 'row') {base.flexDirection='row';base.alignItems='stretch';}
        if (c.type === 'grid') {base.display='grid';base.gridTemplateColumns=`repeat(${finite(c.columns ?? 2,'columns',1)}, 1fr)`;}
        children = c.children.map(child=>component(child,id));
        if (c.title || c.callout !== undefined) children.unshift(label(c.title ?? '',size,c.callout,{fontWeight:700}));
        break;
      }
      case 'text': children=[label(c.text,size,c.callout)]; break;
      case 'button':
        Object.assign(base,{padding:c.padding ?? 16,border:`${c.selected ? 3:2}px solid #333`,backgroundColor:c.selected?'#dedede':'#fff',alignItems:'center'});
        children=[label(c.text,size,c.callout,{justifyContent:'center',fontWeight:c.selected?700:400})]; break;
      case 'tabs':
        if (!Array.isArray(c.items) || !c.items.length) fail('tabs.items must be nonempty');
        base.flexDirection='row';base.gap=8;
        children=c.items.map((item,i)=>element({flex:1,minWidth:0,padding:14,border:`${i === (c.selected??0)?3:1}px solid #333`,backgroundColor:i === (c.selected??0)?'#e7e6e6':'#fff'},[text(item,size)])); break;
      case 'table': {
        if (!Array.isArray(c.headers) || !c.headers.length || !Array.isArray(c.rows)) fail('table needs headers and rows');
        base.gap=0;base.border='1px solid #777';
        children=[c.headers,...c.rows].map((row,i)=>{
          if (!Array.isArray(row) || row.length!==c.headers.length) fail('Table row width mismatch');
          return element({width:'100%',backgroundColor:i===0?'#e7e6e6':'#fff'}, row.map(v=>element({flex:1,minWidth:0,padding:12,border:'1px solid #aaa'},[text(v,size,{fontWeight:i===0?700:400})])));
        });break;
      }
      case 'spacer': base.height=c.height??16; children=[]; break;
      default: fail(`Unknown component: ${c.type}`);
    }
    return element(base,children,{'data-id':id});
  }
  const renderElement = async (tree, width) => {
    const detected=[];
    const parents=new Map();
    let checkId=0;
    const annotate=(node,parent=null)=>{
      if(!node || typeof node!=='object') return;
      const id=String(++checkId);
      node.props['data-check-id']=id;
      parents.set(id,parent);
      for(const c of Array.isArray(node.props.children)?node.props.children:[node.props.children]) annotate(c,id);
    };
    annotate(tree);
    const svg = await satori(tree,{width,fonts:satoriFonts,embedFont:false,
      onStyleError: e=>{throw e;},onNodeDetected: n=>detected.push({id:n.props?.['data-id'],checkId:n.props?.['data-check-id'],x:n.left,y:n.top,width:n.width,height:n.height,text:n.textContent})});
    const w=Number(svg.match(/<svg[^>]*\bwidth="([\d.]+)"/)?.[1]);
    const h=Number(svg.match(/<svg[^>]*\bheight="([\d.]+)"/)?.[1]);
    if (!w || !h) fail('Renderer produced invalid dimensions');
    for(const b of detected) if(b.x < -1 || b.y < -1 || b.x+b.width>w+1 || b.y+b.height>h+1) fail(`Content exceeds canvas ${w}x${h}: ${JSON.stringify(b)}`);
    const byCheckId=new Map(detected.filter(b=>b.checkId).map(b=>[b.checkId,b]));
    for(const b of detected) {
      const p=byCheckId.get(parents.get(b.checkId));
      if(p && (b.x<p.x-1 || b.y<p.y-1 || b.x+b.width>p.x+p.width+1 || b.y+b.height>p.y+p.height+1)) fail(`Content exceeds its container: ${b.id || b.text || b.checkId}`);
    }
    for(const b of detected.filter(n=>n.id)) {
      const record=boxes.find(r=>r.id===b.id); if(record) Object.assign(record,b);
    }
    return {svg,width:w,height:h};
  };
  let result;
  if(spec.kind === 'ui') {
    const width=finite(spec.width??960,'width',200);
    const children=[];
    if(spec.title) children.push(text(spec.title,32,{fontWeight:700}));
    children.push(component(spec.root));
    const rootStyle={width,backgroundColor:'#fff',color:'#111',fontFamily:family,padding:24,gap:20,flexDirection:'column'};
    if(spec.height!==undefined) rootStyle.height=finite(spec.height,'height',1);
    result=await renderElement(element(rootStyle,children),width);
    const byId=new Map(boxes.map(b=>[b.id,b]));
    for(const b of boxes) if(b.parent) {
      const p=byId.get(b.parent);
      if(b.x<p.x-1 || b.y<p.y-1 || b.x+b.width>p.x+p.width+1 || b.y+b.height>p.y+p.height+1) fail(`Component ${b.id} exceeds ${p.id}`);
    }
  } else if(spec.kind === 'flow') {
    if(!Array.isArray(spec.nodes)||!spec.nodes.length||!Array.isArray(spec.edges)) fail('flow needs nodes and edges');
    if(!['DOWN','RIGHT'].includes(spec.direction??'DOWN')) fail('direction must be DOWN or RIGHT');
    const ids=new Set(); const nodeSvgs=new Map(); const edgeSvgs=new Map();
    const children=[];
    for(const n of spec.nodes) {
      if(!n.id || ids.has(n.id)) fail(`Duplicate or empty node id: ${n.id}`);
      ids.add(n.id);
      const view=await renderElement(element({padding:18,width:n.width??280,fontFamily:family,backgroundColor:'#fafafa',border:'2px solid #444',borderRadius:8},[text(n.text,spec.fontSize??26)]),n.width??280);
      nodeSvgs.set(n.id,view); children.push({id:n.id,width:view.width,height:view.height});
    }
    const edges=[];
    for(const [i,e] of spec.edges.entries()) {
      if(!ids.has(e.from)||!ids.has(e.to)) fail(`Unknown edge endpoint: ${e.from} -> ${e.to}`);
      const edge={id:`edge${i}`,sources:[e.from],targets:[e.to]};
      if(e.label) {
        const labelWidth=Math.max(70,Math.min(260,Array.from(e.label).length*26+16));
        const view=await renderElement(element({padding:6,width:labelWidth,fontFamily:family,backgroundColor:'#fff'},[text(e.label,spec.fontSize??26)]),labelWidth);
        edgeSvgs.set(edge.id,view); edge.labels=[{text:e.label,width:view.width,height:view.height}];
      }
      edges.push(edge);
    }
    const graph=await new ELK().layout({id:'root',layoutOptions:{'elk.algorithm':'layered','elk.direction':spec.direction??'DOWN','elk.edgeRouting':'ORTHOGONAL','elk.spacing.nodeNode':'56','elk.layered.spacing.nodeNodeBetweenLayers':'70','elk.padding':'[top=24,left=24,bottom=24,right=24]','elk.randomSeed':'1'},children,edges});
    const chunks=[];
    const put=(view,x,y)=>view.svg.replace('<svg ',`<svg x="${x}" y="${y}" `);
    for(const edge of graph.edges) {
      for(const s of edge.sections??[]) {
        const points=[s.startPoint,...(s.bendPoints??[]),s.endPoint];
        chunks.push(`<path d="${points.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ')}" fill="none" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`);
      }
    }
    for(const node of graph.children) {chunks.push(put(nodeSvgs.get(node.id),node.x,node.y));boxes.push({id:node.id,x:node.x,y:node.y,width:node.width,height:node.height,type:'flow-node'});}
    for(const edge of graph.edges) for(const l of edge.labels??[]) {chunks.push(put(edgeSvgs.get(edge.id),l.x,l.y));boxes.push({id:edge.id,x:l.x,y:l.y,width:l.width,height:l.height,type:'edge-label'});}
    for(let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++) {
      const a=boxes[i],b=boxes[j];
      if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1 && Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1) fail(`Flow overlap: ${a.id}, ${b.id}`);
    }
    result={width:graph.width,height:graph.height,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${graph.width}" height="${graph.height}" viewBox="0 0 ${graph.width} ${graph.height}"><title>${esc(spec.title??'流程')}</title><rect width="100%" height="100%" fill="white"/><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#333"/></marker></defs>${chunks.join('')}</svg>`};
  } else fail('kind must be ui or flow');
  const printWidthCm=finite(spec.printWidthCm??17,'printWidthCm',1);
  const pointSize=minFont*printWidthCm/2.54*72/result.width;
  if(pointSize<12-0.001) fail(`Text would be ${pointSize.toFixed(1)} pt at ${printWidthCm} cm. Split the diagram, reduce canvas width, or increase fontSize.`);
  const png=new Resvg(result.svg,{font:{fontFiles:fonts.map(f=>f.path),loadSystemFonts:false,defaultFontFamily:family},fitTo:{mode:'width',value:Math.ceil(result.width*2)}}).render().asPng();
  fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
  const report={kind:spec.kind,width:result.width,height:result.height,minFontPx:minFont,printWidthCm,minFontPt:pointSize,fontFamily:family,callouts:[...callouts],boxes,texts,engine:{satori:'0.47.1',elkjs:'0.12.0',resvg:'2.6.2'}};
  fs.writeFileSync(`${output}.svg`,result.svg); fs.writeFileSync(`${output}.png`,png);fs.writeFileSync(`${output}.layout.json`,JSON.stringify(report,null,2));
  return report;
}

if(process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if(process.argv.length!==4) {console.error('Usage: node draw.mjs input.json output-prefix');process.exitCode=2;}
  else try {const r=await render(JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,'')),process.argv[3]);console.log(JSON.stringify({width:r.width,height:r.height,minFontPt:r.minFontPt,callouts:r.callouts}));}
  catch(e) {console.error(e.message);process.exitCode=1;}
}
