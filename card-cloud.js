(()=>{
 'use strict';
 const repository='thanhhai12/khanh-huyen-birthday';
 const path='card-content.json';
 const api=`https://api.github.com/repos/${repository}/contents/${path}`;
 const raw=`https://raw.githubusercontent.com/${repository}/main/${path}`;
 const status=document.getElementById('cloud-status');
 const tokenInput=document.getElementById('cloud-token');
 const connect=document.getElementById('cloud-connect');
 const disconnect=document.getElementById('cloud-disconnect');
 const importButton=document.getElementById('cloud-import');
 let state={version:1,text:{},photos:{}},token='',sha='',dirty=false,saving=false,timer,loaded=false,connecting=false;
 const say=(message,error=false)=>{status.textContent=message;status.dataset.error=String(error)};
 const clone=value=>JSON.parse(JSON.stringify(value));
 function validate(value){
   if(!value||value.version!==1||!value.text||typeof value.text!=='object'||Array.isArray(value.text)||!value.photos||typeof value.photos!=='object'||Array.isArray(value.photos))throw new Error('Nội dung dùng chung không hợp lệ.');
   for(const valueText of Object.values(value.text))if(typeof valueText!=='string')throw new Error('Nội dung chữ không hợp lệ.');
   for(const [key,url] of Object.entries(value.photos))if(!['main','extra-2','extra-3'].includes(key)||(url!==null&&!(typeof url==='string'&&/^data:image\/(jpeg|png|webp|avif|gif);base64,/.test(url))))throw new Error('Ảnh dùng chung không hợp lệ.');
   return value;
 }
 function notify(){
   const editable=Boolean(token)&&loaded&&!connecting&&!saving;
   disconnect.hidden=!token;importButton.disabled=!editable||dirty||saving;
   window.dispatchEvent(new Event('card-adminchange'));
 }
 function headers(){return {'Authorization':`Bearer ${token}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'}}
 async function responseJSON(response){
   if(response.ok)return response.json();
   if(response.status===409||response.status===422)throw new Error('Nội dung trên web đã đổi. Hãy giữ bản đang chỉnh và tải lại trang trước khi sửa tiếp để tránh ghi đè.');
   if(response.status===401||response.status===403||response.status===404)throw new Error('Không có quyền lưu. Kiểm tra token: chọn đúng repository và cấp quyền Contents: Read and write.');
   throw new Error('Chưa lưu được lên web. Kiểm tra kết nối rồi bấm Lưu lại.');
 }
 function encode(value){const bytes=new TextEncoder().encode(JSON.stringify(value,null,2));let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary)}
 async function write(snapshot){
   const updatedAt=new Date().toISOString();
   const response=await fetch(api,{method:'PUT',headers:headers(),body:JSON.stringify({message:'Update birthday card content',content:encode({...snapshot,updatedAt}),sha,branch:'main'})});
   const result=await responseJSON(response);sha=result.content.sha;state.updatedAt=updatedAt;
 }
 async function flush(){
   clearTimeout(timer);
   if(saving||!dirty)return;
   if(!token)throw new Error('Cần kết nối quản trị để lưu cho mọi người.');
   saving=true;notify();
   try{
     while(dirty){dirty=false;const snapshot=clone(state);say('Đang lưu lên web…');try{await write(snapshot)}catch(error){dirty=true;throw error}}
     say('Đã lưu cho mọi người. Thiết bị khác tải lại trang để nhận bản mới.');
   }catch(error){say(error.message,true);throw error}
   finally{saving=false;notify()}
 }
 function schedule(){dirty=true;say('Có thay đổi chưa lưu — đang chờ đồng bộ…');notify();clearTimeout(timer);timer=setTimeout(()=>flush().catch(()=>{}),1500)}
 const ready=(async()=>{
   try{
     const response=await fetch(`${raw}?v=${Date.now()}`,{cache:'no-store'});
     if(!response.ok)throw new Error('Không tải được nội dung dùng chung. Kiểm tra mạng rồi tải lại trang.');
     state=validate(await response.json());loaded=true;document.documentElement.removeAttribute('data-card-loading');document.getElementById('card-loading').hidden=true;say('Đang xem bản dùng chung. Kết nối quản trị để chỉnh sửa.');return clone(state);
   }catch(error){document.getElementById('card-loading').textContent='Không tải được thiệp. Bạn kiểm tra mạng rồi tải lại trang nhé.';say(error.message,true);throw error}
 })();
 // Public reading never uses the admin credential; it lives only in memory.
 window.CardCloud=Object.freeze({ready,get canEdit(){return Boolean(token)&&loaded&&!connecting&&!saving},async getPhoto(key){await ready;return state.photos[key]},async setPhoto(key,value){await ready;if(!this.canEdit)throw new Error('Chưa kết nối quản trị.');if(saving||dirty)await flush();if(saving)throw new Error('Đang lưu thay đổi khác. Hãy thử lại sau.');const before=state.photos[key];const had=Object.hasOwn(state.photos,key);state.photos[key]=value;dirty=true;try{await flush()}catch(error){if(had)state.photos[key]=before;else delete state.photos[key];dirty=false;throw error}},setText(values){if(!this.canEdit)throw new Error('Chưa kết nối quản trị.');state.text={...values};schedule()},flush});
 ready.catch(()=>{});
 connect.addEventListener('click',async()=>{
   if(connecting)return;const candidate=tokenInput.value.trim();if(!candidate){say('Nhập token quản trị GitHub ở ô phía trên.',true);return}
   connecting=true;connect.disabled=true;token=candidate;tokenInput.value='';say('Đang kiểm tra quyền quản trị…');notify();
   try{
     await ready;
     // Bind to the latest version before editing; a later conflict never overwrites it.
     const metadata=await responseJSON(await fetch(api,{headers:headers(),cache:'no-store'}));
     let latest;
     if(metadata.encoding==='base64'&&metadata.content){const binary=atob(metadata.content.replace(/\s/g,''));latest=JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0))))}
     else{const blob=await responseJSON(await fetch(`https://api.github.com/repos/${repository}/git/blobs/${metadata.sha}`,{headers:headers(),cache:'no-store'}));if(blob.encoding!=='base64')throw new Error('Không đọc được nội dung mới nhất.');const binary=atob(blob.content.replace(/\s/g,''));latest=JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0))))}
     if(JSON.stringify(validate(latest))!==JSON.stringify(state)){token='';say('Nội dung trên web đã cập nhật. Hãy tải lại trang rồi kết nối để chỉnh bản mới nhất.',true);return}
     sha=metadata.sha;say('Đã kết nối. Sửa chữ sẽ tự lưu; thay hoặc xóa ảnh sẽ lưu ngay cho mọi người.');
   }catch(error){token='';say(error.message,true)}finally{connecting=false;connect.disabled=false;notify()}
 });
 disconnect.addEventListener('click',async()=>{if(saving||dirty){say('Hãy chờ lưu xong hoặc bấm Lưu lại trước khi ngắt kết nối.',true);return}token='';sha='';say('Đã ngắt kết nối quản trị.');notify()});
 document.getElementById('cloud-save').addEventListener('click',()=>flush().catch(()=>{}));
 window.addEventListener('beforeunload',event=>{if(dirty||saving){event.preventDefault();event.returnValue=''}});
 async function oldPhotos(){
   return new Promise((resolve,reject)=>{const request=indexedDB.open('birthday-card-photos');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result;if(!db.objectStoreNames.contains('photos')){db.close();resolve({});return}const result={};const transaction=db.transaction('photos','readonly');for(const key of ['main','extra-2','extra-3']){const get=transaction.objectStore('photos').get(key);get.onsuccess=()=>{if(get.result!==undefined)result[key]=get.result}}transaction.oncomplete=()=>{db.close();resolve(result)};transaction.onerror=()=>{db.close();reject(transaction.error)}}});
 }
 importButton.addEventListener('click',async()=>{
   if(!window.CardCloud.canEdit||dirty||saving)return;importButton.disabled=true;
   try{const text=JSON.parse(localStorage.getItem('khanh-huyen-card-text-v1')||'{}'),photos=await oldPhotos();if(!Object.keys(text).length&&!Object.keys(photos).length){say('Thiết bị này không có bản chỉnh cũ để đồng bộ.');return}validate({version:1,text,photos});state={...state,text:{...state.text,...text},photos:{...state.photos,...photos}};dirty=true;await flush();location.reload()}
   catch(error){say(error.message||'Không đọc được bản chỉnh cũ trên thiết bị.',true)}finally{notify()}
 });
})();
