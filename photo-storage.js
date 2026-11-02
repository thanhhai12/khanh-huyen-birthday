(()=>{
 // Keep the existing consumer API while routing every read/write through the
 // shared cloud store. There is deliberately no browser-local fallback.
 window.PhotoStorage=Object.freeze({
   async get(key){await CardCloud.ready;return CardCloud.getPhoto(key)},
   async set(key,value){await CardCloud.ready;return CardCloud.setPhoto(key,value)},
 });
})();
