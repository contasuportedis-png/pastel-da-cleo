let DB=loadDB();
let cart=JSON.parse(localStorage.getItem('cleo_cart')||'[]');
let activeFilter='all', searchTerm='', checkout={nome:'',tipo:'retirada',rua:'',numero:'',bairro:'',compl:'',ref:'',pag:'Pix',troco:'nao',trocoPara:''};
function saveCart(){localStorage.setItem('cleo_cart',JSON.stringify(cart));renderCart();}
const $=s=>document.querySelector(s);
function productById(id){return DB.products.find(p=>p.id===id);}
function catName(id){return (DB.categories.find(c=>c.id===id)||{}).nome||id;}
function isOpenNow(){
  try{
    const sp=new Date(new Date().toLocaleString('en-US',{timeZone:'America/Sao_Paulo'}));
    const jsDay=sp.getDay(); // 0 dom
    const map=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    const h=DB.hours.find(x=>x.dia===map[jsDay]);
    if(!h||h.fechado)return{open:false,label:'Fechado agora'};
    const cur=sp.getHours()*60+sp.getMinutes();
    const [oH,oM]=h.open.split(':').map(Number),[cH,cM]=h.close.split(':').map(Number);
    const open=cur>=(oH*60+oM)&&cur<(cH*60+cM);
    return{open,label:open?'Aberto agora':'Fechado agora'};
  }catch(e){return{open:false,label:''};}
}
function renderStatus(){
  const st=isOpenNow();
  document.querySelectorAll('[data-open-status]').forEach(el=>{
    el.innerHTML=`<span class="dot ${st.open?'':'closed'}"></span> ${st.label} • Qua–Dom 19h às 23h`;
    el.classList.toggle('hours-closed',!st.open);el.classList.toggle('hours-open',st.open);
    el.style.cssText=st.open?'background:#e9f9ef;border:1px solid #bfe8cc;color:#136b32;font-weight:800;border-radius:999px;padding:8px 14px;display:inline-flex;gap:8px;font-size:13px':'background:#fdebee;border:1px solid #f5c2cc;color:#8a0f24;font-weight:800;border-radius:999px;padding:8px 14px;display:inline-flex;gap:8px;font-size:13px';
  });
  const hb=$('#hoursBadge');if(hb){hb.className=st.open?'hours-open':'hours-closed';hb.innerHTML=(st.open?'🟢 ':'🔴 ')+st.label;}
}
function cardHTML(p){
  const unavailable=p.preco==null||!p.ativo;
  return `<article class="card ${unavailable?'unavail':''}">
   <div class="card-img"><img loading="lazy" decoding="async" src="${typeof SEC!=='undefined'?SEC.safeImg(p.img):esc(p.img)}" alt="${esc(p.nome)}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop'">
   ${p.favorito?'<span class="badge">❤️ Favorito</span>':''}${p.promo?'<span class="badge red" style="left:auto;right:12px">Promo</span>':''}</div>
   <div class="card-body"><h3>${esc(p.nome)}</h3><p>${esc(p.desc)}</p>
   <div class="price-row"><div class="price">${p.preco==null?'Consultar':money(p.preco)}</div>
   <button class="add-btn" onclick="openProduct('${p.id}')">+ Adicionar</button></div></div></article>`;
}
function renderFavs(){
  const favs=DB.products.filter(p=>p.favorito&&p.ativo).slice(0,6);
  $('#favGrid').innerHTML=favs.length?favs.map(cardHTML).join(''):'<div class="empty">Informação a configurar no painel administrativo.</div>';
}
function renderChips(){
  const base=[{id:'all',nome:'Todos',emoji:'🍽️'},{id:'fav',nome:'Mais pedidos',emoji:'❤️'}];
  const cats=[...DB.categories].sort((a,b)=>a.ordem-b.ordem).map(c=>({...c,id:'cat:'+c.id}));
  const all=[...base,...cats];
  $('#chips').innerHTML=all.map(c=>`<button class="chip ${activeFilter===(c.id==='all'?'all':c.id==='fav'?'fav':c.id)?'active':''}" data-filter="${esc(c.id)}">${esc(c.emoji)} ${esc(c.nome)}</button>`).join('');
  $('#chips').querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>setFilter(b.dataset.filter)));
}
function setFilter(f){
  f=String(f||'all');
  const ok=f==='all'||f==='fav'||DB.categories.some(c=>('cat:'+c.id)===f);
  activeFilter=ok?f:'all';renderChips();renderMenu();}
function renderMenu(){
  let list=DB.products.filter(p=>p.ativo);
  if(activeFilter==='fav')list=list.filter(p=>p.favorito);
  else if(activeFilter.startsWith('cat:'))list=list.filter(p=>p.categoria===activeFilter.slice(4));
  if(searchTerm){const t=searchTerm.toLowerCase();list=list.filter(p=>(p.nome+' '+p.desc).toLowerCase().includes(t));}
  const box=$('#menuList');
  if(!list.length){box.innerHTML='<div class="empty">Nenhum produto encontrado. Tente buscar por carne, queijo, frango...</div>';return;}
  if(activeFilter==='all'&&!searchTerm){
    const cats=[...DB.categories].sort((a,b)=>a.ordem-b.ordem);
    box.innerHTML=cats.map(c=>{
      const items=list.filter(p=>p.categoria===c.id);
      if(!items.length)return'';
      return `<div class="cat-title"><i>${esc(c.emoji)}</i> ${esc(c.nome)}</div><div class="grid-cards">${items.map(cardHTML).join('')}</div>`;
    }).join('')||'<div class="empty">Informação a configurar no painel administrativo.</div>';
  }else{
    box.innerHTML=`<div class="grid-cards">${list.map(cardHTML).join('')}</div>`;
  }
}
/* product modal */
let modalPid=null,modalQty=1,modalAddons=new Set(),modalObs='';
function openProduct(id){
  const p=productById(id);if(!p)return;
  modalPid=id;modalQty=1;modalAddons=new Set();modalObs='';
  const addons=DB.addons.filter(a=>a.ativo);
  $('#modalBox').innerHTML=`
   <img class="modal-img" src="${typeof SEC!=='undefined'?SEC.safeImg(p.img):esc(p.img)}" alt="${esc(p.nome)}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop'">
   <div class="modal-pad">
    <h3 style="margin:0;font-family:Sora;font-size:22px">${esc(p.nome)}</h3>
    <p style="color:#6B625C">${esc(p.desc)}</p>
    <div class="price" style="font-size:22px">${p.preco==null?'Preço a configurar':money(p.preco)}</div>
    <h4 style="margin:16px 0 8px">Quantidade</h4>
    <div class="qty" style="font-size:18px"><button onclick="mQty(-1)">−</button><strong id="mQty">1</strong><button onclick="mQty(1)">+</button></div>
    <h4 style="margin:16px 0 8px">Adicionais</h4>
    <div id="mAddons">${addons.length?addons.map(a=>`<div class="addon" onclick="toggleAddon('${a.id}',this)"><label style="display:flex;gap:10px;align-items:center"><input type="checkbox"> ${esc(a.nome)}</label><strong>${a.preco?money(a.preco):'Grátis'}</strong></div>`).join(''):'<div class="notice">Informação a configurar no painel administrativo.</div>'}</div>
    <div class="field" style="margin-top:12px"><label>Observações (ex: sem cebola)</label><textarea id="mObs" maxlength="200" placeholder="Sem cebola..."></textarea></div>
    <button class="btn btn-primary btn-block btn-lg" onclick="addToCart()">ADICIONAR AO CARRINHO • <span id="mTotal"></span></button>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Continuar comprando</button>
   </div>`;
  updateModalTotal();openOverlay('productModal');
}
function mQty(d){modalQty=Math.max(1,Math.min(20,modalQty+d));$('#mQty').textContent=modalQty;updateModalTotal();}
function toggleAddon(id,el){const cb=el.querySelector('input');cb.checked=!cb.checked;el.classList.toggle('sel',cb.checked);cb.checked?modalAddons.add(id):modalAddons.delete(id);updateModalTotal();}
function updateModalTotal(){const p=productById(modalPid);let t=(Number(p.preco)||0)*modalQty;modalAddons.forEach(id=>{const a=DB.addons.find(x=>x.id===id);if(a)t+=Number(a.preco||0)*modalQty;});const e=$('#mTotal');if(e)e.textContent=p.preco==null?'Consultar':money(t);}
function addToCart(){
  const p=productById(modalPid);if(p.preco==null){alert('Preço deste produto ainda está a configurar. Chame no WhatsApp para consultar.');return;}
  modalObs=String((($('#mObs')||{}).value||'')).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').trim().slice(0,200);
  const key=modalPid+'|'+[...modalAddons].sort().join(',')+'|'+modalObs;
  const found=cart.find(i=>i.key===key);
  if(found)found.qty+=modalQty;else cart.push({key,pid:modalPid,qty:modalQty,addons:[...modalAddons],obs:modalObs});
  saveCart();closeModal();openCart();
}
/* cart */
function cartDetailed(){return cart.map(i=>{const p=productById(i.pid);const ad=i.addons.map(id=>DB.addons.find(a=>a.id===id)).filter(Boolean);const unit=(Number(p?.preco)||0)+ad.reduce((s,a)=>s+Number(a.preco||0),0);return{...i,p,ad,unit,sub:unit*i.qty};});}
function cartSubtotal(){return cartDetailed().reduce((s,i)=>s+i.sub,0);}
function renderCart(){
  const n=cart.reduce((s,i)=>s+i.qty,0);
  document.querySelectorAll('[data-cart-count]').forEach(e=>e.textContent=n);
  const box=$('#cartItems');if(!box)return;
  if(!cart.length){box.innerHTML='<div class="empty">Seu carrinho está vazio.<br>Que tal um pastel crocante? 🥟</div>';}
  else box.innerHTML=cartDetailed().map((i,idx)=>`<div class="cart-item"><img src="${typeof SEC!=='undefined'?SEC.safeImg(i.p.img):esc(i.p.img)}" alt="" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'"><div class="ci-in"><strong>${esc(i.p.nome)} × ${i.qty}</strong><small>${i.ad.map(a=>esc(a.nome)).join(', ')||''} ${i.obs?'• '+esc(i.obs):''}</small><div class="qty"><button onclick="chQty(${idx},-1)">−</button><strong>${i.qty}</strong><button onclick="chQty(${idx},1)">+</button><span style="margin-left:auto;font-weight:800">${money(i.sub)}</span></div><button onclick="rmItem(${idx})" style="background:none;border:0;color:#C8102E;font-size:12px;font-weight:700;cursor:pointer;padding:4px 0">remover</button></div></div>`).join('');
  const fee=deliveryFee();
  $('#cartSub').textContent=money(cartSubtotal());
  $('#cartFee').textContent=checkout.tipo==='delivery'?(fee==null?'a configurar':money(fee)):money(0);
  $('#cartTotal').textContent=money(cartSubtotal()+(checkout.tipo==='delivery'?(fee||0):0));
}
function chQty(idx,d){cart[idx].qty+=d;if(cart[idx].qty<=0)cart.splice(idx,1);saveCart();}
function rmItem(idx){cart.splice(idx,1);saveCart();}
function openCart(){renderCart();$('#cartDrawer').classList.add('open');$('#overlay').classList.add('show');}
function openOverlay(id){$('#'+id).classList.add('open');$('#overlay').classList.add('show');}
function closeAll(){$('#cartDrawer').classList.remove('open');document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));$('#overlay').classList.remove('show');}
function closeModal(){document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));if(!$('#cartDrawer').classList.contains('open'))$('#overlay').classList.remove('show');}
/* checkout */
function deliveryFee(){const b=DB.bairros.find(x=>x.nome.toLowerCase()===String(checkout.bairro||'').toLowerCase().trim());return b?b.taxa:null;}
function openCheckout(){
  if(!cart.length){alert('Adicione um pastel primeiro 🥟');return;}
  closeAll();syncCheckoutForm();openOverlay('checkoutModal');renderCart();
}
function syncCheckoutForm(){
  const s=DB.settings;
  $('#coName').value=checkout.nome||'';
  document.querySelectorAll('[data-tipo]').forEach(b=>b.classList.toggle('sel',b.dataset.tipo===checkout.tipo));
  $('#addrBox').style.display=checkout.tipo==='delivery'?'block':'none';
  $('#coRua').value=checkout.rua;$('#coNum').value=checkout.numero;$('#coBairro').value=checkout.bairro;$('#coCompl').value=checkout.compl;$('#coRef').value=checkout.ref;
  document.querySelectorAll('[data-pay]').forEach(b=>b.classList.toggle('sel',b.dataset.pay===checkout.pag));
  $('#trocoBox').style.display=checkout.pag==='Dinheiro'?'block':'none';
  document.querySelectorAll('[data-troco]').forEach(b=>b.classList.toggle('sel',b.dataset.troco===checkout.troco));
  $('#trocoParaBox').style.display=(checkout.pag==='Dinheiro'&&checkout.troco==='sim')?'block':'none';
  $('#coTrocoPara').value=checkout.trocoPara;
  const dl=$('#bairroList');if(dl)dl.innerHTML=DB.bairros.filter(b=>b.ativo).map(b=>`<option value="${esc(b.nome)}">`).join('');
  const feeBox=$('#feeHint');
  if(checkout.tipo==='delivery'){
    const fee=deliveryFee();
    feeBox.innerHTML=checkout.bairro?(fee==null?`Taxa para <b>${esc(checkout.bairro)}</b>: <b>a configurar</b> — confirme no WhatsApp.`:`Taxa para <b>${esc(checkout.bairro)}</b>: <b>${money(fee)}</b>`):`Bairros atendidos: ${DB.bairros.filter(b=>b.ativo).map(b=>esc(b.nome)).join(', ')}. Taxa a confirmar no WhatsApp quando “a configurar”.`;
  }else feeBox.innerHTML=`Retirada em: ${esc(s.enderecoCurto)}. Sem taxa.`;
}
function setTipo(t){checkout.tipo=t;syncCheckoutForm();}
function setPay(p){checkout.pag=p;syncCheckoutForm();}
function setTroco(t){checkout.troco=t;syncCheckoutForm();}
function buildMsg(){
  const lines=['Olá, Pastel da Cléo! Gostaria de fazer um pedido:',''];
  cartDetailed().forEach(i=>{const ad=i.ad.length?' (+'+i.ad.map(a=>a.nome).join(', ')+')':'';const ob=i.obs?` [${i.obs}]`:'';lines.push(`${i.qty}x ${i.p.nome}${ad}${ob} — ${money(i.sub)}`);});
  lines.push('',`Subtotal: ${money(cartSubtotal())}`);
  if(checkout.tipo==='delivery'){const f=deliveryFee();lines.push(`Taxa de entrega: ${f==null?'a combinar':money(f)}`);lines.push(`Total: ${money(cartSubtotal()+(f||0))}`);}else lines.push(`Total: ${money(cartSubtotal())}`);
  lines.push('',`Tipo: ${checkout.tipo==='delivery'?'Delivery':'Retirada no local'}`);
  if(checkout.tipo==='delivery'){lines.push('', 'Endereço:',`${checkout.rua||''}, ${checkout.numero||''}`,`${checkout.bairro||''}`,checkout.compl?`Compl: ${checkout.compl}`:null,checkout.ref?`Ref: ${checkout.ref}`:null);}
  lines.push('',`Nome: ${checkout.nome||'-'}`,`Pagamento: ${checkout.pag}`);
  if(checkout.pag==='Dinheiro')lines.push(checkout.troco==='sim'?`Troco para: R$ ${checkout.trocoPara||'-'}`:'Sem necessidade de troco');
  if(checkout.tipo==='retirada')lines.push('',`Retirar em: ${DB.settings.enderecoCurto}`);
  return lines.filter(x=>x!==null).join('\n');
}
function finishOrder(){
  const cap=(v,n)=>String(v==null?'':v).slice(0,n).trim();
  checkout.nome=cap($('#coName').value,80);
  checkout.rua=cap($('#coRua').value,120);checkout.numero=cap($('#coNum').value,20);checkout.bairro=cap($('#coBairro').value,80);checkout.compl=cap($('#coCompl').value,80);checkout.ref=cap($('#coRef').value,120);
  checkout.trocoPara=cap($('#coTrocoPara').value,20).replace(/[^0-9.,]/g,'');
  if(!checkout.nome){alert('Digite seu nome 🙂');return;}
  if(checkout.tipo!=='delivery'&&checkout.tipo!=='retirada')checkout.tipo='retirada';
  if(['Pix','Dinheiro','Cartão de crédito','Cartão de débito'].indexOf(checkout.pag)<0)checkout.pag='Pix';
  if(checkout.tipo==='delivery'&&(!checkout.rua||!checkout.numero||!checkout.bairro)){alert('Para delivery, preencha rua, número e bairro.');return;}
  if(DB.settings.pedidoMinimo&&cartSubtotal()<DB.settings.pedidoMinimo){alert(`Pedido mínimo: ${money(DB.settings.pedidoMinimo)}`);return;}
  DB.orders.push({id:'PED-'+Date.now().toString().slice(-6),itens:cartDetailed().map(i=>({nome:String(i.p.nome).slice(0,80),qty:Math.max(1,Math.min(99,i.qty|0)),sub:i.sub})),total:cartSubtotal()+(checkout.tipo==='delivery'?(deliveryFee()||0):0),fee:checkout.tipo==='delivery'?(deliveryFee()||0):0,tipo:checkout.tipo,nome:checkout.nome,pag:checkout.pag,status:'Novo',data:new Date().toISOString()});
  if(DB.orders.length>200)DB.orders=DB.orders.slice(-200); // evita estouro de quota
  saveDB(DB);
  serverSubmitOrder({id:DB.orders[DB.orders.length-1].id,itens:DB.orders[DB.orders.length-1].itens,total:DB.orders[DB.orders.length-1].total,fee:DB.orders[DB.orders.length-1].fee,tipo:checkout.tipo,nome:checkout.nome,pag:checkout.pag,rua:checkout.rua,numero:checkout.numero,bairro:checkout.bairro,compl:checkout.compl,ref:checkout.ref,trocoPara:checkout.trocoPara});
  const msg=encodeURIComponent(buildMsg());
  showSuccess();
  setTimeout(()=>{window.open(`https://wa.me/${DB.settings.whatsapp}?text=${msg}`,'_blank');},900);
  cart=[];saveCart();
}
function showSuccess(){
  $('#checkoutModal').classList.remove('open');
  $('#successModal').classList.add('open');
  const st=$('#orderSteps');if(st)st.innerHTML=['Pedido recebido','Preparando','Pronto',checkout.tipo==='delivery'?'Saiu para entrega':'Retirada','Entregue'].map((s,i)=>`<div class="step ${i===0?'on':''}"><i>${['🧾','🍳','🔔','🛵','✅'][i]}</i>${s}</div>`).join('');
}
/* Sincronização com o backend (quando servido por `npm start`).
   Sem servidor (arquivo aberto direto), segue 100% no modo local. */
async function syncWithServer(){
  try{
    if(!window.API)return;
    const h=await window.API.init();
    if(!h.api)return;
    const r=await fetch('/api/public',{cache:'no-store'});
    if(!r.ok)return;
    const pub=await r.json();
    if(!pub||!Array.isArray(pub.products)||!pub.products.length)return;
    if(pub.settings&&typeof pub.settings==='object')DB.settings=Object.assign({},DB.settings,pub.settings);
    if(Array.isArray(pub.hours)&&pub.hours.length===7)DB.hours=pub.hours;
    if(Array.isArray(pub.categories)&&pub.categories.length)DB.categories=pub.categories;
    DB.products=pub.products;
    if(Array.isArray(pub.addons))DB.addons=pub.addons;
    if(Array.isArray(pub.bairros))DB.bairros=pub.bairros;
    if(Array.isArray(pub.reviews))DB.reviews=pub.reviews;
    saveDB(DB);
    renderFavs();renderChips();renderMenu();renderHours();renderDelivery();renderReviews();renderSettings();renderCart();
  }catch(e){/* modo local */}
}
function serverSubmitOrder(order){
  try{
    if(!window.API||!window.API.isAvailable())return;
    fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)}).catch(()=>{});
  }catch(e){}
}
function renderHours(){
  const el=$('#hoursTable');if(!el)return;
  el.innerHTML=DB.hours.map(h=>`<div class="kv"><span>${h.dia}</span><strong>${h.fechado?'Fechado':h.open+' – '+h.close}</strong></div>`).join('');
  renderStatus();
}
function renderDelivery(){
  const el=$('#bairroTable');if(!el)return;
  el.innerHTML=DB.bairros.filter(b=>b.ativo).map(b=>`<div class="kv"><span>${esc(b.nome)}</span><strong>${b.taxa==null?'a configurar':money(b.taxa)}</strong></div>`).join('');
}
function renderReviews(){
  const el=$('#revGrid');if(!el)return;
  el.innerHTML=DB.reviews.length?DB.reviews.map(r=>`<div class="rev"><div class="stars">${'★'.repeat(r.estrelas||5)}</div><p>“${esc(r.texto)}”</p><strong>${esc(r.nome)}</strong></div>`).join(''):'<div class="empty">Ainda não há avaliações cadastradas.<br>Se você já provou, chame no WhatsApp e conte o que achou! 💛</div>';
}
function renderSettings(){
  const s=DB.settings;
  document.querySelectorAll('[data-set="telefone"]').forEach(e=>e.textContent=s.telefone);
  document.querySelectorAll('[data-set="endereco"]').forEach(e=>e.textContent=s.endereco);
  const wa=`https://wa.me/${s.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de fazer um pedido.')}`;
  document.querySelectorAll('[data-wa]').forEach(a=>a.href=wa);
  const ig=$('#igBtn');if(ig){const igUrl=(typeof SEC!=='undefined'?SEC.safeHttpUrl(s.instagram):/^https?:\/\//.test(String(s.instagram||''))?s.instagram:'');if(igUrl){ig.href=igUrl;ig.style.display='inline-flex';}else{ig.removeAttribute('href');ig.style.display='none';}$('#igEmpty').style.display=igUrl?'none':'block';}
  const about=$('#aboutText');if(about)about.textContent=s.descricao;
}
document.addEventListener('DOMContentLoaded',()=>{
  renderStatus();renderFavs();renderChips();renderMenu();renderCart();renderHours();renderDelivery();renderReviews();renderSettings();
  syncWithServer(); // backend (se houver): atualiza cardápio/preços sem travar a tela
  setInterval(renderStatus,60000);
  const si=$('#searchInput');if(si)si.addEventListener('input',e=>{searchTerm=e.target.value;renderMenu();});
  $('#overlay').addEventListener('click',closeAll);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll();});
});
function toggleMenu(){$('#mMenu').classList.toggle('open');}
