import"./modulepreload-polyfill-B5Qt9EMX.js";const l=document.getElementById("flo-eye"),u=document.querySelector("[data-host-status]"),f=[...document.querySelectorAll(".ems-mod")];function y(e){document.querySelectorAll("[data-panel]").forEach(t=>{t.getAttribute("data-panel")===e?t.removeAttribute("hidden"):t.setAttribute("hidden","")})}function m(e){f.forEach(r=>r.classList.toggle("is-active",r===e));const t=e.getAttribute("data-host-view");if(t==="eye"){y("eye");const r=e.getAttribute("data-division"),s=e.getAttribute("data-screen"),i=l.contentWindow;i?(i.postMessage({type:"flo-eye/set-division",divisionId:r},"*"),setTimeout(()=>{i.postMessage({type:"flo-eye/set-screen",screenId:s},"*")},50)):l.src=`/?division=${encodeURIComponent(r)}&screen=${encodeURIComponent(s)}`,u.textContent=`${r} · ${s}`}else y(t),u.textContent=t==="brief"?"Incident Brief":"Response Roster",t==="brief"&&b(),t==="roster"&&$()}f.forEach(e=>{e.addEventListener("click",()=>m(e))});window.addEventListener("message",e=>{const t=e.data;!t||t.type!=="flo-eye/state"||(u.textContent=`${t.divisionId} · ${t.screenId}${t.stormCount?` · ${t.stormCount} storm(s)`:""}`)});l.addEventListener("load",()=>{u.textContent="Mission Control linked"});var g;(g=document.querySelector("[data-refresh-brief]"))==null||g.addEventListener("click",()=>b());var v;(v=document.querySelector("[data-refresh-roster]"))==null||v.addEventListener("click",()=>$());async function b(){var i;const e=document.querySelector("[data-brief-lede]"),t=document.querySelector("[data-brief-kpis]"),r=document.querySelector("[data-brief-storms]"),s=document.querySelector("[data-brief-objectives]");try{const c=await fetch("/api/brief");if(!c.ok)throw new Error(`brief ${c.status}`);const a=await c.json();e.textContent=`Florida theater · generated ${new Date(a.generatedAt).toLocaleString()}`,t.innerHTML=`
      <div class="kpi"><span>Storms</span><strong>${((i=a.storms)==null?void 0:i.length)??0}</strong></div>
      <div class="kpi"><span>Fire perimeters</span><strong>${a.firePerimeterCount??"—"}</strong></div>
      <div class="kpi"><span>MARC hubs</span><strong>${a.marcReady??"—"}</strong></div>
      <div class="kpi"><span>Staging</span><strong>${a.marcStaging??"—"}</strong></div>
    `,r.innerHTML=(a.storms||[]).length?a.storms.map(o=>`
        <article class="brief-storm">
          <div><strong>${n(o.name)}</strong> · ${n(o.classification||"")} ${n(String(o.intensity||""))}kt</div>
          <div class="muted">${n(o.binNumber||"")} · ${n(o.lastUpdate||"")}</div>
          <div class="brief-actions">
            <button type="button" data-brief-fly="${n(o.id)}">Open Storm Ops / fly</button>
            ${o.advisoryUrl?`<a href="${n(o.advisoryUrl)}" target="_blank" rel="noopener">Advisory</a>`:""}
          </div>
        </article>`).join(""):'<p class="muted">No active NHC systems.</p>',s.innerHTML=(a.objectives||[]).map(o=>`<li>${n(o)}</li>`).join(""),r.querySelectorAll("[data-brief-fly]").forEach(o=>{o.onclick=()=>{const h=o.getAttribute("data-brief-fly"),p=f.find(d=>d.getAttribute("data-screen")==="storm-ops");p&&m(p),setTimeout(()=>{var d;(d=l.contentWindow)==null||d.postMessage({type:"flo-eye/fly-storm",stormId:h},"*")},400)}})}catch(c){e.textContent=`Brief unavailable: ${c.message}`}}async function $(){const e=document.querySelector("[data-roster-body]");try{const t=await fetch("/api/roster");if(!t.ok)throw new Error(`roster ${t.status}`);const r=await t.json();e.innerHTML=(r.units||[]).map(s=>`
      <tr>
        <td>${n(s.unit)}</td>
        <td>${n(s.role)}</td>
        <td>${n(s.status)}</td>
        <td><button type="button" class="linkish" data-roster-open="${n(s.id)}">Map</button></td>
      </tr>`).join(""),e.querySelectorAll("[data-roster-open]").forEach(s=>{s.onclick=()=>{const i=f.find(c=>c.getAttribute("data-screen")==="deployment-map");i&&m(i)}})}catch(t){e.innerHTML=`<tr><td colspan="4">Roster unavailable: ${n(t.message)}</td></tr>`}}function n(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
//# sourceMappingURL=host-D7svJSZg.js.map
