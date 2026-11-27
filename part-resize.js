'use strict';
let activePartResize=null;
const isLidPart=s=>s&&['lid','lidlegs'].includes(s.type);
function resizablePart(s){return s&&Number.isFinite(s.x2)&&Number.isFinite(s.y2)&&!editableLineTypes.has(s.type)&&!['text','callout','cross'].includes(s.type);}
function partBox(s){return {left:Math.min(s.x,s.x2),top:Math.min(s.y,s.y2),right:Math.max(s.x,s.x2),bottom:Math.max(s.y,s.y2)};}
function lidGeometry(s){const b=partBox(s),w=b.right-b.left,h=b.bottom-b.top,g={top:.2,leftWidth:.12,rightWidth:.12,leftInset:.036,rightInset:.036,leftLength:1,rightLength:1,...s.lidGeometry},topH=h*g.top,legH=h-topH;return {box:b,g,body:{x:b.left,y:b.top,w,h:topH},left:{x:b.left+w*g.leftInset,y:b.top+topH,w:w*g.leftWidth,h:legH*g.leftLength},right:{x:b.right-w*(g.rightInset+g.rightWidth),y:b.top+topH,w:w*g.rightWidth,h:legH*g.rightLength}};}
function partHandles(s){if(!resizablePart(s))return [];const b=partBox(s),cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2;
  const handles=[['nw',b.left,b.top],['n',cx,b.top],['ne',b.right,b.top],['e',b.right,cy],['se',b.right,b.bottom],['s',cx,b.bottom],['sw',b.left,b.bottom],['w',b.left,cy]].map(([id,x,y])=>({id,x,y}));
  if(isLidPart(s)){const l=lidGeometry(s);handles.push({id:'topThickness',label:'T',x:cx,y:l.left.y,internal:true},{id:'leftWidth',label:'LW',x:l.left.x+l.left.w,y:l.left.y+l.left.h*.45,internal:true},{id:'rightWidth',label:'RW',x:l.right.x,y:l.right.y+l.right.h*.45,internal:true},{id:'leftLength',label:'LH',x:l.left.x+l.left.w/2,y:l.left.y+l.left.h,internal:true},{id:'rightLength',label:'RH',x:l.right.x+l.right.w/2,y:l.right.y+l.right.h,internal:true});}return handles;
}
function nearestPartHandle(s,p){let best=null,distance=lineTolerance(11);for(const h of partHandles(s)){const d=Math.hypot(p.x-h.x,p.y-h.y);if(d<distance){best=h;distance=d;}}return best;}
const lidDrawBase=drawShape;
drawShape=function(ctx,s,preview=false){if(!isLidPart(s)){lidDrawBase(ctx,s,preview);return;}const l=lidGeometry(s);ctx.save();ctx.strokeStyle=s.color||'#76b900';ctx.fillStyle=s.fill&&s.fill!=='none'?s.fill:'transparent';ctx.lineWidth=s.lineW||2;ctx.setLineDash(linePattern(s.dash,s.lineW));for(const r of [l.body,l.left,l.right]){if(s.fill&&s.fill!=='none')ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeRect(r.x,r.y,r.w,r.h);}ctx.fillStyle=s.color||'#76b900';ctx.font=`bold ${s.size||12}px Segoe UI, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s.label||'Lid',(l.box.left+l.box.right)/2,l.body.y+l.body.h/2);ctx.restore();};
const resizeRedrawBase=canvasRedraw;
canvasRedraw=function(){resizeRedrawBase();const s=selectedPart();if(!resizablePart(s)||!_ctx||canvasTool!=='select')return;const radius=lineTolerance(5);_ctx.save();_ctx.translate(cvPanX,cvPanY);_ctx.scale(cvZoom,cvZoom);_ctx.setLineDash([]);_ctx.lineWidth=lineTolerance(1.5);for(const h of partHandles(s)){_ctx.fillStyle=h.internal?'#ffc84a':'#fff';_ctx.strokeStyle='#172017';_ctx.fillRect(h.x-radius,h.y-radius,radius*2,radius*2);_ctx.strokeRect(h.x-radius,h.y-radius,radius*2,radius*2);if(h.label){_ctx.fillStyle='#ffc84a';_ctx.font=`600 ${lineTolerance(11)}px Segoe UI`;_ctx.fillText(h.label,h.x+radius*1.5,h.y-radius*1.5);}}_ctx.restore();};
const resizeMDBase=canvasMD;
canvasMD=function(e){if(_cvs&&canvasTool==='select'&&!cvSpaceDown&&(e.button===undefined||e.button===0)){const s=selectedPart(),h=s&&nearestPartHandle(s,cxy(e));if(h){_cvs.focus({preventScroll:true});canvasHistory.push(JSON.stringify(canvasShapes));activePartResize={index:canvasSelected,handle:h.id,original:structuredClone(s)};canvasDrawing=true;return;}}resizeMDBase(e);};
const clampPart=(n,min,max)=>Math.max(min,Math.min(max,n));
function resizeFromHandle(state,p){const s=canvasShapes[state.index],original=state.original,b=partBox(original),id=state.handle;if(!s)return;
  if(['topThickness','leftWidth','rightWidth','leftLength','rightLength'].includes(id)){const l=lidGeometry(original),g={...l.g},w=b.right-b.left,h=b.bottom-b.top;if(id==='topThickness')g.top=clampPart((p.y-b.top)/h,.04,.8);if(id==='leftWidth')g.leftWidth=clampPart((p.x-l.left.x)/w,.015,.4);if(id==='rightWidth')g.rightWidth=clampPart((b.right-w*g.rightInset-p.x)/w,.015,.4);if(id==='leftLength'||id==='rightLength'){const foot=Math.max(l.left.y+4,p.y),leftFoot=id==='leftLength'?foot:l.left.y+l.left.h,rightFoot=id==='rightLength'?foot:l.right.y+l.right.h,newBottom=Math.max(leftFoot,rightFoot),newHeight=newBottom-b.top,legHeight=newHeight-l.body.h;s.x=b.left;s.x2=b.right;s.y=b.top;s.y2=newBottom;g.top=l.body.h/newHeight;g.leftLength=(leftFoot-l.left.y)/legHeight;g.rightLength=(rightFoot-l.right.y)/legHeight;}s.lidGeometry=g;return;}
  let {left,top,right,bottom}=b;if(id.includes('w'))left=Math.min(p.x,right-4);if(id.includes('e'))right=Math.max(p.x,left+4);if(id.includes('n'))top=Math.min(p.y,bottom-4);if(id.includes('s'))bottom=Math.max(p.y,top+4);s.x=left;s.y=top;s.x2=right;s.y2=bottom;
}
const resizeMVBase=canvasMV;
canvasMV=function(e){if(activePartResize){resizeFromHandle(activePartResize,cxy(e));canvasRedraw();return;}resizeMVBase(e);if(canvasTool==='select'&&!canvasDrawing&&!cvPanning){const s=selectedPart(),h=s&&nearestPartHandle(s,cxy(e));if(h)_cvs.style.cursor=h.internal?'crosshair':['n','s'].includes(h.id)?'ns-resize':['e','w'].includes(h.id)?'ew-resize':['nw','se'].includes(h.id)?'nwse-resize':'nesw-resize';}};
const resizeMUBase=canvasMU;
canvasMU=function(e){const changed=!!activePartResize;resizeMUBase(e);activePartResize=null;if(changed)lineEdited();};
const resizeInspectorBase=updateLineInspector;
updateLineInspector=function(){resizeInspectorBase();const s=selectedPart();if(!s||!$('selected-line-status')||!resizablePart(s))return;$('selected-line-status').textContent=isLidPart(s)?'Lid selected. White handles resize the whole lid. Amber handles: T = top thickness, LW/RW = leg width, LH/RH = leg height. Color and fill apply to the body and both legs.':'Part selected. Drag the white corner or edge handles to resize; drag inside to move.';if(isLidPart(s)){$('selected-part-label').disabled=false;if(document.activeElement!==$('selected-part-label'))$('selected-part-label').value=s.label||'Lid';}};
const lidRenameBase=renameSelectedPart;
renameSelectedPart=function(value){const s=selectedPart();if(!isLidPart(s)){lidRenameBase(value);return;}canvasHistory.push(JSON.stringify(canvasShapes));s.label=value;lineEdited();};
const lidHitBase=shapeHit;
shapeHit=function(s,p){if(!isLidPart(s))return lidHitBase(s,p);const l=lidGeometry(s);return [l.body,l.left,l.right].some(r=>p.x>=r.x-4&&p.x<=r.x+r.w+4&&p.y>=r.y-4&&p.y<=r.y+r.h+4);};
const resizeFillBase=setFill;
setFill=function(value){resizeFillBase(value);if(selectedPart()&&selectedPart().type!=='image')lineEdited();};
const lidTextSizeBase=setTextSize;
setTextSize=function(value){const s=selectedPart(),size=Number(value);if(!isLidPart(s)){lidTextSizeBase(value);return;}if(!Number.isFinite(size)||size<=0)return;canvasHistory.push(JSON.stringify(canvasShapes));s.size=size;canvasTextSize=size;lineEdited();};
