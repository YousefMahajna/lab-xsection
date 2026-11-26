/* Real provider compiler and authorization checks. All database calls target localhost only. */
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const project='demo-xsection-rules',host='http://127.0.0.1:19007';
const hash='b70d99344caf17c98b6f910fa8f6edf32a7c016cb1035e8915f70d38901eb97f';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function token(uid,owner=false){const now=Math.floor(Date.now()/1000),payload={iss:'https://securetoken.google.com/'+project,aud:project,sub:uid,user_id:uid,iat:now,exp:now+3600,auth_time:now,firebase:{identities:{},sign_in_provider:owner?'password':'anonymous'},...(owner?{email:'ymahajna@nvidia.com',email_verified:true}:{})};return Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify(payload)).toString('base64url')+'.';}
async function request(route,method='GET',body,credential){const url=new URL(host+route+'.json');url.searchParams.set('ns',project);if(credential&&credential!=='owner')url.searchParams.set('auth',credential);return fetch(url,{method,headers:{...(credential==='owner'?{Authorization:'Bearer owner'}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)},signal:AbortSignal.timeout(10000)});}
(async()=>{let child;let logs='';try{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'xsection-emulator-')),jar=path.join(temp,'database.jar');
 const download=await fetch('https://storage.googleapis.com/firebase-preview-drop/emulator/firebase-database-emulator-v4.11.2.jar',{signal:AbortSignal.timeout(60000)});assert.ok(download.ok,'Official database emulator download failed');const binary=Buffer.from(await download.arrayBuffer());assert.equal(crypto.createHash('sha256').update(binary).digest('hex'),hash,'Official emulator checksum mismatch');await fs.writeFile(jar,binary);
 child=spawn('java',['-XX:+IgnoreUnrecognizedVMOptions','-XX:UseAVX=2','-jar',jar,'--host','127.0.0.1','--port','19007'],{stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);let failed;child.on('error',e=>failed=e);
 let ready=false;for(let i=0;i<120;i++){if(failed)throw failed;try{const r=await request('/','GET',undefined,'owner');if(r.ok){ready=true;break;}}catch{}if(child.exitCode!==null)throw Error('Database emulator exited: '+logs);await pause(500);}assert.ok(ready,'Database emulator did not become ready: '+logs);
 const fixed=await fs.readFile('firebase-database-rules.json','utf8');const broken=fixed.replace("data.child('deleted').val() != true","!data.child('deleted').val()");assert.notEqual(broken,fixed,'Regression fixture must restore the invalid boolean negation');
 const bad=await request('/.settings/rules','PUT',broken,'owner');assert.equal(bad.status,400,'Provider compiler must reject the old rule: '+await bad.text());
 const compiled=await request('/.settings/rules','PUT',fixed,'owner'),detail=await compiled.text();assert.equal(compiled.status,200,'Provider compiler rejected combined rules: '+detail);console.log('PASS: Firebase compiler rejects the old negation and accepts the complete corrected rules.');
 const anon=token('anonymous-one'),other=token('anonymous-two'),owner=token('owner',true),location='/xsectionSharedV1/requests/XS-2611-COMPILER';
 const denied=async r=>assert.ok([401,403].includes(r.status),'Expected permission denied, received '+r.status+': '+await r.text());
 await denied(await request('/xsectionSharedV1'));
 const allowed=await request('/xsectionSharedV1','GET',undefined,anon);assert.equal(allowed.status,200,await allowed.text());
 let record={schema:1,dataJSON:'{"id":"XS-2611-COMPILER","messages":[]}',deleted:false,revision:1,createdBy:'anonymous-one',updatedBy:'anonymous-one',updatedAt:{'.sv':'timestamp'}};
 const created=await request(location,'PUT',record,anon);assert.equal(created.status,200,await created.text());
 record={...record,revision:2,updatedBy:'anonymous-two'};const edited=await request(location,'PUT',record,other);assert.equal(edited.status,200,await edited.text());
 await denied(await request(location,'PUT',{...record,revision:3,deleted:true},other));
 await denied(await request(location,'PUT',{...record,revision:3,updatedBy:'owner'},other));
 await denied(await request(location,'DELETE',undefined,other));
 const removed=await request(location,'PUT',{...record,revision:3,deleted:true,updatedBy:'owner'},owner);assert.equal(removed.status,200,await removed.text());
 await denied(await request(location,'PUT',{...record,revision:4,deleted:false},other));
 const preserved=await request(location,'GET',undefined,'owner');assert.equal((await preserved.json()).dataJSON,record.dataJSON);console.log('PASS: real database allows anonymous reads/create/edit, denies unauthenticated access, forged authors and anonymous deletion/restoration, and retains owner-removed content.');
 }catch(e){console.error(e);if(logs)console.error(logs.slice(-5000));process.exitCode=1;}finally{if(child){child.kill('SIGTERM');await Promise.race([new Promise(r=>child.once('exit',r)),pause(3000)]);if(child.exitCode===null)child.kill('SIGKILL');}}})();

