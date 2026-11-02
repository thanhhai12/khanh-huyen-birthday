(()=>{
 const viewer=document.getElementById('keepsake-viewer'),content=document.getElementById('keepsake-viewer-content');
 function fitLetter(){
   const paper=content.querySelector('.letter');if(!paper)return;
   paper.style.removeProperty('transform');
   const availableW=content.clientWidth,availableH=content.clientHeight;
   const compact=matchMedia('(max-width:700px)').matches;
   const width=compact?Math.min(700,availableW):Math.min(1200,availableW);
   paper.style.width=width+'px';
   // Padding percentages on an absolutely positioned paper use the viewer width.
   // Resolve them against the paper itself so desktop gutters cannot crush the text.
   paper.style.padding=compact?`${width*.30}px ${width*.20}px ${width*.60}px`:`${width*.18}px ${width*.16}px ${width*.24}px`;
   paper.style.setProperty('--reader-font',compact?(width<450?'16px':'19px'):`${Math.min(28,Math.max(20,width*.025))}px`);
   const naturalH=paper.offsetHeight;
   const scale=Math.min(1,availableH/naturalH,availableW/width);
   paper.style.transform=`scale(${scale})`;
   content.style.setProperty('--paper-height',naturalH*scale+'px');
 }
 function show(node){content.replaceChildren(node);viewer.classList.toggle('reading-letter',node.classList.contains('letter'));viewer.showModal();document.documentElement.classList.add('viewer-open');requestAnimationFrame(fitLetter)}
 viewer.addEventListener('close',()=>document.documentElement.classList.remove('viewer-open'));
 new ResizeObserver(()=>{if(viewer.open)fitLetter()}).observe(content);
 window.visualViewport?.addEventListener('resize',()=>{if(viewer.open)fitLetter()});
 document.fonts?.ready.then(()=>{if(viewer.open)fitLetter()});
 document.querySelector('.read-letter-hit').addEventListener('click',()=>{
   const copy=document.querySelector('.keepsake-composition .letter').cloneNode(true);
   copy.querySelectorAll('[id]').forEach(el=>{el.classList.add(el.id);el.removeAttribute('id')});show(copy);
 });
 function showPhoto(image){
   if(image.hidden){const note=document.createElement('p');note.textContent='Ô ảnh đang trống. Bạn có thể chọn ảnh trong dev mode.';show(note);return}
   const copy=image.cloneNode();copy.removeAttribute('id');copy.hidden=false;show(copy);
 }
 document.querySelector('.photo-open-hit').addEventListener('click',()=>showPhoto(document.getElementById('memory-photo')));
 document.querySelectorAll('.snapshot').forEach(button=>button.addEventListener('click',()=>showPhoto(button.querySelector('img'))));
 const holder=document.getElementById('extra-photo-editors'),status=document.getElementById('editor-status');
 [2,3].forEach(index=>{
   const div=document.createElement('div');div.className='extra-photo-control';
   const label=document.createElement('label');label.htmlFor=`photo-input-${index}`;label.textContent=`Ảnh kỷ niệm ${index} · ảnh phía sau`;
   const input=document.createElement('input');input.type='file';input.id=label.htmlFor;input.accept='image/jpeg,image/png,image/webp,image/avif,image/gif';input.disabled=true;
   const remove=document.createElement('button');remove.type='button';remove.className='editor-button secondary';remove.textContent=`Xóa ảnh ${index}`;remove.disabled=true;
   const image=document.getElementById(`memory-photo-${index}`),placeholder=image.previousElementSibling;let revision=0,ready=false,busy=false;remove.disabled=true;
   function updatePermission(){const editable=ready&&CardCloud.canEdit&&!busy;input.disabled=!editable;remove.disabled=!editable||image.hidden}
   window.addEventListener('card-adminchange',updatePermission);
   (async()=>{try{await CardCloud.ready;const saved=await PhotoStorage.get(`extra-${index}`);if(saved===null){image.removeAttribute('src');image.hidden=true;placeholder.hidden=false;}else if(saved!==undefined){image.src=saved;image.hidden=false;placeholder.hidden=true;}ready=true;updatePermission();}catch{status.textContent=`Không thể tải ảnh ${index} dùng chung từ cloud. Chỉnh sửa ảnh hiện không khả dụng.`;}})();
   input.addEventListener('change',async()=>{
     const file=input.files[0];if(!file)return;if(!ready||!CardCloud.canEdit){input.value='';return}const current=++revision;busy=true;updatePermission();
     if(!['image/jpeg','image/png','image/webp','image/avif','image/gif'].includes(file.type)||file.size>8*1024*1024){status.textContent='Chọn ảnh JPG, PNG, WebP, AVIF hoặc GIF tối đa 8 MB.';input.value='';busy=false;updatePermission();return}
     try{
       const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
       await new Promise((resolve,reject)=>{const test=new Image();test.onload=resolve;test.onerror=reject;test.src=url});
       if(current!==revision)return;await PhotoStorage.set(`extra-${index}`,url);if(current!==revision)return;image.src=url;image.hidden=false;placeholder.hidden=true;remove.disabled=false;status.textContent=`Đã thay ảnh ${index}.`;
     }catch(error){if(current===revision){status.textContent=error?.message?.includes('storage')||error?.message?.includes('save')||error?.message?.includes('Photo')?`Không thể lưu ảnh ${index} lên cloud. Ảnh chưa được thay đổi.`:'Không đọc được ảnh. Bạn thử ảnh khác nhé.';input.value=''}}
     if(current===revision){busy=false;updatePermission()}
   });
   remove.addEventListener('click',async()=>{if(!ready||!CardCloud.canEdit||busy)return;const current=++revision;busy=true;updatePermission();try{await PhotoStorage.set(`extra-${index}`,null);if(current!==revision)return;image.removeAttribute('src');image.hidden=true;placeholder.hidden=false;input.value='';status.textContent=`Ảnh ${index} đã được xóa khỏi nội dung dùng chung.`;}catch{if(current===revision)status.textContent=`Không thể lưu thay đổi ảnh ${index} lên cloud. Ảnh chưa được xóa.`;}finally{if(current===revision){busy=false;updatePermission()}}});
   div.append(label,input,remove);holder.append(div);
 });
})();
