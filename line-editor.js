'use strict';
// Editing works on the original vector shapes, so export and device drafts retain it.
const editableLineTypes=new Set(['line','cutline','arrow','arrow2','dimline','leader']);
let draggedLineEnd=null;
function selectedLine(){const s=canvasSelected===null?null:canvasShapes[canvasSelected];return s&&editableLineTypes.has(s.type)?s:null;}
function lineTolerance(pixels=10){return _cvs?pixels*_cvs.width/_cvs.getBoundingClientRect().width/cvZoom:pixels;}
function lineDistance(s,p){const dx=(s.x2??s.x)-s.x,dy=(s.y2??s.y)-s.y,t=Math.max(0,Math.min(1,((p.x-s.x)*dx+(p.y-s.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-s.x-t*dx,p.y-s.y-t*dy);}
function lineEdited(){formDirty=true;scheduleDraft();canvasRedraw();}
function updateLineInspector(){
  const panel=$('selected-line-controls');if(!panel)return;const s=selectedLine();
  $('selected-line-status').textContent=s?'Line selected. Drag either end to resize or rotate; drag the middle to move.':canvasSelected!==null&&canvasShapes[canvasSelected]?.type==='image'?'Picture selected. Choose Move and click the line itself to edit it.':'Choose Move, then click a line to edit its ends, type, width, or style.';
  for(const id of ['selected-line-type','selected-line-length'])$(id).disabled=!s;
  if(!s)return;
  if(document.activeElement!==$('selected-line-type'))$('selected-line-type').value=s.type;
  if(document.activeElement!==$('selected-line-length'))$('selected-line-length').value=Number(Math.hypot((s.x2??s.x)-s.x,(s.y2??s.y)-s.y).toFixed(2));
  const width=document.querySelector('[onchange="setLineW(this.value)"]'),dash=document.querySelector('[onchange="setDash(this.value)"]');
  if(width){const value=String(s.lineW||2);if(![...width.options].some(o=>o.value===value))width.add(new Option(Number(value).toFixed(2)+'px',value));width.value=value;}if(dash)dash.value=s.type==='cutline'&&!s.dashOverride?'dashed':s.dash||'solid';
}
function changeSelectedLineType(type){const s=selectedLine();if(!s||!editableLineTypes.has(type)||type===s.type)return;canvasHistory.push(JSON.stringify(canvasShapes));s.type=type;if(type==='cutline'){s.dash='dashed';s.dashOverride=true;}lineEdited();}
function changeSelectedLineLength(value){const s=selectedLine(),length=Number(value);if(!s)return;if(!Number.isFinite(length)||length<=0||length>10000){showCanvasMsg('Drawing length must be greater than 0 and at most 10,000 px.');updateLineInspector();return;}const angle=Math.atan2((s.y2??s.y)-s.y,(s.x2??s.x)-s.x);canvasHistory.push(JSON.stringify(canvasShapes));s.x2=s.x+Math.cos(angle)*length;s.y2=s.y+Math.sin(angle)*length;lineEdited();}
const lineBaseToolbar=buildToolbar;
buildToolbar=function(){lineBaseToolbar();$('selected-line-controls')?.remove();$('xs-toolbar').insertAdjacentHTML('afterend',`<div id="selected-line-controls" style="padding:14px;border-bottom:1px solid var(--border);background:var(--surface)"><p id="selected-line-status" style="font-size:.875rem;color:var(--text2);margin-bottom:10px" role="status"></p><div class="actions"><label style="font-size:.875rem">Selected line type<select id="selected-line-type" onchange="changeSelectedLineType(this.value)" style="width:auto;display:block"><option value="line">Plain line</option><option value="cutline">Cut line with end ticks</option><option value="arrow">Single arrow</option><option value="arrow2">Double arrow</option><option value="dimline">Dimension line</option><option value="leader">Leader</option></select></label><label style="font-size:.875rem">Drawing length (px)<input id="selected-line-length" type="number" min="0.01" max="10000" step="any" style="width:170px;display:block" onchange="changeSelectedLineLength(this.value)"></label><span style="font-size:.875rem;color:var(--text2)">Color, Width and Line style also apply to your selection.</span></div></div>`);updateLineInspector();};
const lineBaseHit=shapeHit;
shapeHit=function(s,p){return editableLineTypes.has(s.type)?lineDistance(s,p)<=lineTolerance():lineBaseHit(s,p);};
const lineBaseMD=canvasMD;
canvasMD=function(e){if(_cvs&&canvasTool==='select'&&!cvSpaceDown&&(e.button===undefined||e.button===0)){const s=selectedLine(),p=cxy(e);if(s){const tolerance=lineTolerance(13);const end=Math.hypot(p.x-s.x,p.y-s.y)<=tolerance?'start':Math.hypot(p.x-(s.x2??s.x),p.y-(s.y2??s.y))<=tolerance?'end':null;if(end){_cvs.focus({preventScroll:true});canvasHistory.push(JSON.stringify(canvasShapes));draggedLineEnd={index:canvasSelected,end};canvasDrawing=true;return;}}}lineBaseMD(e);updateLineInspector();};
const lineBaseMV=canvasMV;
canvasMV=function(e){if(draggedLineEnd){const p=cxy(e),s=canvasShapes[draggedLineEnd.index];if(!s)return;if(draggedLineEnd.end==='start'){s.x=p.x;s.y=p.y;}else{s.x2=p.x;s.y2=p.y;}canvasRedraw();return;}lineBaseMV(e);};
const lineBaseMU=canvasMU;
canvasMU=function(e){lineBaseMU(e);if(draggedLineEnd){draggedLineEnd=null;lineEdited();}updateLineInspector();};
const lineBaseRedraw=canvasRedraw;
canvasRedraw=function(){lineBaseRedraw();const s=selectedLine();if(s&&_ctx&&_cvs){const radius=lineTolerance(7);_ctx.save();_ctx.translate(cvPanX,cvPanY);_ctx.scale(cvZoom,cvZoom);_ctx.setLineDash([]);_ctx.lineWidth=lineTolerance(2);_ctx.fillStyle='#fff';_ctx.strokeStyle='#76b900';for(const p of [{x:s.x,y:s.y},{x:s.x2??s.x,y:s.y2??s.y}]){_ctx.beginPath();_ctx.arc(p.x,p.y,radius,0,Math.PI*2);_ctx.fill();_ctx.stroke();}_ctx.restore();}updateLineInspector();};
const lineBaseTool=setTool;
setTool=function(t){draggedLineEnd=null;lineBaseTool(t);canvasRedraw();};
setLineW=function(value){const width=Number(value);if(!Number.isFinite(width)||width<=0||width>40)return;canvasLineW=width;const s=canvasSelected===null?null:canvasShapes[canvasSelected];if(s&&s.type!=='image'&&s.lineW!==width){canvasHistory.push(JSON.stringify(canvasShapes));s.lineW=width;lineEdited();}};
setDash=function(value){if(!['solid','dashed','dotted'].includes(value))return;canvasDash=value;const s=canvasSelected===null?null:canvasShapes[canvasSelected];if(s&&s.type!=='image'){canvasHistory.push(JSON.stringify(canvasShapes));s.dash=value;s.dashOverride=true;lineEdited();}};
const lineBaseColor=setColor;
setColor=function(color){lineBaseColor(color);if(canvasSelected!==null&&canvasShapes[canvasSelected]?.type!=='image'){formDirty=true;scheduleDraft();}updateLineInspector();};
