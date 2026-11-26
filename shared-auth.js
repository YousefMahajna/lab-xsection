(function(root){
 'use strict';let current=null,readyPromise;
 function ready(){if(!readyPromise)readyPromise=(async()=>{
  await root.LabFirebaseAuth.ready();const owner=root.LabFirebaseAuth.user();
  if(owner?.emailVerified&&owner.email.toLowerCase()==='ymahajna@nvidia.com'){current=owner;return current;}
  const [apps,sdk]=await Promise.all([import('https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js')]);
  const name='xsection-name-only',app=apps.getApps().find(a=>a.name===name)||apps.initializeApp(root.LabFirebaseConfig,name),auth=sdk.getAuth(app);
  await sdk.setPersistence(auth,sdk.browserLocalPersistence);await auth.authStateReady();if(!auth.currentUser)await sdk.signInAnonymously(auth);current=auth.currentUser;return current;
 })().catch(e=>{readyPromise=null;if(['auth/operation-not-allowed','auth/admin-restricted-operation'].includes(e.code))throw Error('Enable Anonymous in Firebase Authentication → Sign-in method, then reload X-section.');throw e;});return readyPromise;}
 const isOwner=()=>!!(current?.emailVerified&&current.email?.toLowerCase()==='ymahajna@nvidia.com');
 root.XSectionAuth={ready,user:()=>current,isOwner,token:async()=>{await ready();return current?.getIdToken();}};
})(globalThis);
