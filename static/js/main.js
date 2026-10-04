/* CyberVault — Main Site JS */
(function(){
'use strict';

/* ── Scroll reveals ── */
function initReveals(){
  var els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){
    els.forEach(function(e){e.classList.add('visible')});return;
  }
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add('visible');obs.unobserve(en.target);}
    });
  },{threshold:.12,rootMargin:'0px 0px -50px 0px'});
  els.forEach(function(e){obs.observe(e)});
}

/* ── Nav shrink ── */
function initNav(){
  var nav=document.getElementById('cv-nav');
  if(!nav)return;
  window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>40)},{passive:true});
  var burger=document.getElementById('cv-hamburger');
  var links=document.getElementById('cv-nav-links');
  if(burger&&links){
    burger.addEventListener('click',function(){
      burger.classList.toggle('open');links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){burger.classList.remove('open');links.classList.remove('open')});
    });
  }
}

/* ── Count-up ── */
function initCountUp(){
  var els=document.querySelectorAll('.count-up');
  if(!els.length)return;
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting)return;
      var el=en.target,target=parseInt(el.dataset.target||'0',10),dur=1600,start=performance.now();
      (function tick(now){
        var p=Math.min((now-start)/dur,1),ease=1-Math.pow(1-p,3);
        el.textContent=Math.floor(ease*target).toLocaleString();
        if(p<1)requestAnimationFrame(tick);else el.textContent=target.toLocaleString();
      })(start);
      obs.unobserve(el);
    });
  },{threshold:.5});
  els.forEach(function(e){obs.observe(e)});
}

/* ── Scroll top ── */
function initScrollTop(){
  var btn=document.getElementById('scroll-top');
  if(!btn)return;
  window.addEventListener('scroll',function(){btn.classList.toggle('visible',window.scrollY>500)},{passive:true});
  btn.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});
}

/* ── Inline AI chat preview ── */
function initChatPreview(){
  var input=document.getElementById('acp-input');
  var send=document.getElementById('acp-send');
  var msgs=document.getElementById('acp-msgs');
  if(!input||!send||!msgs)return;
  var KB=[
    {k:['dna'],r:'DNA analysis extracts STR profiles from biological material. Confidence depends on sample quality — even partial profiles can yield actionable leads.'},
    {k:['fingerprint','print'],r:'Latent fingerprints require powder, cyanoacrylate, or luminescent techniques. We compare ridge patterns and minutiae against AFIS databases.'},
    {k:['blood','spatter'],r:'Blood spatter analysis reconstructs the sequence of events from drop size, distribution, and directionality. Radial patterns indicate an origin point.'},
    {k:['suspect','thorne','guilty'],r:'Dr. Aris Thorne — neural implant specialist, dismissed for ethical violations. Last authenticated in the vault at 03:14. Handwriting matches UV cipher.'},
    {k:['uv','ultraviolet','blacklight'],r:'UV fluorescence exposes strontium aluminate compounds used for covert inscriptions. Toggle UV mode in-game with [F] to reveal hidden evidence.'},
    {k:['hi','hello','hey'],r:'Hello, Investigator. I\'m ForensicAI — trained on 18 forensic disciplines. Ask me about evidence, suspects, or case mechanics.'},
  ];
  function reply(q){
    var ql=q.toLowerCase();
    for(var i=0;i<KB.length;i++)if(KB[i].k.some(function(k){return ql.includes(k)}))return KB[i].r;
    return 'I can assist with DNA analysis, fingerprint matching, blood spatter, digital forensics, and suspect profiling. What would you like to investigate?';
  }
  function appendMsg(text,isUser){
    var d=document.createElement('div');d.className='acp-msg'+(isUser?' acp-msg-user':'');
    if(!isUser){var av=document.createElement('div');av.className='acp-msg-avatar ai';av.innerText='AI';d.appendChild(av);}
    var b=document.createElement('div');b.className='acp-msg-body';b.innerText=text;d.appendChild(b);
    msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;
  }
  function send_msg(){
    var t=input.value.trim();if(!t)return;
    input.value='';appendMsg(t,true);
    setTimeout(function(){appendMsg(reply(t),false)},380);
  }
  send.addEventListener('click',send_msg);
  input.addEventListener('keydown',function(e){if(e.key==='Enter')send_msg()});
}

/* ── Subscribe form ── */
function initSubForm(){
  var form=document.getElementById('sub-form');
  var msg=document.getElementById('sub-msg');
  if(!form)return;
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var email=form.querySelector('input[type="email"]').value.trim();
    if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      if(msg){msg.textContent='Please enter a valid email.';msg.style.color='#e74c3c';}return;
    }
    if(msg){msg.textContent='✓ Subscribed! New case updates incoming.';msg.style.color='#2ecc9b';}
    form.querySelector('input[type="email"]').value='';
  });
}

/* ── Game preview status ticker ── */
function initStatusTicker(){
  var el=document.getElementById('gpc-status-text');
  if(!el)return;
  var items=['SCENE READY — Click to investigate','● EVIDENCE LOADED — 3 active clues','● UV BLACKLIGHT AVAILABLE','● AI SUSPECT ONLINE'];
  var i=0;setInterval(function(){i=(i+1)%items.length;el.textContent=items[i]},2600);
}

document.addEventListener('DOMContentLoaded',function(){
  initNav();initReveals();initCountUp();initScrollTop();
  initChatPreview();initSubForm();initStatusTicker();
});

})();
