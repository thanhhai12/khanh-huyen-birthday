(()=>{
 const viewer=document.getElementById('keepsake-viewer'),content=document.getElementById('keepsake-viewer-content');
 function fitLetter(){
   const paper=content.querySelector('.letter');if(!paper)return;
   paper.style.removeProperty('transform');
   const availableW=content.clientWidth,availableH=content.clientHeight;
   const width=Math.min(700,availableW);paper.style.width=width+'px';
   paper.style.setProperty('--reader-font',width<450?'16px':'19px');
   const naturalH=paper.offsetHeight;
   const scale=Math.min(1,availableH/naturalH,availableW/width);
   paper.style.transform=`scale(${scale})`;
   content.style.setProperty('--paper-height',naturalH*scale+'px');
 }
 function show(node){content.replaceChildren(node);viewer.classList.toggle('reading-letter',node.classList.contains('letter'));viewer.showModal();document.documentElement.classList.add('viewer-open');requestAnimationFrame(fitLetter)}
 viewer.addEventListener('close',()=>document.documentElement.classList.remove('viewer-open'));
 new ResizeObserver(()=>{if(viewer.open)fitLetter()}).observe(content);
 window.visualViewport?.addEventListener('resize',()=>{if(viewer.open)fitLetter()});
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
   const input=document.createElement('input');input.type='file';input.id=label.htmlFor;input.accept='image/jpeg,image/png,image/webp,image/avif,image/gif';
   const remove=document.createElement('button');remove.type='button';remove.className='editor-button secondary';remove.textContent=`Xóa ảnh ${index}`;remove.disabled=true;
   const image=document.getElementById(`memory-photo-${index}`),placeholder=image.previousElementSibling;let revision=0;remove.disabled=image.hidden;
   input.addEventListener('change',async()=>{
     const file=input.files[0];if(!file)return;const current=++revision;
     if(!['image/jpeg','image/png','image/webp','image/avif','image/gif'].includes(file.type)||file.size>8*1024*1024){status.textContent='Chọn ảnh JPG, PNG, WebP, AVIF hoặc GIF tối đa 8 MB.';input.value='';return}
     try{
       const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
       await new Promise((resolve,reject)=>{const test=new Image();test.onload=resolve;test.onerror=reject;test.src=url});
       if(current!==revision)return;image.src=url;image.hidden=false;placeholder.hidden=true;remove.disabled=false;status.textContent=`Đã thay ảnh ${index}.`;
     }catch{if(current===revision){status.textContent='Không đọc được ảnh. Bạn thử ảnh khác nhé.';input.value=''}}
   });
   remove.addEventListener('click',()=>{revision++;image.removeAttribute('src');image.hidden=true;placeholder.hidden=false;input.value='';remove.disabled=true;status.textContent=`Đã xóa ảnh ${index}.`});
   div.append(label,input,remove);holder.append(div);
 });
})();
