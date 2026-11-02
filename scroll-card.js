(()=>{
 const cover=document.querySelector('.cover'),open=document.getElementById('open-card');
 const letter=document.getElementById('letter-stage'),photo=document.getElementById('photo-stage');
 const dialog=document.getElementById('dev-dialog'),status=document.getElementById('editor-status');
 const wish=document.getElementById('wish-text');
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 wish.textContent="Happy birthdayy 🎂\nMừng tuổi mới vợ ơi\n\nBọn anh chúc vợ tuổi mới luôn vui vẻ, hạnh phúc và gặp thật nhiều điều may mắn. Mong rằng mọi điều vợ mong muốn đều sẽ trở thành hiện thực, những ngày tháng phía trước luôn tràn ngập niềm vui và những người yêu thương Hoèn.\n\nChúc cho vợ luôn xinh đẹp, tự tin, bình an và mong cho mọi điều tốt đẹp sẽ đến với vợ nhé !";

 let opened=false,opening=false;
 open.addEventListener('click',()=>{
   if(opening)return;
   if(opened){letter.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});return}
   opening=true;open.setAttribute('aria-busy','true');cover.classList.add('is-opening');
   setTimeout(()=>{
     letter.hidden=false;photo.hidden=false;letter.classList.add('entering');opened=true;opening=false;
     open.setAttribute('aria-expanded','true');open.removeAttribute('aria-busy');open.setAttribute('aria-label',open.dataset.readLabel||'Đọc lại lời chúc dành cho Khánh Huyền');
     letter.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});
   },reduced()?0:1250);
 });
 function showEditor(){if(!dialog.open)dialog.showModal()}
 let taps=0,last=0;
 document.getElementById('dev-trigger').addEventListener('click',()=>{const now=Date.now();taps=now-last<1300?taps+1:1;last=now;if(taps===5){taps=0;showEditor()}});
 document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='e'){event.preventDefault();showEditor()}});
 const photoInput=document.getElementById('photo-input'),image=document.getElementById('memory-photo');
 const placeholder=document.getElementById('photo-placeholder'),remove=document.getElementById('remove-photo');
 let revision=0,photoReady=false;
 photoInput.disabled=true;remove.disabled=true;
 function applyPhoto(value){
   if(value===null){image.removeAttribute('src');image.hidden=true;placeholder.hidden=false;remove.disabled=false;return}
   image.src=value;image.hidden=false;placeholder.hidden=true;remove.disabled=false;
 }
 const photoRestore=(async()=>{
   try{const saved=await PhotoStorage.get('main');if(saved!==undefined)applyPhoto(saved);photoReady=true;photoInput.disabled=false;remove.disabled=image.hidden;}
   catch{status.textContent='Không thể khôi phục ảnh đã lưu. Hãy tải lại trang trước khi chỉnh sửa.';}
 })();
 photoInput.addEventListener('change',async()=>{
   const file=photoInput.files[0];if(!file)return;if(!photoReady){photoInput.value='';return}const current=++revision;photoInput.disabled=true;remove.disabled=true;
   if(!['image/jpeg','image/png','image/webp','image/avif','image/gif'].includes(file.type)||file.size>8*1024*1024){status.textContent='Chọn ảnh JPG, PNG, WebP, AVIF hoặc GIF, tối đa 8 MB.';photoInput.value='';photoInput.disabled=false;remove.disabled=image.hidden;return}
   try{
     const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
     await new Promise((resolve,reject)=>{const test=new Image();test.onload=resolve;test.onerror=reject;test.src=url});
     if(current!==revision)return;
     await PhotoStorage.set('main',url);
     if(current!==revision)return;
     image.src=url;image.hidden=false;placeholder.hidden=true;remove.disabled=false;status.textContent='Đã thay ảnh trong bố cục thư và ảnh.';
   }catch(error){if(current!==revision)return;status.textContent=error?.message?.includes('storage')||error?.message?.includes('save')||error?.message?.includes('Photo')?'Không thể lưu ảnh trên thiết bị này. Ảnh chưa được thay đổi.':'Không đọc được ảnh, bạn thử ảnh khác nhé.';photoInput.value=''}
   photoInput.disabled=false;remove.disabled=image.hidden;
 });
 remove.addEventListener('click',async()=>{if(!photoReady)return;const current=++revision;photoInput.disabled=true;remove.disabled=true;try{await PhotoStorage.set('main',null);if(current!==revision)return;image.removeAttribute('src');image.hidden=true;placeholder.hidden=false;photoInput.value='';status.textContent='Đã trả khung ảnh về trạng thái trống.';}catch{if(current===revision)status.textContent='Không thể lưu thay đổi. Ảnh chưa được xóa.';}finally{if(current===revision){photoInput.disabled=false;remove.disabled=image.hidden}}});
})();
