/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const M=globalThis,F=M.ShadowRoot&&(M.ShadyCSS===void 0||M.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,O=Symbol(),G=new WeakMap;let J=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==O)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(F&&t===void 0){const s=e!==void 0&&e.length===1;s&&(t=G.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&G.set(e,t))}return t}toString(){return this.cssText}};const pt=n=>new J(typeof n=="string"?n:n+"",void 0,O),_t=(n,...t)=>{const e=n.length===1?n[0]:t.reduce((s,i,r)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+n[r+1],n[0]);return new J(e,n,O)},gt=(n,t)=>{if(F)n.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const e of t){const s=document.createElement("style"),i=M.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,n.appendChild(s)}},X=F?n=>n:n=>n instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return pt(e)})(n):n;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:mt,defineProperty:bt,getOwnPropertyDescriptor:ft,getOwnPropertyNames:yt,getOwnPropertySymbols:vt,getPrototypeOf:$t}=Object,L=globalThis,Z=L.trustedTypes,wt=Z?Z.emptyScript:"",xt=L.reactiveElementPolyfillSupport,A=(n,t)=>n,R={toAttribute(n,t){switch(t){case Boolean:n=n?wt:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,t){let e=n;switch(t){case Boolean:e=n!==null;break;case Number:e=n===null?null:Number(n);break;case Object:case Array:try{e=JSON.parse(n)}catch{e=null}}return e}},Y=(n,t)=>!mt(n,t),tt={attribute:!0,type:String,converter:R,reflect:!1,useDefault:!1,hasChanged:Y};Symbol.metadata??=Symbol("metadata"),L.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=tt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&bt(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:r}=ft(this.prototype,t)??{get(){return this[e]},set(a){this[e]=a}};return{get:i,set(a){const o=i?.call(this);r?.call(this,a),this.requestUpdate(t,o,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??tt}static _$Ei(){if(this.hasOwnProperty(A("elementProperties")))return;const t=$t(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(A("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(A("properties"))){const e=this.properties,s=[...yt(e),...vt(e)];for(const i of s)this.createProperty(i,e[i])}const t=this[Symbol.metadata];if(t!==null){const e=litPropertyMetadata.get(t);if(e!==void 0)for(const[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(const[e,s]of this.elementProperties){const i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const i of s)e.unshift(X(i))}else t!==void 0&&e.push(X(t));return e}static _$Eu(t,e){const s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return gt(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){const r=(s.converter?.toAttribute!==void 0?s.converter:R).toAttribute(e,s.type);this._$Em=t,r==null?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){const r=s.getPropertyOptions(i),a=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:R;this._$Em=i;const o=a.fromAttribute(e,r.type);this[i]=o??this._$Ej?.get(i)??o,this._$Em=null}}requestUpdate(t,e,s,i=!1,r){if(t!==void 0){const a=this.constructor;if(i===!1&&(r=this[t]),s??=a.getPropertyOptions(t),!((s.hasChanged??Y)(r,e)||s.useDefault&&s.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:r},a){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),r!==!0||a!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[i,r]of this._$Ep)this[i]=r;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[i,r]of s){const{wrapped:a}=r,o=this[i];a!==!0||this._$AL.has(i)||o===void 0||this.C(i,void 0,r,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[A("elementProperties")]=new Map,x[A("finalized")]=new Map,xt?.({ReactiveElement:x}),(L.reactiveElementVersions??=[]).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const z=globalThis,et=n=>n,B=z.trustedTypes,st=B?B.createPolicy("lit-html",{createHTML:n=>n}):void 0,it="$lit$",b=`lit$${Math.random().toFixed(9).slice(2)}$`,rt="?"+b,kt=`<${rt}>`,f=document,P=()=>f.createComment(""),S=n=>n===null||typeof n!="object"&&typeof n!="function",N=Array.isArray,At=n=>N(n)||typeof n?.[Symbol.iterator]=="function",H=`[ 	
\f\r]`,E=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,nt=/-->/g,at=/>/g,y=RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ot=/'/g,lt=/"/g,ct=/^(?:script|style|textarea|title)$/i,Pt=n=>(t,...e)=>({_$litType$:n,strings:t,values:e}),c=Pt(1),v=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),ut=new WeakMap,$=f.createTreeWalker(f,129);function ht(n,t){if(!N(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return st!==void 0?st.createHTML(t):t}const St=(n,t)=>{const e=n.length-1,s=[];let i,r=t===2?"<svg>":t===3?"<math>":"",a=E;for(let o=0;o<e;o++){const l=n[o];let p,_,h=-1,g=0;for(;g<l.length&&(a.lastIndex=g,_=a.exec(l),_!==null);)g=a.lastIndex,a===E?_[1]==="!--"?a=nt:_[1]!==void 0?a=at:_[2]!==void 0?(ct.test(_[2])&&(i=RegExp("</"+_[2],"g")),a=y):_[3]!==void 0&&(a=y):a===y?_[0]===">"?(a=i??E,h=-1):_[1]===void 0?h=-2:(h=a.lastIndex-_[2].length,p=_[1],a=_[3]===void 0?y:_[3]==='"'?lt:ot):a===lt||a===ot?a=y:a===nt||a===at?a=E:(a=y,i=void 0);const m=a===y&&n[o+1].startsWith("/>")?" ":"";r+=a===E?l+kt:h>=0?(s.push(p),l.slice(0,h)+it+l.slice(h)+b+m):l+b+(h===-2?o:m)}return[ht(n,r+(n[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]};class q{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let r=0,a=0;const o=t.length-1,l=this.parts,[p,_]=St(t,e);if(this.el=q.createElement(p,s),$.currentNode=this.el.content,e===2||e===3){const h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(i=$.nextNode())!==null&&l.length<o;){if(i.nodeType===1){if(i.hasAttributes())for(const h of i.getAttributeNames())if(h.endsWith(it)){const g=_[a++],m=i.getAttribute(h).split(b),U=/([.?@])?(.*)/.exec(g);l.push({type:1,index:r,name:U[2],strings:m,ctor:U[1]==="."?It:U[1]==="?"?Ct:U[1]==="@"?Tt:D}),i.removeAttribute(h)}else h.startsWith(b)&&(l.push({type:6,index:r}),i.removeAttribute(h));if(ct.test(i.tagName)){const h=i.textContent.split(b),g=h.length-1;if(g>0){i.textContent=B?B.emptyScript:"";for(let m=0;m<g;m++)i.append(h[m],P()),$.nextNode(),l.push({type:2,index:++r});i.append(h[g],P())}}}else if(i.nodeType===8)if(i.data===rt)l.push({type:2,index:r});else{let h=-1;for(;(h=i.data.indexOf(b,h+1))!==-1;)l.push({type:7,index:r}),h+=b.length-1}r++}}static createElement(t,e){const s=f.createElement("template");return s.innerHTML=t,s}}function k(n,t,e=n,s){if(t===v)return t;let i=s!==void 0?e._$Co?.[s]:e._$Cl;const r=S(t)?void 0:t._$litDirective$;return i?.constructor!==r&&(i?._$AO?.(!1),r===void 0?i=void 0:(i=new r(n),i._$AT(n,e,s)),s!==void 0?(e._$Co??=[])[s]=i:e._$Cl=i),i!==void 0&&(t=k(n,i._$AS(n,t.values),i,s)),t}class Et{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??f).importNode(e,!0);$.currentNode=i;let r=$.nextNode(),a=0,o=0,l=s[0];for(;l!==void 0;){if(a===l.index){let p;l.type===2?p=new Q(r,r.nextSibling,this,t):l.type===1?p=new l.ctor(r,l.name,l.strings,this,t):l.type===6&&(p=new qt(r,this,t)),this._$AV.push(p),l=s[++o]}a!==l?.index&&(r=$.nextNode(),a++)}return $.currentNode=f,i}p(t){let e=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}let Q=class dt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=k(this,t,e),S(t)?t===d||t==null||t===""?(this._$AH!==d&&this._$AR(),this._$AH=d):t!==this._$AH&&t!==v&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):At(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==d&&S(this._$AH)?this._$AA.nextSibling.data=t:this.T(f.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=q.createElement(ht(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const r=new Et(i,this),a=r.u(this.options);r.p(e),this.T(a),this._$AH=r}}_$AC(t){let e=ut.get(t.strings);return e===void 0&&ut.set(t.strings,e=new q(t)),e}k(t){N(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const r of t)i===e.length?e.push(s=new dt(this.O(P()),this.O(P()),this,this.options)):s=e[i],s._$AI(r),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const s=et(t).nextSibling;et(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}};class D{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,r){this.type=1,this._$AH=d,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=d}_$AI(t,e=this,s,i){const r=this.strings;let a=!1;if(r===void 0)t=k(this,t,e,0),a=!S(t)||t!==this._$AH&&t!==v,a&&(this._$AH=t);else{const o=t;let l,p;for(t=r[0],l=0;l<r.length-1;l++)p=k(this,o[s+l],e,l),p===v&&(p=this._$AH[l]),a||=!S(p)||p!==this._$AH[l],p===d?t=d:t!==d&&(t+=(p??"")+r[l+1]),this._$AH[l]=p}a&&!i&&this.j(t)}j(t){t===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class It extends D{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===d?void 0:t}}class Ct extends D{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==d)}}class Tt extends D{constructor(t,e,s,i,r){super(t,e,s,i,r),this.type=5}_$AI(t,e=this){if((t=k(this,t,e,0)??d)===v)return;const s=this._$AH,i=t===d&&s!==d||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==d&&(s===d||i);i&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class qt{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){k(this,t)}}const Ut=z.litHtmlPolyfillSupport;Ut?.(q,Q),(z.litHtmlVersions??=[]).push("3.3.3");const Mt=(n,t,e)=>{const s=e?.renderBefore??t;let i=s._$litPart$;if(i===void 0){const r=e?.renderBefore??null;s._$litPart$=i=new Q(t.insertBefore(P(),r),r,void 0,e??{})}return i._$AI(n),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const j=globalThis;let I=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Mt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return v}};I._$litElement$=!0,I.finalized=!0,j.litElementHydrateSupport?.({LitElement:I});const Lt=j.litElementPolyfillSupport;Lt?.({LitElement:I}),(j.litElementVersions??=[]).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Bt={CHILD:2},Dt=n=>(...t)=>({_$litDirective$:n,values:t});class Ft{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,s){this._$Ct=t,this._$AM=e,this._$Ci=s}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class W extends Ft{constructor(t){if(super(t),this.it=d,t.type!==Bt.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===d||t==null)return this._t=void 0,this.it=t;if(t===v)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const e=[t];return e.raw=e,this._t={_$litType$:this.constructor.resultType,strings:e,values:[]}}}W.directiveName="unsafeHTML",W.resultType=1;const Ot=Dt(W);function C(...n){console.log("[MusicFlow card]",...n)}function Rt(...n){console.warn("[MusicFlow card]",...n)}function T(...n){console.error("[MusicFlow card]",...n)}class zt{constructor(t={}){this.hass=t.hass||null,this.url=t.url||null,this.apiKey=t.apiKey||null,this.ws=null,this._listeners=new Map,this._connected=!1,this._pendingInit=null,this._reconnectTimer=null}on(t,e){return this._listeners.has(t)||this._listeners.set(t,new Set),this._listeners.get(t).add(e),()=>this._listeners.get(t)?.delete(e)}_emit(t,e){this._listeners.get(t)?.forEach(s=>{try{s(e)}catch(i){T("listener error",i)}})}get connected(){return this._connected}async init(){if(!(this.url&&this.apiKey)){if(!this.hass)throw new Error("MusicFlow \u5361\u7247: \u7F3A\u5C11\u540E\u7AEF\u5730\u5740,\u4E14\u672A\u63D0\u4F9B hass \u4EE5\u81EA\u52A8\u83B7\u53D6");if(this._pendingInit)return this._pendingInit;this._pendingInit=(async()=>{C("fetching backend_config from HA integration");const t=await this.hass.callWS({type:"musicflow/backend_config"}),e=t&&t.backends||[];if(!e.length)throw new Error("MusicFlow \u96C6\u6210\u672A\u914D\u7F6E\u540E\u7AEF\u8FDE\u63A5");const s=e[0];this.url=s.url,this.apiKey=s.api_key,C("backend_config ok",this.url)})(),await this._pendingInit}}_restBase(){return(this.url||"").replace(/\/+$/,"")+"/rest"}_wsUrl(){const t=new URL(this.url);return`${t.protocol==="https:"?"wss:":"ws:"}//${t.host}/ws?token=${encodeURIComponent(this.apiKey)}`}_withToken(t,e){const s=this._restBase(),i=t.includes("?")?"&":"?",r=`token=${encodeURIComponent(this.apiKey)}`,a=e?`${i}${r}&${e}`:`${i}${r}`;return`${s}${t}${a}`}async rest(t,{method:e="GET",body:s}={}){const i=this._withToken(t),r={method:e,headers:{}};s!==void 0&&(r.headers["Content-Type"]="application/json",r.body=JSON.stringify(s)),C("REST",e,i.replace(/token=[^&]+/,"token=***"));let a;try{a=await fetch(i,r)}catch(o){const l=o instanceof TypeError?"\u7F51\u7EDC\u5C42\u5931\u8D25: \u901A\u5E38\u662F (1)CORS \u672A\u653E\u884C (2)\u6DF7\u5408\u5185\u5BB9 HTTPS\u9875\u8BBF\u95EEHTTP\u540E\u7AEF (3)\u540E\u7AEF\u5730\u5740\u6D4F\u89C8\u5668\u4E0D\u53EF\u8FBE\u3002\u8BF7\u786E\u8BA4\u540E\u7AEF\u5DF2\u653E\u884C\u8BE5\u6765\u6E90,\u4E14\u5361\u7247\u6240\u7528\u7684 url \u6D4F\u89C8\u5668\u80FD\u76F4\u63A5\u8BBF\u95EE":String(o);throw T("REST network error",e,i.replace(/token=[^&]+/,"token=***"),l),o}if(!a.ok){const o=await a.text().catch(()=>"");throw T("REST failed",e,t,a.status,o.slice(0,200)),new Error(`MusicFlow REST ${e} ${t} -> ${a.status}`)}if(this._emit("rest_ok"),(a.headers.get("content-type")||"").includes("application/json")){const o=await a.json();return o&&o["subsonic-response"]?o["subsonic-response"]:o}return a}connect(){if(this.ws&&(this.ws.readyState===WebSocket.OPEN||this.ws.readyState===WebSocket.CONNECTING))return;let t;try{t=new WebSocket(this._wsUrl())}catch(e){T("WS open failed",e),this._scheduleReconnect();return}this.ws=t,t.onmessage=e=>{let s;try{s=JSON.parse(e.data)}catch{return}this._handle(s)},t.onopen=()=>{this._connected=!0,C("WS open"),this._emit("open"),this._startWsKeepalive()},t.onclose=()=>{this._connected=!1,this._stopWsKeepalive(),Rt("WS close"),this._emit("close"),this._scheduleReconnect()},t.onerror=e=>{T("WS error",e);try{t.close()}catch{}}}_startWsKeepalive(){this._stopWsKeepalive(),this._wsPingTimer=setInterval(()=>{if(this.ws&&this.ws.readyState===WebSocket.OPEN)try{this.ws.send(JSON.stringify({type:"ping"}))}catch{}},25e3)}_stopWsKeepalive(){this._wsPingTimer&&(clearInterval(this._wsPingTimer),this._wsPingTimer=null)}_scheduleReconnect(){this._reconnectTimer||(this._reconnectTimer=setTimeout(()=>{this._reconnectTimer=null,this.connect()},3e3))}disconnect(){if(this._reconnectTimer&&(clearTimeout(this._reconnectTimer),this._reconnectTimer=null),this._stopWsKeepalive(),this.ws){this.ws.onclose=null;try{this.ws.close()}catch{}this.ws=null}}_handle(t){switch(C("WS",t.type,t),t.type){case"snapshot":this._emit("snapshot",t.devices||{});break;case"peer_snapshot":this._emit("peer_snapshot",t.peers||[]);break;case"peer_registered":case"peer_available":case"peer_unavailable":t.peer&&this._emit("peer_update",t.peer);break;case"peer_queue_changed":this._emit("peer_queue",{peerId:t.peer_id,queue:t.queue});break;case"peer_queue_cleared":this._emit("peer_queue",{peerId:t.peer_id,queue:{items:[],currentIndex:-1,playMode:"order",isActive:!1}});break;case"queue_changed":this._emit("queue_changed",{deviceId:t.device_id,queue:t.queue});break;case"player_state_changed":this._emit("state",{deviceId:t.device_id,state:t.state});break;case"media_changed":this._emit("media",{deviceId:t.device_id,media:t.media});break;case"group_changed":this._emit("group",t.group);break;case"group_deleted":this._emit("group_deleted",t.id);break;case"device_list_changed":this._emit("device_list_changed",{deviceCount:t.deviceCount});break}}peerPath(t,e){return`/api/v1/peers/${encodeURIComponent(t)}${e}`}play(t){return this.rest(this.peerPath(t,"/play"),{method:"POST"})}pause(t){return this.rest(this.peerPath(t,"/pause"),{method:"POST"})}stop(t){return this.rest(this.peerPath(t,"/stop"),{method:"POST"})}next(t){return this.rest(this.peerPath(t,"/next"),{method:"POST"})}prev(t){return this.rest(this.peerPath(t,"/prev"),{method:"POST"})}seek(t,e){return this.rest(this.peerPath(t,"/seek"),{method:"POST",body:{seconds:e}})}setVolume(t,e){return this.rest(this.peerPath(t,"/volume"),{method:"POST",body:{volume:Math.round(e*100)}})}setMute(t,e){return this.rest(this.peerPath(t,"/mute"),{method:"POST",body:{muted:e}})}setPlayMode(t,e){return this.rest(this.peerPath(t,"/play-mode"),{method:"POST",body:{mode:e}})}playQueue(t,e,s=0){return this.rest(this.peerPath(t,"/queue/play"),{method:"POST",body:{items:e,startIndex:s}})}enqueue(t,e){return this.rest(this.peerPath(t,"/queue/enqueue"),{method:"POST",body:{items:e}})}removeAt(t,e){return this.rest(this.peerPath(t,`/queue/${e}`),{method:"DELETE"})}clearQueue(t){return this.rest(this.peerPath(t,"/queue"),{method:"DELETE"})}getQueue(t){return this.rest(this.peerPath(t,"/queue"))}getStatus(t){return this.rest(this.peerPath(t,"/status"))}getPeers(){return this.rest("/api/v1/peers")}async search(t,{count:e=20,offset:s=0}={}){return this.rest(`/search3?query=${encodeURIComponent(t)}&count=${e}&offset=${s}`)}async getLyrics(t){return this.rest(`/getLyricsBySongId?id=${encodeURIComponent(t)}&f=json`)}async star(t){return this.rest(`/star?id=${encodeURIComponent(t)}`)}async unstar(t){return this.rest(`/unstar?id=${encodeURIComponent(t)}`)}async getPlaylists(){return this.rest("/getPlaylists")}async updatePlaylist(t,{songIdsToAdd:e=[]}={}){const s=e.map(i=>`songIdToAdd=${encodeURIComponent(i)}`).join("&");return this.rest(`/updatePlaylist?playlistId=${encodeURIComponent(t)}${s?"&"+s:""}`)}async getStarred(){return this.rest("/getStarred2")}async getAlbumList2({type:t="alphabeticalByName",genre:e="",size:s=300,offset:i=0}={}){const r=`type=${encodeURIComponent(t)}&size=${s}&offset=${i}`+(e?`&genre=${encodeURIComponent(e)}`:"");return this.rest(`/getAlbumList2?${r}`)}async getArtists(){return this.rest("/getArtists")}async getArtist(t){return this.rest(`/getArtist?id=${encodeURIComponent(t)}`)}async getAlbum(t){return this.rest(`/getAlbum?id=${encodeURIComponent(t)}`)}async getGenres(){return this.rest("/getGenres")}async getPlaylistSongs(t){return this.rest(`/getPlaylist?id=${encodeURIComponent(t)}`)}coverUrl(t){return t?this._withToken(`/getCoverArt?id=${encodeURIComponent(t)}&size=300`):null}}function w(n){const t={mp3:"audio/mpeg",flac:"audio/flac",wav:"audio/wav",aac:"audio/aac",ogg:"audio/ogg",m4a:"audio/mp4",opus:"audio/opus",wma:"audio/x-ms-wma",ape:"audio/ape"},e=(n.suffix||"").toLowerCase();return{songId:n.id||n.songId,title:n.title||"\u672A\u77E5",artist:n.artist||void 0,album:n.album||void 0,albumId:n.albumId||void 0,mime:t[e]||"audio/mpeg",coverArt:n.coverArt||(n.albumId?`al-${n.albumId}`:void 0),duration:n.duration||void 0}}function Nt(n){const t=n?.lyricsList?.structuredLyrics||[],e=t.find(s=>s.synced)||t[0];return!e||!e.line?[]:e.line.filter(s=>s.start!==void 0&&s.start!==null).map(s=>({time:Number(s.start)/1e3,text:s.value})).sort((s,i)=>s.time-i.time)}const V=["order","one","all","shuffle"],Ht={order:"\u987A\u5E8F\u64AD\u653E",one:"\u5355\u66F2\u5FAA\u73AF",all:"\u5217\u8868\u5FAA\u73AF",shuffle:"\u968F\u673A\u64AD\u653E"},Qt={order:"listOrdered",one:"repeat1",all:"repeat",shuffle:"shuffle"},jt={play:'<polygon points="6 3 20 12 6 21 6 3"/>',pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',prev:'<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',next:'<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',shuffle:'<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',repeat:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',repeat1:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/>',listOrdered:'<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',volume2:'<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',volumeX:'<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>'};function K(...n){console.log("[MF card]",...n)}function u(...n){console.error("[MF card]",...n)}class Wt extends I{static get properties(){return{hass:{attribute:!1},_config:{state:!0}}}setConfig(t){this._config=t||{}}constructor(){super(),this._client=null,this._ready=!1,this._ui={error:"",connected:!1,serverOk:!1,peers:[],currentPeerId:"",queue:[],currentIndex:-1,isPlaying:!1,currentTime:0,duration:0,playMode:"shuffle",volume:.8,muted:!1,song:null,lyrics:[],currentLyric:"",liked:!1,showLyrics:!1,showQueue:!1,showSearch:!1,showPlaylistPicker:!1,searchQuery:"",searchResults:[],playlists:[],pickerSongId:null,showBrowser:!1,browserStack:[],showVolume:!1,volAnchor:null},this._tickTimer=null,this._pollTimer=null,this._heartbeatTimer=null,this._volumeDebounce=null}disconnectedCallback(){super.disconnectedCallback(),this._teardown()}_teardown(){this._tickTimer&&(clearInterval(this._tickTimer),this._tickTimer=null),this._pollTimer&&(clearInterval(this._pollTimer),this._pollTimer=null),this._heartbeatTimer&&(clearInterval(this._heartbeatTimer),this._heartbeatTimer=null),this._probeTimer&&(clearInterval(this._probeTimer),this._probeTimer=null),this._client&&this._client.disconnect()}set hass(t){const e=this._hass;this._hass=t,!e&&t&&!this._ready&&this._bootstrap(t)}get hass(){return this._hass}async _bootstrap(t){this._ready=!0;const e=this._config||{};this._client=new zt({hass:t,url:e.url||null,apiKey:e.api_key||null});try{await this._client.init()}catch(s){const i=s.message||String(s);u("init failed",i),this._ui.error=i,this.requestUpdate();return}this._bindClient(),this._client.connect(),this._probeTimer=setInterval(()=>{this._ui.connected||this._probeServer()},15e3)}_probeServer(){this._ui.connected||!this._client||this._client.getPeers().then(()=>{this._ui.serverOk=!0}).catch(()=>{this._ui.serverOk=!1}).finally(()=>this.requestUpdate())}_bindClient(){const t=this._client;t.on("open",()=>{this._ui.connected=!0,this._ui.serverOk=!0,this._startHeartbeat(),this.requestUpdate()}),t.on("close",()=>{this._ui.connected=!1,this._probeServer(),this.requestUpdate()}),t.on("rest_ok",()=>{this._ui.serverOk||(this._ui.serverOk=!0,this.requestUpdate())}),t.on("snapshot",e=>this._applySnapshot(e)),t.on("peer_snapshot",e=>this._applyPeerSnapshot(e)),t.on("peer_update",e=>this._upsertPeer(e)),t.on("peer_queue",({peerId:e,queue:s})=>this._applyPeerQueue(e,s)),t.on("queue_changed",({deviceId:e,queue:s})=>this._applyDeviceQueue(e,s)),t.on("state",({deviceId:e,state:s})=>this._applyDeviceState(e,s)),t.on("media",({deviceId:e,media:s})=>this._applyDeviceMedia(e,s)),t.on("group",()=>this._refreshPeers()),t.on("group_deleted",()=>this._refreshPeers()),t.on("device_list_changed",()=>this._refreshPeers())}_resolveDefaultPeerId(t){const e=this._config||{};if(e.entity&&this._hass?.states?.[e.entity]){const s=this._hass.states[e.entity].attributes?.peer_id;if(s&&t.some(i=>i.peerId===s))return s}return null}_isDlnaPeer(t){return t?typeof t.peerId=="string"?t.peerId.startsWith("dlna:"):(t.kind||"")==="dlna":!1}_filterDlna(t){return(t||[]).filter(e=>this._isDlnaPeer(e))}_applyPeerSnapshot(t){const e=this._filterDlna(t);this._ui.peers=e;const s=this._resolveDefaultPeerId(e);if(!this._ui.currentPeerId||s){const i=s&&e.find(r=>r.peerId===s)||e.find(r=>r.available)||e[0];i&&this._selectPeer(i.peerId,!0)}else this._refreshCurrentPeerView();this.requestUpdate()}_applySnapshot(t){const e=this._ui.currentPeerId;if(!e||!e.startsWith("dlna:"))return;const s=e.slice(5),i=t[s];i&&this._applyStatus(i)}_upsertPeer(t){if(!t||!this._isDlnaPeer(t))return;const e=this._ui.peers.findIndex(s=>s.peerId===t.peerId);e>=0?this._ui.peers[e]={...this._ui.peers[e],...t}:this._ui.peers.push(t),this.requestUpdate()}_applyPeerQueue(t,e){t===this._ui.currentPeerId&&this._applyQueue(e);const s=this._ui.peers.findIndex(i=>i.peerId===t);s>=0&&(this._ui.peers[s]={...this._ui.peers[s],queue:e}),this.requestUpdate()}_applyDeviceQueue(t,e){const s=this._ui.currentPeerId;(s===`dlna:${t}`||s===`group:${t}`)&&this._applyQueue(e);const i=this._ui.peers.findIndex(r=>r.peerId===`dlna:${t}`||r.peerId===`group:${t}`);i>=0&&(this._ui.peers[i]={...this._ui.peers[i],queue:e}),this.requestUpdate()}_applyQueue(t){t&&(Array.isArray(t.items)&&(this._ui.queue=t.items.map(e=>({songId:e.songId,title:e.title||"\u672A\u77E5",artist:e.artist||"",album:e.album||"",coverArt:e.coverArt,duration:e.duration||0}))),typeof t.currentIndex=="number"&&(this._ui.currentIndex=t.currentIndex),typeof t.playMode=="string"&&(this._ui.playMode=t.playMode),this._syncCurrentSong())}_applyDeviceState(t,e){const s=this._ui.currentPeerId;s&&(s===`dlna:${t}`||s===`group:${t}`)&&this._applyStatus(e)}_applyDeviceMedia(t,e){const s=this._ui.currentPeerId;s&&(s===`dlna:${t}`||s===`group:${t}`)&&this._setMedia(e)}_applyStatus(t){t&&(this._ui.isPlaying=t.state==="PLAYING",typeof t.position=="number"&&(this._ui.currentTime=t.position),typeof t.duration=="number"&&t.duration>0&&(this._ui.duration=t.duration),typeof t.volume=="number"&&(this._ui.volume=Math.max(0,Math.min(100,t.volume))/100),typeof t.muted=="boolean"&&(this._ui.muted=t.muted),t.media&&this._setMedia(t.media),this._updateLyric(),this.requestUpdate())}_setMedia(t){if(!t)return;const e={songId:t.songId,title:t.title||"\u672A\u77E5",artist:t.artist||"",album:t.album||"",coverArt:t.coverArt,duration:t.duration||this._ui.duration||0},s=e.songId!==this._ui.song?.songId;this._ui.song=e,s&&e.songId&&(this._ui.lyrics=[],this._ui.currentLyric="",this._client.scrobble?.(e.songId).catch(i=>u("scrobble failed",i)),this._loadLyrics(e.songId),this._loadLiked(e.songId)),this.requestUpdate()}_syncCurrentSong(){const t=this._ui.currentIndex,e=this._ui.queue;if(t>=0&&t<e.length){const s=e[t];(!this._ui.song||this._ui.song.songId!==s.songId)&&(this._ui.song={songId:s.songId,title:s.title,artist:s.artist,album:s.album,coverArt:s.coverArt,duration:s.duration},s.songId&&(this._client.scrobble?.(s.songId).catch(i=>u("scrobble failed",i)),this._loadLyrics(s.songId),this._loadLiked(s.songId)))}}_refreshPeers(){this._client.getPeers().then(t=>{const e=this._filterDlna(t?.peers||[]);e.length&&(this._ui.peers=e,this.requestUpdate())}).catch(t=>u("getPeers failed",t))}async _refreshCurrentPeerView(){const t=this._ui.currentPeerId;if(t)try{const[e,s]=await Promise.all([this._client.getStatus(t),this._client.getQueue(t)]);this._applyStatus(e),this._applyQueue(s)}catch(e){u("refreshCurrentPeerView failed",e)}}_selectPeer(t,e){t!==this._ui.currentPeerId&&(this._ui.currentPeerId=t,this._stopTracking(),this._ui.queue=[],this._ui.currentIndex=-1,this._ui.song=null,this._ui.lyrics=[],this._ui.currentLyric="",this._ui.currentTime=0,this._ui.duration=0,this._refreshCurrentPeerView(),this._startTracking(),this.requestUpdate())}_startTracking(){this._stopTracking();const t=this._ui.currentPeerId;t&&(this._pollTimer=setInterval(async()=>{try{const[e,s]=await Promise.all([this._client.getStatus(t),this._client.getQueue(t)]);this._applyStatus(e),this._applyQueue(s)}catch(e){u("poll failed",e)}},2e3),this._tickTimer=setInterval(()=>{this._ui.isPlaying&&this._ui.duration>0&&this._ui.currentTime<this._ui.duration&&(this._ui.currentTime=Math.min(this._ui.duration,this._ui.currentTime+.25),this._updateLyric(),this.requestUpdate())},250))}_stopTracking(){this._tickTimer&&(clearInterval(this._tickTimer),this._tickTimer=null),this._pollTimer&&(clearInterval(this._pollTimer),this._pollTimer=null)}_startHeartbeat(){this._heartbeatTimer||(this._heartbeatTimer=setInterval(()=>{const t=this._ui.currentPeerId;t&&t.startsWith("local:")&&this._client.heartbeat(t).catch(e=>u("heartbeat failed",e))},3e4))}_togglePlay(){const t=this._ui.currentPeerId;t&&(this._ui.isPlaying?this._client.pause(t).catch(e=>u("pause failed",e)):this._client.play(t).catch(e=>u("play failed",e)),this._ui.isPlaying=!this._ui.isPlaying,this.requestUpdate())}_next(){const t=this._ui.currentPeerId;t&&this._client.next(t).catch(e=>u("next failed",e))}_prev(){const t=this._ui.currentPeerId;t&&(this._ui.currentTime>3?this._client.seek(t,0).then(()=>{this._ui.currentTime=0,this.requestUpdate()}).catch(e=>u("seek failed",e)):this._client.prev(t).catch(e=>u("prev failed",e)))}_cyclePlayMode(){const t=this._ui.currentPeerId;if(!t)return;const e=V[(V.indexOf(this._ui.playMode)+1)%V.length];this._ui.playMode=e,this._client.setPlayMode(t,e).catch(s=>u("setPlayMode failed",s)),this.requestUpdate()}_setVolume(t){const e=Number(t.target.value)/100;this._ui.volume=e;const s=this._ui.currentPeerId;s&&(this._volumeDebounce&&clearTimeout(this._volumeDebounce),this._volumeDebounce=setTimeout(()=>{this._client.setVolume(s,e).catch(i=>u("setVolume failed",i))},150)),this.requestUpdate()}_toggleMute(){const t=this._ui.currentPeerId;if(!t)return;const e=!this._ui.muted;this._ui.muted=e,this._client.setMute(t,e).catch(s=>u("setMute failed",s)),this.requestUpdate()}_toggleVolumePop(t){const e=this._ui;if(!e.showVolume&&t?.currentTarget?.getBoundingClientRect){const s=t.currentTarget.getBoundingClientRect();e.volAnchor={x:s.left+s.width/2,top:s.top}}e.showVolume=!e.showVolume,this.requestUpdate()}_seek(t){const e=this._ui.currentPeerId;if(!e)return;const s=Number(t.target.value)/100*(this._ui.duration||0);this._ui.currentTime=s,this._client.seek(e,s).catch(i=>u("seek failed",i)),this._updateLyric(),this.requestUpdate()}async _loadLyrics(t){try{const e=await this._client.getLyrics(t);this._ui.lyrics=Nt(e),this._updateLyric()}catch(e){u("loadLyrics failed",e),this._ui.lyrics=[]}this.requestUpdate()}_updateLyric(){const t=this._ui.lyrics;if(!t.length){this._ui.currentLyric="";return}const e=this._ui.currentTime;let s=-1;for(let i=0;i<t.length&&t[i].time<=e;i++)s=i;this._ui.currentLyric=s>=0?t[s].text:""}async _loadLiked(t){try{const e=await this._client.getStarred(),s=new Set((e?.starred2?.song||e?.starred?.song||[]).map(i=>i.id));this._ui.liked=s.has(t)}catch(e){u("loadLiked failed",e),this._ui.liked=!1}this.requestUpdate()}_toggleLike(){const t=this._ui.song;t?.songId&&(this._ui.liked?this._client.unstar(t.songId).catch(e=>u("unstar failed",e)):this._client.star(t.songId).catch(e=>u("star failed",e)),this._ui.liked=!this._ui.liked,this.requestUpdate())}_removeFromQueue(t){const e=this._ui.currentPeerId;e&&this._client.removeAt(e,t).catch(s=>u("removeAt failed",s))}_clearQueue(){const t=this._ui.currentPeerId;t&&this._client.clearQueue(t).catch(e=>u("clearQueue failed",e))}_jumpTo(t){const e=this._ui.currentPeerId;if(!e||!this._ui.queue[t])return;const s=this._ui.queue.map(i=>w(i));this._client.playQueue(e,s,t).catch(i=>u("jumpTo failed",i))}_appendAndPlay(t){const e=this._ui.currentPeerId;if(!e||!t)return;const s=[...this._ui.queue.map(i=>w(i)),w(t)];this._client.playQueue(e,s,this._ui.queue.length).catch(i=>u("appendAndPlay failed",i))}_enqueueOnly(t){const e=this._ui.currentPeerId;!e||!t||this._client.enqueue(e,[w(t)]).catch(s=>u("enqueue failed",s))}_reorder(t,e){const s=this._ui.currentPeerId;if(!s)return;const i=this._ui.queue.slice();if(t<0||t>=i.length||e<0||e>=i.length)return;const[r]=i.splice(t,1);i.splice(e,0,r);const a=this._ui.song?.songId;let o=i.findIndex(l=>l.songId===a);o<0&&(o=Math.max(0,Math.min(e,i.length-1))),this._ui.queue=i,this._ui.currentIndex=o,this._client.playQueue(s,i.map(w),o).catch(l=>u("reorder failed",l)),this.requestUpdate()}async _doSearch(){const t=(this._ui.searchQuery||"").trim();if(!t){this._ui.searchResults=[],this.requestUpdate();return}try{const e=await this._client.search(t,{count:30}),s=e?.searchResult3?.song||e?.searchResult2?.song||[];this._ui.searchResults=s.map(i=>({songId:i.id,title:i.title||"\u672A\u77E5",artist:i.artist||"",album:i.album||"",coverArt:i.coverArt,duration:i.duration||0,suffix:i.suffix}))}catch(e){u("search failed",e),this._ui.searchResults=[]}this.requestUpdate()}_searchPlay(t){this._appendAndPlay(t)}_searchEnqueue(t){const e=this._ui.currentPeerId;e&&this._client.enqueue(e,[w(t)]).catch(s=>u("searchEnqueue failed",s))}async _loadPlaylists(){try{const t=await this._client.getPlaylists(),e=t?.playlists?.playlist||t?.playlists||[];this._ui.playlists=e.filter(s=>s&&s.id!=null).map(s=>({id:String(s.id),name:s.name||"\u672A\u547D\u540D\u6B4C\u5355"}))}catch(t){u("loadPlaylists failed",t),this._ui.playlists=[]}this.requestUpdate()}_openPlaylistPicker(t){this._ui.pickerSongId=t,this._ui.showPlaylistPicker=!0,this._loadPlaylists()}_addToPlaylist(t){const e=this._ui.pickerSongId;e&&(this._client.updatePlaylist(t,{songIdsToAdd:[e]}).then(()=>K("added to playlist",t)).catch(s=>u("addToPlaylist failed",s)),this._ui.showPlaylistPicker=!1,this._ui.pickerSongId=null)}_icon(t,e=20,s=!1){const i=jt[t]||"",r=`<svg viewBox="0 0 24 24" width="${e}" height="${e}" fill="${s?"currentColor":"none"}" stroke="${s?"none":"currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${i}</svg>`;return c`<span class="ic">${Ot(r)}</span>`}_cover(t){return this._client?this._client.coverUrl(t):null}_fmtTime(t){if(!t||t<0)return"0:00";const e=Math.floor(t/60),s=Math.floor(t%60);return`${e}:${s<10?"0":""}${s}`}render(){if(this._ui.error)return c`<ha-card><div class="wrap"><div class="err">MusicFlow: ${this._ui.error}</div></div></ha-card>`;if(!this._client)return c`<ha-card><div class="wrap"><div class="err">MusicFlow 卡片初始化中…</div></div></ha-card>`;const t=this._ui,e=t.song,s=t.duration>0?t.currentTime/t.duration*100:0,i=Math.round(t.volume*100),r=t.volAnchor||{x:0,top:0},a=`left:${r.x}px; bottom:${window.innerHeight-r.top+10}px;`;return c`
      <ha-card>
        <div class="wrap ${t.connected||t.serverOk?"":"off"}">
          ${this._renderOutputs()}

          <div class="now">
            <div class="cover">${e?.coverArt?c`<img src="${this._cover(e.coverArt)}" alt="" />`:c`<div class="nocover">♪</div>`}</div>
            <div class="meta">
              <div class="track">${e?e.title:"\u672A\u5728\u64AD\u653E"}</div>
              <div class="artist">${e?e.artist:"\u2014"}</div>
              <div class="progress-row">
                <span class="t">${this._fmtTime(t.currentTime)}</span>
                <input class="seek" type="range" min="0" max="100" step="0.1" value="${s}"
                  style="background: linear-gradient(90deg, #f62c55 ${s}%, rgba(255,255,255,0.18) ${s}%)"
                  @input=${this._seek} />
                <span class="t">${this._fmtTime(t.duration)}</span>
              </div>
            </div>
          </div>

          <div class="controls">
            <button class="ctl" title="${Ht[t.playMode]}" @click=${this._cyclePlayMode}>${this._icon(Qt[t.playMode],20)}</button>
            <button class="ctl" title="上一首" @click=${this._prev}>${this._icon("prev",22)}</button>
            <button class="ctl play" title="播放/暂停" @click=${this._togglePlay}>${this._icon(t.isPlaying?"pause":"play",24,!0)}</button>
            <button class="ctl" title="下一首" @click=${this._next}>${this._icon("next",22)}</button>
            <button class="ctl like ${t.liked?"on":""}" title="喜欢" @click=${this._toggleLike}>${this._icon("heart",20,t.liked)}</button>
            <button class="ctl ${t.showVolume?"vol-open":""}" title="音量" @click=${this._toggleVolumePop}>${this._icon(t.muted||t.volume<=0?"volumeX":"volume2",20)}</button>

            ${t.showVolume?c`
              <div class="volpop" style="${a}" @click=${o=>o.stopPropagation()}>
                <span class="vpct">${i}%</span>
                <input class="vol-v" type="range" orient="vertical" min="0" max="100" value="${i}"
                  style="background: linear-gradient(to top, #f62c55 ${i}%, rgba(255,255,255,0.18) ${i}%) center / 6px 100% no-repeat"
                  @input=${this._setVolume} />
                <button class="vbtn ${t.muted?"muted":""}" title="${t.muted?"\u53D6\u6D88\u9759\u97F3":"\u9759\u97F3"}" @click=${this._toggleMute}>${this._icon(t.muted?"volumeX":"volume2",18)}</button>
              </div>
            `:""}
          </div>
          ${t.showVolume?c`<div class="volpop-backdrop" @click=${()=>{t.showVolume=!1,this.requestUpdate()}}></div>`:""}

          <div class="actions">
            <button class="act ${t.showLyrics?"active":""}" @click=${()=>{t.showLyrics=!t.showLyrics,t.showQueue=!1,t.showSearch=!1,t.showBrowser=!1,this.requestUpdate()}}>歌词</button>
            <button class="act ${t.showQueue?"active":""}" @click=${()=>{t.showQueue=!t.showQueue,t.showLyrics=!1,t.showSearch=!1,t.showBrowser=!1,this.requestUpdate()}}>队列</button>
            <button class="act ${t.showSearch?"active":""}" @click=${()=>{t.showSearch=!t.showSearch,t.showLyrics=!1,t.showQueue=!1,t.showBrowser=!1,this.requestUpdate()}}>搜索</button>
            <button class="act ${t.showBrowser?"active":""}" @click=${this._openBrowser}>媒体库</button>
          </div>

          ${t.showLyrics?this._renderLyrics():""}
          ${t.showQueue?this._renderQueue():""}
          ${t.showSearch?this._renderSearch():""}
          ${t.showBrowser?this._renderMediaBrowser():""}
        </div>

        ${t.showPlaylistPicker?this._renderPlaylistPicker():""}
      </ha-card>
    `}_renderOutputs(){const t=this._ui.peers||[];return t.length?c`
      <div class="outputs">
        ${t.map(e=>c`
          <button class="out ${e.peerId===this._ui.currentPeerId?"active":""} ${e.available?"":"off"}"
            title="${e.kind||""}"
            @click=${()=>this._selectPeer(e.peerId)}>
            ${e.kind==="group"?"\u{1F465}":e.kind==="dlna"?"\u{1F50A}":"\u{1F4BB}"} ${e.name||e.peerId}
          </button>
        `)}
      </div>
    `:c`<div class="outputs"><span class="hint">无可用播放器</span></div>`}_renderLyrics(){const t=this._ui.lyrics;if(!t.length)return c`<div class="panel"><div class="empty">无歌词</div></div>`;const e=this._ui.currentTime;let s=-1;for(let i=0;i<t.length&&t[i].time<=e;i++)s=i;return c`
      <div class="panel lyrics">
        ${t.map((i,r)=>c`<div class="lyr ${r===s?"active":""}">${i.text||"\u2026"}</div>`)}
      </div>
    `}_renderQueue(){const t=this._ui.queue||[];return c`
      <div class="panel queue">
        <div class="panel-head">
          <span>队列 (${t.length})</span>
          <button class="mini" @click=${this._clearQueue}>清空</button>
        </div>
        ${t.length===0?c`<div class="empty">队列为空</div>`:c`
          <div class="qlist">
            ${t.map((e,s)=>c`
              <div class="qitem ${s===this._ui.currentIndex?"cur":""}"
                draggable="true"
                @dragstart=${i=>{i.dataTransfer.setData("text/plain",String(s))}}
                @dragover=${i=>i.preventDefault()}
                @drop=${i=>{i.preventDefault();const r=Number(i.dataTransfer.getData("text/plain"));this._reorder(r,s)}}>
                <span class="idx">${s+1}</span>
                <span class="qt">${e.title}</span>
                <span class="qa">${e.artist||""}</span>
                <button class="mini" title="跳播" @click=${()=>this._jumpTo(s)}>▶</button>
                <button class="mini" title="移除" @click=${()=>this._removeFromQueue(s)}>✕</button>
              </div>
            `)}
          </div>
        `}
      </div>
    `}_renderSearch(){return c`
      <div class="panel search">
        <div class="panel-head">
          <input class="search-input" placeholder="搜索歌曲…"
            .value=${this._ui.searchQuery}
            @input=${t=>{this._ui.searchQuery=t.target.value}}
            @keydown=${t=>{t.key==="Enter"&&this._doSearch()}} />
          <button class="mini" @click=${this._doSearch}>搜索</button>
        </div>
        <div class="slist">
          ${this._ui.searchResults.map(t=>c`
            <div class="sitem">
              <span class="st">${t.title}</span>
              <span class="sa">${t.artist||""}</span>
              <button class="mini" title="播放" @click=${()=>this._searchPlay(t)}>▶</button>
              <button class="mini" title="加入队列" @click=${()=>this._searchEnqueue(t)}>＋</button>
              <button class="mini" title="加入歌单" @click=${()=>this._openPlaylistPicker(t.songId)}>♥+</button>
            </div>
          `)}
        </div>
      </div>
    `}_renderPlaylistPicker(){return c`
      <div class="overlay" @click=${()=>{this._ui.showPlaylistPicker=!1,this.requestUpdate()}}>
        <div class="picker" @click=${t=>t.stopPropagation()}>
          <div class="panel-head"><span>添加到歌单</span><button class="mini" @click=${()=>{this._ui.showPlaylistPicker=!1,this.requestUpdate()}}>关闭</button></div>
          <div class="plist">
            ${(this._ui.playlists||[]).map(t=>c`
              <div class="pitem" @click=${()=>this._addToPlaylist(t.id)}>${t.name}</div>
            `)}
            ${(this._ui.playlists||[]).length===0?c`<div class="empty">无歌单</div>`:""}
          </div>
        </div>
      </div>
    `}_openBrowser(){const t=this._ui;t.showBrowser=!0,t.showLyrics=t.showQueue=t.showSearch=!1,t.browserStack=[{type:"root",items:[{kind:"cat",cat:"playlists",name:"\u6B4C\u5355"},{kind:"cat",cat:"albums",name:"\u4E13\u8F91"},{kind:"cat",cat:"artists",name:"\u827A\u672F\u5BB6"},{kind:"cat",cat:"genres",name:"\u6D41\u6D3E"},{kind:"cat",cat:"starred",name:"\u6211\u559C\u6B22\u7684\u97F3\u4E50"}],query:"",loading:!1}],this.requestUpdate()}_crumbName(t){switch(t.type){case"root":return"\u5A92\u4F53\u5E93";case"playlists":return"\u6B4C\u5355";case"playlist":return t.name||"\u6B4C\u5355";case"albums":return"\u4E13\u8F91";case"album":return t.name||"\u4E13\u8F91";case"artists":return"\u827A\u672F\u5BB6";case"artist":return t.name||"\u827A\u672F\u5BB6";case"genres":return"\u6D41\u6D3E";case"genre":return t.name||"\u6D41\u6D3E";case"starred":return"\u6211\u559C\u6B22\u7684\u97F3\u4E50";default:return""}}_toSongItem(t){return{kind:"song",id:String(t.id),title:t.title||"\u672A\u77E5",artist:t.artist||"",album:t.album||"",coverArt:t.coverArt,duration:t.duration||0,suffix:t.suffix}}async _browserLoad(t){t.loading=!0,this.requestUpdate();try{if(t.type==="playlists"){const e=await this._client.getPlaylists();t.items=(e?.playlists?.playlist||e?.playlists||[]).map(s=>({kind:"playlist",id:String(s.id),name:s.name||"\u672A\u547D\u540D\u6B4C\u5355",coverArt:s.coverArt,songCount:s.songCount}))}else if(t.type==="playlist"){const e=await this._client.getPlaylistSongs(t.id);t.items=(e?.playlist?.entry||[]).map(s=>this._toSongItem(s))}else if(t.type==="albums"){const e=await this._client.getAlbumList2({type:"alphabeticalByName",size:300});t.items=(e?.albumList2?.album||[]).map(s=>({kind:"album",id:String(s.id),name:s.name||"\u672A\u77E5\u4E13\u8F91",artist:s.artist||"",coverArt:s.coverArt,songCount:s.songCount}))}else if(t.type==="album"){const e=await this._client.getAlbum(t.id);t.items=(e?.album?.song||[]).map(s=>this._toSongItem(s))}else if(t.type==="artists"){const e=(await this._client.getArtists())?.artists?.index||[],s=[];for(const i of e)for(const r of i.artist||[])s.push({kind:"artist",id:String(r.id),name:r.name||"\u672A\u77E5\u827A\u672F\u5BB6",coverArt:r.coverArt});t.items=s}else if(t.type==="artist"){const e=await this._client.getArtist(t.id);t.items=(e?.artist?.album||[]).map(s=>({kind:"album",id:String(s.id),name:s.name||"\u672A\u77E5\u4E13\u8F91",artist:s.artist||"",coverArt:s.coverArt}))}else if(t.type==="genres"){const e=await this._client.getGenres();t.items=(e?.genres?.genre||[]).map(s=>({kind:"genre",id:s.value,name:s.value,songCount:s.songCount,albumCount:s.albumCount}))}else if(t.type==="genre"){const e=await this._client.getAlbumList2({type:"byGenre",genre:t.id,size:300});t.items=(e?.albumList2?.album||[]).map(s=>({kind:"album",id:String(s.id),name:s.name||"\u672A\u77E5\u4E13\u8F91",artist:s.artist||"",coverArt:s.coverArt,songCount:s.songCount}))}else if(t.type==="starred"){const e=await this._client.getStarred();t.items=(e?.starred2?.song||[]).map(s=>this._toSongItem(s))}}catch(e){u("browser load failed",e),t.items=[]}t.loading=!1,this.requestUpdate()}_browserPush(t){this._ui.browserStack.push(t),this._browserLoad(t)}_browserPopTo(t){for(;this._ui.browserStack.length>t+1;)this._ui.browserStack.pop();this.requestUpdate()}_browserSearch(){const t=this._ui.browserStack[this._ui.browserStack.length-1];if(!t)return;const e=(t.query||"").trim();if(t.type==="albums"){if(!e){this._browserLoad(t);return}this._client.search(e,{count:100}).then(s=>{t.items=(s?.searchResult3?.album||[]).map(i=>({kind:"album",id:String(i.id),name:i.name||"\u672A\u77E5\u4E13\u8F91",artist:i.artist||"",coverArt:i.coverArt,songCount:i.songCount})),this.requestUpdate()}).catch(s=>u("browser album search failed",s))}else if(t.type==="artists"){if(!e){this._browserLoad(t);return}this._client.search(e,{count:100}).then(s=>{t.items=(s?.searchResult3?.artist||[]).map(i=>({kind:"artist",id:String(i.id),name:i.name||"\u672A\u77E5\u827A\u672F\u5BB6",coverArt:i.coverArt})),this.requestUpdate()}).catch(s=>u("browser artist search failed",s))}else this.requestUpdate()}_browserItemClick(t){if(t)if(t.kind==="cat"){const e={playlists:"playlists",albums:"albums",artists:"artists",genres:"genres",starred:"starred"};this._browserPush({type:e[t.cat],items:[],query:"",loading:!1})}else t.kind==="playlist"?this._browserPush({type:"playlist",id:t.id,name:t.name,items:[],query:"",loading:!1}):t.kind==="album"?this._browserPush({type:"album",id:t.id,name:t.name,items:[],query:"",loading:!1}):t.kind==="artist"?this._browserPush({type:"artist",id:t.id,name:t.name,items:[],query:"",loading:!1}):t.kind==="genre"?this._browserPush({type:"genre",id:t.id,name:t.name,items:[],query:"",loading:!1}):t.kind==="song"&&this._appendAndPlay(t)}_browserPlaySong(t){this._appendAndPlay(t)}_browserEnqueueSong(t){this._enqueueOnly(t)}_collLabel(t){switch(t.kind){case"playlist":return"\u6B4C\u5355";case"album":return"\u4E13\u8F91";case"artist":return"\u827A\u4EBA";case"genre":return"\u6D41\u6D3E";default:return"\u5217\u8868"}}async _browserPlayCollection(t){const e=this._ui.currentPeerId;if(!e||!t)return;let s=[];try{if(t.kind==="playlist")s=((await this._client.getPlaylistSongs(t.id))?.playlist?.entry||[]).map(r=>this._toSongItem(r));else if(t.kind==="album")s=((await this._client.getAlbum(t.id))?.album?.song||[]).map(r=>this._toSongItem(r));else if(t.kind==="artist"){const r=(await this._client.getArtist(t.id))?.artist?.album||[];for(const a of r){const o=await this._client.getAlbum(String(a.id));s.push(...(o?.album?.song||[]).map(l=>this._toSongItem(l)))}}else if(t.kind==="genre"){const r=(await this._client.getAlbumList2({type:"byGenre",genre:t.id,size:500}))?.albumList2?.album||[];for(const a of r){const o=await this._client.getAlbum(String(a.id));s.push(...(o?.album?.song||[]).map(l=>this._toSongItem(l)))}}}catch(r){u("browser play collection failed",r);return}if(!s.length){K("collection empty");return}const i=s.map(r=>w(r));this._client.playQueue(e,i,0).then(()=>K("playing",this._collLabel(t),t.name,s.length,"songs")).catch(r=>u("playCollection failed",r))}_renderBrowserItem(t){const e=t.coverArt?this._cover(t.coverArt):null;if(t.kind==="song")return c`
        <div class="bitem">
          <div class="bthumb">${e?c`<img src="${e}" alt="" />`:c`<span class="bnocover">♪</span>`}</div>
          <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" @click=${()=>this._browserItemClick(t)}>
            <div class="bt">${t.title}</div>
            <div class="ba">${t.artist||""}</div>
          </div>
          <button class="mini" title="播放(加入队列并播放)" @click=${()=>this._browserPlaySong(t)}>▶</button>
          <button class="mini" title="加入队列" @click=${()=>this._browserEnqueueSong(t)}>＋</button>
        </div>`;const s=t.kind==="album"?t.artist||"":t.kind==="genre"?`${t.albumCount||0} \u4E13\u8F91`:t.kind==="playlist"?`${t.songCount||0} \u9996`:"";return c`
      <div class="bitem">
        <div class="bthumb" style="cursor:pointer" title="播放整个${this._collLabel(t)}" @click=${()=>this._browserPlayCollection(t)}>
          ${e?c`<img src="${e}" alt="" />`:c`<span class="bnocover">♪</span>`}
        </div>
        <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" title="进入查看" @click=${()=>this._browserItemClick(t)}>
          <div class="bt">${t.name}</div>
          <div class="ba">${s}</div>
        </div>
        <button class="mini" title="进入查看" @click=${()=>this._browserItemClick(t)}>›</button>
      </div>`}_renderMediaBrowser(){const t=this._ui.browserStack,e=t[t.length-1];if(!e)return c``;const s=(e.query||"").trim().toLowerCase();let i=e.items||[];s&&(e.type==="playlists"||e.type==="genres"||e.type==="starred")&&(i=e.type==="starred"?i.filter(a=>(a.title||"").toLowerCase().includes(s)):i.filter(a=>(a.name||"").toLowerCase().includes(s)));const r=["playlists","albums","artists","genres","starred"].includes(e.type);return c`
      <div class="overlay" @click=${()=>{this._ui.showBrowser=!1,this.requestUpdate()}}>
        <div class="browser" @click=${a=>a.stopPropagation()}>
          <div class="br-head">
            <span class="br-title">媒体库</span>
            <button class="mini" @click=${()=>{this._ui.showBrowser=!1,this.requestUpdate()}}>关闭</button>
          </div>
          <div class="br-crumbs">
            ${t.map((a,o)=>c`
              <span class="crumb ${o===t.length-1?"cur":""}" @click=${()=>this._browserPopTo(o)}>${this._crumbName(a)}</span>
              ${o<t.length-1?c`<span class="crumb-sep">›</span>`:""}
            `)}
          </div>
          ${r?c`
            <div class="br-search">
              <input class="search-input" placeholder="搜索…" .value=${e.query}
                @input=${a=>{e.query=a.target.value}}
                @keydown=${a=>{a.key==="Enter"&&this._browserSearch()}} />
              <button class="mini" @click=${this._browserSearch}>搜索</button>
            </div>
          `:""}
          <div class="br-list">
            ${e.loading?c`<div class="empty">加载中…</div>`:""}
            ${!e.loading&&e.type==="root"?c`
              <div class="cat-grid">
                ${i.map(a=>c`<button class="cat" @click=${()=>this._browserItemClick(a)}>${a.name}</button>`)}
              </div>
            `:""}
            ${!e.loading&&e.type!=="root"?c`
              ${i.length===0?c`<div class="empty">无内容</div>`:""}
              ${i.map(a=>this._renderBrowserItem(a))}
            `:""}
          </div>
        </div>
      </div>
    `}static get styles(){return _t`
      :host { display: block; }
      ha-card {
        /* MusicFlow FnOS 暗色玻璃拟态:深紫灰渐变底 + 细微极光 */
        background: linear-gradient(180deg, #2d293a 0%, #1a1728 52%, #15121f 100%);
        color: #ffffff;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        overflow: hidden;
        position: relative;
        font-family: 'Montserrat', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif;
      }
      ha-card::before {
        content: '';
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background:
          radial-gradient(ellipse 62% 44% at 16% 0%, rgba(126, 110, 178, 0.16), transparent 62%),
          radial-gradient(ellipse 54% 42% at 88% 100%, rgba(246, 44, 85, 0.10), transparent 62%);
      }
      .wrap { position: relative; z-index: 1; padding: 14px; display: flex; flex-direction: column; gap: 12px;
        transition: opacity 0.3s ease, filter 0.3s ease; }
      /* 未连接:整卡调暗降饱和做区分(不再显示"已连接/未连接"文字) */
      .wrap.off { opacity: 0.45; filter: saturate(0.5) brightness(0.75); }
      .ic { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
      .ic svg { display: block; }
      .err { color: #f05672; padding: 12px; }
      .outputs { display: flex; flex-wrap: wrap; gap: 6px; }
      .out { border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.85);
        border-radius: 14px; padding: 4px 12px; font-size: 12px; cursor: pointer;
        transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.12s; }
      .out:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .out:active { transform: scale(0.96); }
      .out.active { background: #f62c55; border-color: #f62c55; color: #fff; box-shadow: 0 4px 14px rgba(246, 44, 85, 0.35); }
      .out.off { opacity: 0.45; }
      .hint { color: rgba(255, 255, 255, 0.5); font-size: 12px; }
      .now { display: flex; gap: 12px; align-items: center; justify-content: space-between; }
      .cover { width: 84px; height: 84px; border-radius: 12px; overflow: hidden; flex: 0 0 auto;
        background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35); }
      .cover img { width: 100%; height: 100%; object-fit: cover; }
      .nocover { font-size: 30px; color: rgba(255, 255, 255, 0.3); }
      .meta { flex: 1; min-width: 0; }
      .track { font-weight: 600; font-size: 16px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .artist { font-size: 13px; color: rgba(255, 255, 255, 0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
      .progress-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
      .progress-row .t { font-size: 11px; color: rgba(255, 255, 255, 0.5); width: 34px; text-align: center; font-variant-numeric: tabular-nums; }
      .seek { flex: 1; height: 6px; border-radius: 3px; }
      .vol-v { writing-mode: vertical-lr; direction: rtl; width: 18px; height: 110px; border-radius: 3px;
        background: transparent; }
      .seek, .vol-v { -webkit-appearance: none; appearance: none; outline: none; cursor: pointer; }
      .seek { background: rgba(255, 255, 255, 0.18); }
      .seek::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
        width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid #f62c55;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); cursor: pointer; transition: transform 0.15s ease; }
      .seek:hover::-webkit-slider-thumb { transform: scale(1.2); }
      .seek::-moz-range-track { height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.18); }
      .seek::-moz-range-progress { height: 6px; border-radius: 3px; background: #f62c55; }
      .vol-v::-moz-range-track { width: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.18); }
      .vol-v::-moz-range-progress { width: 6px; border-radius: 3px; background: #f62c55; }
      .seek::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%;
        background: #fff; border: 2px solid #f62c55; }
      /* 音量滑块:主项目 Windows10 风格 —— 一道横线被轨道正中穿过。
         输入框 18px 宽、轨道居中画 6px(内联背景),thumb 16px 宽即被轨道穿中;
         thumb 做成 16x14 大抓取热区(可按住拖动),视觉横线 14x4 居中绘制。 */
      .vol-v::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
        width: 16px; height: 14px; border: none; border-radius: 2px; box-shadow: none; cursor: pointer;
        background: rgba(255, 255, 255, 0.85) center / 14px 4px no-repeat; }
      .vol-v:hover::-webkit-slider-thumb, .vol-v:active::-webkit-slider-thumb {
        background: #fff center / 14px 4px no-repeat; transform: none;
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)); }
      .vol-v::-moz-range-thumb { width: 16px; height: 14px; border: none; border-radius: 2px;
        background: rgba(255, 255, 255, 0.85) center / 14px 4px no-repeat; }
      .vol-v:hover::-moz-range-thumb { background: #fff center / 14px 4px no-repeat; }
      .controls { display: flex; justify-content: center; align-items: center; gap: 10px; position: relative; }
      .ctl { border: none; background: transparent; color: rgba(255, 255, 255, 0.85); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        width: 42px; height: 42px; padding: 0; border-radius: 50%;
        transition: background 0.2s, box-shadow 0.2s, transform 0.12s, color 0.2s; }
      .ctl svg { display: block; }
      .ctl:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .ctl:active { transform: scale(0.92); }
      .ctl.play { width: 54px; height: 54px; background: #f62c55; color: #fff;
        box-shadow: 0 0 14px rgba(246, 44, 85, 0.32); }
      .ctl.play:hover { background: #e63954; box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); transform: scale(1.06); }
      .ctl.play:active { transform: scale(0.94); }
      .ctl.like.on { color: #f62c55; }
      .ctl.vol-open { background: rgba(246, 44, 85, 0.16); color: #f62c55; }
      .volpop-backdrop { position: fixed; inset: 0; z-index: 999; background: transparent; }
      .volpop { position: fixed; z-index: 1000; transform: translateX(-50%);
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        background: #1f1c2a; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px;
        padding: 10px 8px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); }
      .vbtn { border: none; background: transparent; color: rgba(255, 255, 255, 0.75); cursor: pointer;
        width: 34px; height: 34px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, box-shadow 0.2s, transform 0.12s, color 0.2s; }
      .vbtn:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .vbtn:active { transform: scale(0.92); }
      .vbtn.muted { color: #f62c55; }
      .vbtn svg { display: block; }
      .vpct { font-size: 11px; color: rgba(255, 255, 255, 0.5); font-variant-numeric: tabular-nums; }
      .actions { display: flex; gap: 8px; }
      .act { flex: 1; border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.85);
        border-radius: 10px; padding: 8px 4px; font-size: 12px; cursor: pointer;
        transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.12s; }
      .act:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .act:active { transform: scale(0.96); }
      .act.active { background: #f62c55; border-color: #f62c55; color: #fff; box-shadow: 0 4px 14px rgba(246, 44, 85, 0.35); }
      .panel { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 10px; }
      .panel-head { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
      .empty { color: rgba(255, 255, 255, 0.45); font-size: 13px; padding: 10px 0; text-align: center; }
      .lyrics { max-height: 220px; overflow-y: auto; text-align: center; }
      .lyr { padding: 4px 0; color: rgba(255, 255, 255, 0.5); font-size: 13px; transition: color 0.2s; }
      .lyr.active { color: #f62c55; font-weight: 600; }
      .qlist, .slist, .plist { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
      .qlist::-webkit-scrollbar, .slist::-webkit-scrollbar, .plist::-webkit-scrollbar,
      .br-list::-webkit-scrollbar, .lyrics::-webkit-scrollbar { width: 6px; }
      .qlist::-webkit-scrollbar-thumb, .slist::-webkit-scrollbar-thumb, .plist::-webkit-scrollbar-thumb,
      .br-list::-webkit-scrollbar-thumb, .lyrics::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }
      .qlist::-webkit-scrollbar-thumb:hover, .slist::-webkit-scrollbar-thumb:hover, .plist::-webkit-scrollbar-thumb:hover,
      .br-list::-webkit-scrollbar-thumb:hover, .lyrics::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.28); }
      .qitem, .sitem { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 8px; transition: background 0.15s; }
      .qitem:hover, .sitem:hover { background: rgba(255, 255, 255, 0.06); }
      .qitem.cur { background: rgba(246, 44, 85, 0.16); }
      .qitem .idx { width: 18px; color: rgba(255, 255, 255, 0.4); font-size: 12px; }
      .qitem .qt, .sitem .st { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; color: rgba(255, 255, 255, 0.9); }
      .qitem .qa, .sitem .sa { width: 90px; color: rgba(255, 255, 255, 0.45); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mini { border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.85);
        border-radius: 8px; padding: 3px 8px; font-size: 12px; cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s, transform 0.12s; }
      .mini:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .mini:active { transform: scale(0.94); }
      .search-input { flex: 1; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px;
        padding: 7px 10px; background: rgba(0, 0, 0, 0.3); color: #fff; outline: none;
        transition: border-color 0.2s, box-shadow 0.2s; }
      .search-input::placeholder { color: rgba(255, 255, 255, 0.35); }
      .search-input:focus { border-color: #f62c55; box-shadow: 0 0 0 1px #f62c55; }
      .pitem { padding: 9px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; transition: background 0.15s; }
      .pitem:hover { background: rgba(255, 255, 255, 0.08); }
      .overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 999; }
      .picker { background: #1f1c2a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); border-radius: 16px; padding: 14px; width: 300px; max-height: 70vh; overflow-y: auto; }
      .browser { background: #1f1c2a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); border-radius: 16px; padding: 14px;
        width: 400px; max-width: 92vw; max-height: 82vh; display: flex; flex-direction: column; }
      .br-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .br-title { font-weight: 600; font-size: 15px; }
      .br-crumbs { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: 12px;
        color: rgba(255, 255, 255, 0.5); margin-bottom: 8px; }
      .crumb { cursor: pointer; transition: color 0.15s; }
      .crumb:hover { color: rgba(255, 255, 255, 0.85); }
      .crumb.cur { color: #f62c55; font-weight: 600; }
      .crumb-sep { color: rgba(255, 255, 255, 0.3); }
      .br-search { display: flex; gap: 6px; margin-bottom: 8px; }
      .br-list { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 2px; min-height: 140px; }
      .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px 0; }
      .cat { border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.9);
        border-radius: 12px; padding: 20px 8px; font-size: 14px; cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s, transform 0.12s; }
      .cat:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .cat:active { transform: scale(0.97); }
      .bitem { display: flex; align-items: center; gap: 8px; padding: 5px 6px; border-radius: 8px; transition: background 0.15s; }
      .bitem:hover { background: rgba(255, 255, 255, 0.06); }
      .bthumb { width: 38px; height: 38px; border-radius: 8px; overflow: hidden; flex: 0 0 auto;
        background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center;
        transition: box-shadow 0.2s, transform 0.12s; }
      .bthumb:hover { box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); transform: scale(1.05); }
      .bthumb img { width: 100%; height: 100%; object-fit: cover; }
      .bnocover { font-size: 18px; color: rgba(255, 255, 255, 0.3); }
      .bmeta { min-width: 0; }
      .bt { font-size: 13px; color: rgba(255, 255, 255, 0.92); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ba { font-size: 11px; color: rgba(255, 255, 255, 0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    `}}customElements.define("hass-musicflow-card",Wt),window.customCards=window.customCards||[],window.customCards.push({type:"hass-musicflow-card",name:"MusicFlow Remote Card",description:"MusicFlow \u670D\u52A1\u5668\u7684\u5916\u90E8\u63A7\u5236\u5668:\u5B9E\u65F6\u540C\u6B65\u64AD\u653E/\u961F\u5217/\u6B4C\u8BCD/\u6B4C\u5355/\u559C\u6B22\u3002"});
