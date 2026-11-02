 (async()=>{
 const groups=[
  ['Bìa thiệp',[
   ['peekHeading','Tiêu đề trên lá thư nhỏ','.letter-peek > span:first-child'],
   ['peekName','Tên trên lá thư nhỏ','.letter-peek strong'],
   ['peekHeart','Ký hiệu trên lá thư nhỏ','.peek-heart'],
   ['seal','Ký hiệu dấu sáp','.seal'],
   ['address','Dòng người nhận trên phong bì','.envelope-address','own'],
   ['addressNote','Dòng nhỏ trên phong bì','.envelope-address > span'],
  ]],
  ['Lời chúc · Bức thư',[
   ['eyebrow','Dòng chữ phía trên tiêu đề','#letter-stage .eyebrow'],
   ['heading','Tiêu đề chúc mừng','#letter-stage h1','own'],
   ['name','Tên người nhận ở tiêu đề','#letter-stage h1 > span'],
   ['letterOrnament','Ký hiệu trang trí trên giấy','.letter-heart'],
   ['salutation','Lời mở đầu','.salutation'],
   ['wish','Nội dung bức thư','#wish-text','multiline'],
   ['sign','Lời kết / chữ ký','.letter-sign'],
   ['signature','Dòng chữ nhỏ để mở dev mode','#dev-trigger'],
   ['scroll','Gợi ý kéo xuống','.scroll-cue','own'],
   ['arrow','Ký hiệu mũi tên','.scroll-cue > span'],
  ]],
  ['Lời chúc · Ảnh kỷ niệm',[
   ['photoEyebrow','Dòng chữ phía trên tiêu đề ảnh','#photo-stage .eyebrow'],
   ['photoHeading','Tiêu đề ảnh','#photo-stage h2'],
   ['photoNote','Dòng mô tả dưới tiêu đề','#photo-stage .section-intro > p'],
   ['crest','Ký hiệu trang trí khung ảnh','.frame-crest'],
   ['placeholderHeart','Ký hiệu trong khung trống','#photo-placeholder > span'],
   ['placeholder','Chữ trong khung ảnh trống','#photo-placeholder > p','multiline'],
   ['caption','Chú thích ảnh','figcaption'],
   ['closing','Lời chúc cuối trang','.closing'],
  ]],
  ['Tiêu đề trình duyệt & hỗ trợ đọc màn hình',[
   ['tabTitle','Tên tab trình duyệt','title'],
   ['openLabel','Tên nút mở thiệp cho trình đọc màn hình','#open-card','attr:aria-label'],
   ['readLabel','Tên nút đọc lại thiệp','#open-card','attr:data-read-label'],
   ['photoAlt','Mô tả ảnh 1','#memory-photo','attr:alt'],
   ['photoAlt2','Mô tả ảnh 2','#memory-photo-2','attr:alt'],
   ['photoAlt3','Mô tả ảnh 3','#memory-photo-3','attr:alt'],
   ['coverLabel','Tên phần bìa','.cover','attr:aria-label'],
   ['letterLabel','Tên phần lời chúc','#letter-stage','attr:aria-label'],
   ['articleLabel','Tên bức thư','.letter','attr:aria-label'],
   ['photoLabel','Tên phần ảnh','#photo-stage','attr:aria-label'],
   ['triggerLabel','Tên nút chữ ký','#dev-trigger','attr:aria-label'],
  ]],
 ];
 const container=document.getElementById('text-editor-fields');
 const status=document.getElementById('text-save-status');
 let shared;
 try{shared=await CardCloud.ready}catch{
   status.textContent='Không thể tải nội dung dùng chung. Trình chỉnh sửa chữ hiện không khả dụng.';
   return;
 }
 const values={};
 const inputs=[];
 function updatePermission(){inputs.forEach(input=>input.disabled=!CardCloud.canEdit)}
 function persist(){CardCloud.setText({...values})}
 groups.forEach(([title,fields],groupIndex)=>{
   const details=document.createElement('details');details.className='text-editor-group';details.open=groupIndex===0;
   const summary=document.createElement('summary');summary.textContent=title;details.append(summary);
   fields.forEach(([key,label,selector,mode='text'])=>{
     const element=document.querySelector(selector);
     let target=element;
     if(mode==='own')target=[...element.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
     const attr=mode.startsWith('attr:')?mode.slice(5):null;
     let initial=attr?element.getAttribute(attr):mode==='multiline'?element.innerText:target.textContent;
     if(key==='readLabel'&&!initial)initial='Đọc lại lời chúc dành cho Khánh Huyền';
     if(key==='placeholder')initial='Một khoảnh khắc xinh xắn\nđang chờ được đặt vào đây.';
     let value=typeof shared.text?.[key]==='string'?shared.text[key]:(initial??'');values[key]=value;
     function apply(text){
       if(attr){if(key==='openLabel'&&element.getAttribute('aria-expanded')==='true')return;element.setAttribute(attr,text)}
       else target.textContent=text;
       if(key==='seal'){const pocket=document.querySelector('.pocket-seal');if(pocket)pocket.textContent=text;}
     }
     apply(value);
     const fieldLabel=document.createElement('label');fieldLabel.htmlFor=`text-${key}`;fieldLabel.textContent=label;
     const input=document.createElement('textarea');input.id=fieldLabel.htmlFor;input.rows=key==='wish'?8:mode==='multiline'?3:1;input.value=value;input.spellcheck=false;inputs.push(input);
     input.addEventListener('input',()=>{values[key]=input.value;apply(input.value);persist()});
     details.append(fieldLabel,input);
   });
   container.append(details);
 });
 // CSS ornaments are exposed too, so no visible typographic marks are fixed.
 const marks=document.createElement('details');marks.className='text-editor-group';
 const summary=document.createElement('summary');summary.textContent='Họa tiết chữ trang trí trên tiêu đề';marks.append(summary);
 ['letter-stage','photo-stage'].forEach((id,index)=>{
   const key=`introOrnament${index}`,section=document.getElementById(id);
   const label=document.createElement('label');label.htmlFor=`text-${key}`;label.textContent=`Ký hiệu phía trên tiêu đề ${index===0?'lời chúc':'ảnh'}`;
   const input=document.createElement('textarea');input.id=label.htmlFor;input.rows=1;values[key]=typeof shared.text?.[key]==='string'?shared.text[key]:'❦';input.value=values[key];inputs.push(input);
   const apply=()=>section.style.setProperty('--intro-ornament',JSON.stringify(input.value));apply();
   input.addEventListener('input',()=>{values[key]=input.value;apply();persist()});marks.append(label,input);
 });container.append(marks);
 updatePermission();window.addEventListener('card-adminchange',updatePermission);
 status.textContent='Nội dung được chia sẻ qua cloud; trạng thái lưu sẽ hiển thị ở phần trạng thái chung. Có thể để trống để ẩn một dòng.';
})();
