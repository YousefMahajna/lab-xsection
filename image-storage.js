/* Originals live in Cloud Storage; request records retain references and image metadata. */
(function(root){
  'use strict';let sdkPromise,unavailable=false;
  async function connect(){
    if(unavailable)throw Error('File storage is not connected.');
    if(!sdkPromise)sdkPromise=(async()=>{await XSectionAuth.ready();const [apps,sdk]=await Promise.all([import('https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/13.4.0/firebase-storage.js')]);const app=apps.getApps().find(a=>a.name===(XSectionAuth.isOwner()?'interconnect-shared':'xsection-name-only'));if(!app)throw Error('The shared session is not ready.');const storage=sdk.getStorage(app);storage.maxUploadRetryTime=15000;storage.maxOperationRetryTime=10000;return {sdk,storage};})().catch(e=>{sdkPromise=null;throw e;});
    return sdkPromise;
  }
  async function upload(requestId,file,name,onProgress){
    if(!/^XS-[A-Z0-9-]{5,70}$/.test(requestId))throw Error('Invalid request ID.');
    if(!file.size||file.size>60000000)throw Error('Choose a file between 1 byte and 60 MB.');
    let connection;try{connection=await connect();}catch(e){unavailable=true;throw e;}
    const {sdk,storage}=connection,safeName=String(name||file.name||'image').replace(/[^A-Za-z0-9._-]/g,'_').slice(-100),object=sdk.ref(storage,'xsection/'+XSectionAuth.user().uid+'/'+requestId+'/'+crypto.randomUUID()+'-'+safeName);
    const task=sdk.uploadBytesResumable(object,file,{contentType:file.type||'application/octet-stream',customMetadata:{requestId}});
    const timer=setTimeout(()=>task.cancel(),45000);
    try{await new Promise((resolve,reject)=>task.on('state_changed',s=>onProgress?.(s.totalBytes?Math.round(s.bytesTransferred/s.totalBytes*100):0),reject,resolve));return {url:await sdk.getDownloadURL(object),path:object.fullPath,bytes:file.size,name:name||file.name};}
    catch(e){unavailable=true;throw e;}finally{clearTimeout(timer);}
  }
  root.XSFiles={upload,isUnavailable:()=>unavailable,retry:()=>{unavailable=false;sdkPromise=null;}};
})(globalThis);
