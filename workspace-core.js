(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.XSCore=api;})(globalThis,function(){
  'use strict';
  const LIMIT=8000000;
  function archiveURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
  function cloudURL(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='firebasestorage.googleapis.com'&&u.pathname.startsWith('/v0/b/lab-tracker-nvidia.firebasestorage.app/o/xsection%2F')&&!u.username&&!u.password;}catch{return false;}}
  function length(a,b,calibration){const px=Math.hypot(b.x-a.x,b.y-a.y);return calibration?.pixels>0&&calibration?.value>0?{value:px*calibration.value/calibration.pixels,unit:calibration.unit}:{value:px,unit:'px'};}
  function verdict(value,min,max){if(!Number.isFinite(value))return 'Invalid';const lo=min===''||min==null?null:Number(min),hi=max===''||max==null?null:Number(max);if(lo!==null&&!Number.isFinite(lo)||hi!==null&&!Number.isFinite(hi)||lo!==null&&hi!==null&&lo>hi)return 'Invalid limits';if(lo===null&&hi===null)return 'Recorded';return (lo===null||value>=lo)&&(hi===null||value<=hi)?'Within limits':'Outside limits';}
  const size=request=>JSON.stringify(request).length;
  function capacity(request,extra=0){const used=size(request)+extra;return {used,remaining:Math.max(0,LIMIT-used),percent:Math.min(100,used/LIMIT*100),fits:used<=LIMIT};}
  return {LIMIT,archiveURL,cloudURL,length,verdict,size,capacity};
});
