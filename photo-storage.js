(()=>{
 const databaseName='birthday-card-photos',storeName='photos',version=1;
 let databasePromise;
 function database(){
   if(!('indexedDB'in window))return Promise.reject(new Error('Photo storage is unavailable in this browser.'));
   if(databasePromise)return databasePromise;
   databasePromise=new Promise((resolve,reject)=>{
     const request=indexedDB.open(databaseName,version);
     request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(storeName))request.result.createObjectStore(storeName)};
     request.onsuccess=()=>resolve(request.result);
     request.onerror=()=>reject(request.error||new Error('Could not open photo storage.'));
     request.onblocked=()=>reject(new Error('Photo storage is blocked by another tab.'));
   });
   return databasePromise;
 }
 async function get(key){
   const db=await database();
   return new Promise((resolve,reject)=>{
     const request=db.transaction(storeName,'readonly').objectStore(storeName).get(key);
     request.onsuccess=()=>resolve(request.result);
     request.onerror=()=>reject(request.error||new Error('Could not restore photo.'));
   });
 }
 async function set(key,value){
   const db=await database();
   if(navigator.storage?.persist)await navigator.storage.persist().catch(()=>false);
   return new Promise((resolve,reject)=>{
     const transaction=db.transaction(storeName,'readwrite');
     transaction.objectStore(storeName).put(value,key);
     transaction.oncomplete=()=>resolve();
     transaction.onerror=()=>reject(transaction.error||new Error('Could not save photo.'));
     transaction.onabort=()=>reject(transaction.error||new Error('Photo save was interrupted.'));
   });
 }
 window.PhotoStorage=Object.freeze({get,set});
})();
