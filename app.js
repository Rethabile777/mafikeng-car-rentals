const $=i=>document.getElementById(i),p2=n=>String(n).padStart(2,"0");
const R=n=>"R"+Math.round(n).toLocaleString("en-ZA");
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today=()=>{const d=new Date();return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate())}; // local date
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const catOf=id=>CATEGORIES.find(c=>c.id==id),vehOf=id=>VEHICLES.find(v=>v.id==id);
const srch=()=>get("mw_s",{start:"",end:"",mode:"Collection"});
const nights=s=>{const d=Math.round((new Date(s.end)-new Date(s.start))/864e5);return d>0?d:0};
const cart=()=>get("mw_cart",[]).filter(id=>vehOf(id));
// Data now comes from the database through the API. data.js is only a fallback for browsing if the API is down.
const API=(CONFIG.api||"").replace(/\/$/,"");
let ONLINE=false,BUSY=[];
const api=async(path,opt)=>{const r=await fetch(API+path,opt);let j={};try{j=await r.json()}catch(e){}if(!r.ok)throw new Error(j.error||"Request failed");return j};
async function load(){try{const d=await api("/api/fleet");CATEGORIES=d.categories;VEHICLES=d.vehicles;Object.assign(CONFIG,d.config);ONLINE=true}catch(e){ONLINE=false}}
async function loadBusy(s){BUSY=[];if(!ONLINE||!nights(s))return;try{BUSY=(await api("/api/availability?start="+s.start+"&end="+s.end)).booked}catch(e){}}
const free=(v,s)=>v.status=="Available"&&!BUSY.includes(v.id);
const wa=t=>"https://wa.me/"+CONFIG.whatsapp+"?text="+encodeURIComponent(t||"Hi, I would like to book a car.");
const pic=(n,e,a)=>`<div class="pic">${e}<img src="${n}.jpg" alt="${esc(a)}" onerror="this.remove()"></div>`;
function quote(){const s=srch(),n=nights(s),c=cart(),sub=c.reduce((t,id)=>t+catOf(vehOf(id).cat).rate*n,0);
 const disc=n>=CONFIG.longTermDays?sub*CONFIG.longTermDiscount:0,fee=s.mode=="Delivery"&&c.length?CONFIG.deliveryFee:0,total=sub-disc+fee;
 return{s,n,sub,disc,fee,total,deposit:Math.round(total*CONFIG.depositPct)}}
const summary=q=>`<div class="card sum"><p>Dates: ${q.s.start} to ${q.s.end} (${q.n} days) &middot; ${q.s.mode}</p><p>Subtotal: ${R(q.sub)}</p>${q.disc?`<p>Long-term discount: -${R(q.disc)}</p>`:""}${q.fee?`<p>Delivery fee: ${R(q.fee)}</p>`:""}<p><b>Total: ${R(q.total)}</b></p><p>Deposit due now: <b>${R(q.deposit)}</b></p></div>`;

function chrome(){
 $("hdr").innerHTML=`<header><div class="wrap nav"><a class="logo" href="index.html"><svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="#ff6b1a" stroke-width="4"/><circle cx="16" cy="16" r="4" fill="#fff"/></svg><span>Mafikeng <b>Wheels</b></span></a><nav><a href="index.html">Home</a><a href="fleet.html">Fleet</a><a href="cart.html">Booking (${cart().length})</a></nav></div></header>`;
 document.body.insertAdjacentHTML("beforeend",`<footer><div class="wrap"><b>${CONFIG.name}</b><br>Mafikeng, North West &middot; ${CONFIG.phone}<br>Collection from our office, or delivery in ${CONFIG.deliveryAreas}.</div></footer><a class="wa" href="${wa()}" target="_blank" rel="noopener">WhatsApp us</a>`)}

function searchBar(el){const s=srch(),t=today(),o=m=>`<option${s.mode==m?" selected":""}>${m}</option>`;
 el.innerHTML=`<form class="sb" id="sf"><div><label for="sd">Start date</label><input type="date" id="sd" min="${t}" value="${s.start}" required></div><div><label for="ed">End date</label><input type="date" id="ed" min="${t}" value="${s.end}" required></div><div><label for="sm">Collection or delivery</label><select id="sm">${o("Collection")}${o("Delivery")}</select></div><div><label>&nbsp;</label><button class="btn" style="width:100%" type="submit">Search cars</button></div><small>Delivery is only available in ${CONFIG.deliveryAreas}.${CONFIG.deliveryFee?" Delivery fee: "+R(CONFIG.deliveryFee)+".":""} ${CONFIG.longTermDays}+ days gets a long-term discount.</small></form>`;
 $("sf").onsubmit=e=>{e.preventDefault();const n={start:$("sd").value,end:$("ed").value,mode:$("sm").value};
  if(!nights(n)){alert("End date must be after the start date.");return}put("mw_s",n);location.href="fleet.html"}}

function home(){searchBar($("sb"));
 $("cats").innerHTML=CATEGORIES.map(c=>`<a class="card p0" style="text-decoration:none;color:inherit" href="fleet.html?cat=${c.id}">${pic("cat-"+c.id,c.icon,c.name)}<div class="in"><h3>${c.name}</h3><p>${c.desc}</p><span class="from">From ${R(c.rate)} per day</span></div></a>`).join("")}

function tog(id){let c=cart();c=c.includes(id)?c.filter(x=>x!=id):c.concat(id);put("mw_cart",c);chrome0();fleet()}
function chrome0(){document.querySelector("header").remove();document.querySelector("footer").remove();document.querySelector(".wa").remove();chrome()}
async function fleet(){const s=srch(),ok=nights(s)>0,q=new URLSearchParams(location.search).get("cat"),c=cart();
 $("app").innerHTML=`<h2>Our fleet</h2><div id="sb"></div><div class="chips"><a href="fleet.html">All</a>${CATEGORIES.map(k=>`<a href="fleet.html?cat=${k.id}">${k.name}</a>`).join("")}</div>${ONLINE?"":'<p class="note">Live availability is unavailable right now, so bookings are paused. Please WhatsApp us.</p>'}${ok?"":'<p class="note">Choose your dates above to see which cars are free.</p>'}<div class="grid" id="cars"></div>`;
 searchBar($("sb"));
 await loadBusy(s);
 $("cars").innerHTML=VEHICLES.filter(v=>!q||v.cat==q).map(v=>{const k=catOf(v.cat),f=ok&&free(v,s),inC=c.includes(v.id);
  const st=!ok?v.status:f?"Available for your dates":v.status=="Available"?"Booked for your dates":v.status;
  const btn=inC?`<button class="btn out" onclick="tog(${v.id})">Remove</button>`:f?`<button class="btn" onclick="tog(${v.id})">Add to booking</button>`:`<button class="btn" disabled>${ok?"Not available":"Choose dates first"}</button>`;
  return`<div class="card p0">${pic("car-"+v.id,k.icon,v.make+" "+v.model)}<div class="in"><h3>${v.make} ${v.model}</h3><p class="note">${v.year} &middot; ${v.seats} seats &middot; ${k.name}</p><p class="from">${R(k.rate)} <small>per day</small></p><span class="tag ${f?"ok":"bad"}">${st}</span><p>${btn}</p></div></div>`}).join("")}

function rm(id){put("mw_cart",cart().filter(x=>x!=id));chrome0();cartPage()}
function cartPage(){const q=quote(),c=cart(),el=$("app");
 if(!c.length){el.innerHTML='<h2>Your booking</h2><p>Your booking is empty.</p><a class="btn" href="fleet.html">Browse cars</a>';return}
 if(!q.n){el.innerHTML='<h2>Your booking</h2><p>Please choose your dates first.</p><a class="btn" href="fleet.html">Choose dates</a>';return}
 el.innerHTML='<h2>Your booking</h2>'+c.map(id=>{const v=vehOf(id),r=catOf(v.cat).rate;return`<div class="card row"><div><b>${v.make} ${v.model}</b><br><small>${catOf(v.cat).name} &middot; ${v.seats} seats &middot; ${R(r)}/day &times; ${q.n}</small></div><div style="text-align:right"><b>${R(r*q.n)}</b><br><button class="lnk" onclick="rm(${id})">Remove</button></div></div>`}).join("")+summary(q)+'<p><a class="btn out" href="fleet.html">Add another car</a> <a class="btn" href="checkout.html">Go to checkout</a></p>'}

function checkout(){const q=quote(),el=$("app");
 if(!cart().length||!q.n){el.innerHTML='<h2>Checkout</h2><p>Your booking is empty or has no dates.</p><a class="btn" href="fleet.html">Browse cars</a>';return}
 el.innerHTML=`<h2>Checkout</h2>${summary(q)}<form id="cf" class="form">
<div><label for="fn">First name</label><input id="fn" maxlength="20" required></div>
<div><label for="ln">Last name</label><input id="ln" maxlength="30" required></div>
<div><label for="ph">Phone</label><input id="ph" type="tel" maxlength="15" required></div>
<div><label for="em">Email (optional)</label><input id="em" type="email"></div>
${q.s.mode=="Delivery"?`<div class="full"><label for="ad">Delivery address (${CONFIG.deliveryAreas} only)</label><input id="ad" maxlength="100" required></div>`:""}
<div class="full"><label for="pm">Pay deposit by</label><select id="pm"><option>Card</option><option>EFT</option></select></div>
<div id="cb" class="full form" style="margin:0"><div class="full"><label for="cn">Card number</label><input id="cn" inputmode="numeric" maxlength="19" autocomplete="off"></div><div><label for="cx">Expiry (MM/YY)</label><input id="cx" maxlength="5"></div><div><label for="cv">CVV</label><input id="cv" inputmode="numeric" maxlength="4"></div></div>
<p id="eb" class="full note" hidden>EFT: use your booking reference as the payment reference. Our banking details will be sent on WhatsApp.</p>
<p class="full note">Demo checkout: no real payment is taken and card details are not saved. Connect a payment gateway before going live.</p>
<div class="full"><button class="btn" type="submit">Pay deposit ${R(q.deposit)}</button><p id="err"></p></div></form>`;
 $("pm").onchange=()=>{const c=$("pm").value=="Card";$("cb").hidden=!c;$("eb").hidden=c};
 $("cf").onsubmit=async e=>{e.preventDefault();const q=quote(),pm=$("pm").value,er=$("err"),bt=e.target.querySelector("button[type=submit]");
  if(pm=="Card"&&(!/^\d{13,19}$/.test($("cn").value.replace(/\s/g,""))||!/^\d{2}\/\d{2}$/.test($("cx").value)||!/^\d{3,4}$/.test($("cv").value))){er.textContent="Please check your card details.";return}
  if(!ONLINE){er.textContent="The booking service is unavailable right now. Please try again shortly or WhatsApp us.";return}
  bt.disabled=true;er.textContent="Saving your booking...";
  try{ // card details are checked above and are never sent or saved
   const r=await api("/api/book",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({start:q.s.start,end:q.s.end,mode:q.s.mode,address:($("ad")||{}).value||"",vehicleIds:cart(),paymentMethod:pm,
    customer:{fn:$("fn").value,ln:$("ln").value,ph:$("ph").value,em:$("em").value}})});
   put("mw_cart",[]);location.href="confirmation.html?ref="+encodeURIComponent(r.ref)}
  catch(x){er.textContent=x.message;bt.disabled=false}}}

async function conf(){const el=$("app");let b;
 try{b=await api("/api/booking?ref="+encodeURIComponent(new URLSearchParams(location.search).get("ref")||""))}
 catch(e){el.innerHTML='<h2>Booking not found</h2><p>'+esc(e.message)+'</p><a class="btn" href="index.html">Back to home</a>';return}
 const cars=b.cars.join(", ");
 el.innerHTML=`<h2>Booking confirmed</h2><div class="card sum"><p>Booking reference: <b class="ref">${esc(b.ref)}</b></p><p>Name: ${esc(b.name)}</p><p>Car(s): ${esc(cars)}</p><p>${esc(b.start)} to ${esc(b.end)} &middot; ${esc(b.mode)}${b.address?": "+esc(b.address):""}</p><p>Total: ${R(b.total)}</p><p>Deposit paid (${esc(b.method)}): ${R(b.deposit)}</p><p>Final Payment due on ${esc(b.mode.toLowerCase())}: <b>${R(b.total-b.deposit)}</b></p></div><p><a class="btn" target="_blank" rel="noopener" href="${wa("Booking "+b.ref+": "+cars+", "+b.start+" to "+b.end+" ("+b.mode+")")}">Message us on WhatsApp</a></p>`}

chrome();load().then(()=>{chrome0();({home,fleet,cart:cartPage,checkout,confirmation:conf})[document.body.dataset.page]()});
