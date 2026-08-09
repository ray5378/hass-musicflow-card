/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const M=globalThis,F=M.ShadowRoot&&(M.ShadyCSS===void 0||M.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,R=Symbol(),K=new WeakMap;let J=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==R)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(F&&e===void 0){const s=t!==void 0&&t.length===1;s&&(e=K.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&K.set(t,e))}return e}toString(){return this.cssText}};const pe=n=>new J(typeof n=="string"?n:n+"",void 0,R),_e=(n,...e)=>{const t=n.length===1?n[0]:e.reduce((s,i,r)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+n[r+1],n[0]);return new J(t,n,R)},ge=(n,e)=>{if(F)n.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const s=document.createElement("style"),i=M.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,n.appendChild(s)}},Z=F?n=>n:n=>n instanceof CSSStyleSheet?(e=>{let t="";for(const s of e.cssRules)t+=s.cssText;return pe(t)})(n):n;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:me,defineProperty:be,getOwnPropertyDescriptor:fe,getOwnPropertyNames:ye,getOwnPropertySymbols:ve,getPrototypeOf:$e}=Object,D=globalThis,X=D.trustedTypes,we=X?X.emptyScript:"",xe=D.reactiveElementPolyfillSupport,A=(n,e)=>n,O={toAttribute(n,e){switch(e){case Boolean:n=n?we:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,e){let t=n;switch(e){case Boolean:t=n!==null;break;case Number:t=n===null?null:Number(n);break;case Object:case Array:try{t=JSON.parse(n)}catch{t=null}}return t}},Y=(n,e)=>!me(n,e),ee={attribute:!0,type:String,converter:O,reflect:!1,useDefault:!1,hasChanged:Y};Symbol.metadata??=Symbol("metadata"),D.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ee){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&be(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){const{get:i,set:r}=fe(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get:i,set(a){const l=i?.call(this);r?.call(this,a),this.requestUpdate(e,l,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ee}static _$Ei(){if(this.hasOwnProperty(A("elementProperties")))return;const e=$e(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(A("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(A("properties"))){const t=this.properties,s=[...ye(t),...ve(t)];for(const i of s)this.createProperty(i,t[i])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const s=new Set(e.flat(1/0).reverse());for(const i of s)t.unshift(Z(i))}else e!==void 0&&t.push(Z(e));return t}static _$Eu(e,t){const s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ge(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){const s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){const r=(s.converter?.toAttribute!==void 0?s.converter:O).toAttribute(t,s.type);this._$Em=e,r==null?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(e,t){const s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const r=s.getPropertyOptions(i),a=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:O;this._$Em=i;const l=a.fromAttribute(t,r.type);this[i]=l??this._$Ej?.get(i)??l,this._$Em=null}}requestUpdate(e,t,s,i=!1,r){if(e!==void 0){const a=this.constructor;if(i===!1&&(r=this[e]),s??=a.getPropertyOptions(e),!((s.hasChanged??Y)(r,t)||s.useDefault&&s.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:r},a){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),r!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[i,r]of this._$Ep)this[i]=r;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[i,r]of s){const{wrapped:a}=r,l=this[i];a!==!0||this._$AL.has(i)||l===void 0||this.C(i,void 0,r,l)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(t)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[A("elementProperties")]=new Map,x[A("finalized")]=new Map,xe?.({ReactiveElement:x}),(D.reactiveElementVersions??=[]).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const z=globalThis,te=n=>n,L=z.trustedTypes,se=L?L.createPolicy("lit-html",{createHTML:n=>n}):void 0,ie="$lit$",b=`lit$${Math.random().toFixed(9).slice(2)}$`,re="?"+b,ke=`<${re}>`,f=document,P=()=>f.createComment(""),S=n=>n===null||typeof n!="object"&&typeof n!="function",H=Array.isArray,Ae=n=>H(n)||typeof n?.[Symbol.iterator]=="function",N=`[ 	
\f\r]`,E=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ne=/-->/g,ae=/>/g,y=RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),oe=/'/g,le=/"/g,ue=/^(?:script|style|textarea|title)$/i,Pe=n=>(e,...t)=>({_$litType$:n,strings:e,values:t}),u=Pe(1),v=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),ce=new WeakMap,$=f.createTreeWalker(f,129);function he(n,e){if(!H(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return se!==void 0?se.createHTML(e):e}const Se=(n,e)=>{const t=n.length-1,s=[];let i,r=e===2?"<svg>":e===3?"<math>":"",a=E;for(let l=0;l<t;l++){const o=n[l];let p,_,h=-1,g=0;for(;g<o.length&&(a.lastIndex=g,_=a.exec(o),_!==null);)g=a.lastIndex,a===E?_[1]==="!--"?a=ne:_[1]!==void 0?a=ae:_[2]!==void 0?(ue.test(_[2])&&(i=RegExp("</"+_[2],"g")),a=y):_[3]!==void 0&&(a=y):a===y?_[0]===">"?(a=i??E,h=-1):_[1]===void 0?h=-2:(h=a.lastIndex-_[2].length,p=_[1],a=_[3]===void 0?y:_[3]==='"'?le:oe):a===le||a===oe?a=y:a===ne||a===ae?a=E:(a=y,i=void 0);const m=a===y&&n[l+1].startsWith("/>")?" ":"";r+=a===E?o+ke:h>=0?(s.push(p),o.slice(0,h)+ie+o.slice(h)+b+m):o+b+(h===-2?l:m)}return[he(n,r+(n[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]};class q{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let r=0,a=0;const l=e.length-1,o=this.parts,[p,_]=Se(e,t);if(this.el=q.createElement(p,s),$.currentNode=this.el.content,t===2||t===3){const h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(i=$.nextNode())!==null&&o.length<l;){if(i.nodeType===1){if(i.hasAttributes())for(const h of i.getAttributeNames())if(h.endsWith(ie)){const g=_[a++],m=i.getAttribute(h).split(b),U=/([.?@])?(.*)/.exec(g);o.push({type:1,index:r,name:U[2],strings:m,ctor:U[1]==="."?Ie:U[1]==="?"?Ce:U[1]==="@"?Te:B}),i.removeAttribute(h)}else h.startsWith(b)&&(o.push({type:6,index:r}),i.removeAttribute(h));if(ue.test(i.tagName)){const h=i.textContent.split(b),g=h.length-1;if(g>0){i.textContent=L?L.emptyScript:"";for(let m=0;m<g;m++)i.append(h[m],P()),$.nextNode(),o.push({type:2,index:++r});i.append(h[g],P())}}}else if(i.nodeType===8)if(i.data===re)o.push({type:2,index:r});else{let h=-1;for(;(h=i.data.indexOf(b,h+1))!==-1;)o.push({type:7,index:r}),h+=b.length-1}r++}}static createElement(e,t){const s=f.createElement("template");return s.innerHTML=e,s}}function k(n,e,t=n,s){if(e===v)return e;let i=s!==void 0?t._$Co?.[s]:t._$Cl;const r=S(e)?void 0:e._$litDirective$;return i?.constructor!==r&&(i?._$AO?.(!1),r===void 0?i=void 0:(i=new r(n),i._$AT(n,t,s)),s!==void 0?(t._$Co??=[])[s]=i:t._$Cl=i),i!==void 0&&(e=k(n,i._$AS(n,e.values),i,s)),e}class Ee{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??f).importNode(t,!0);$.currentNode=i;let r=$.nextNode(),a=0,l=0,o=s[0];for(;o!==void 0;){if(a===o.index){let p;o.type===2?p=new Q(r,r.nextSibling,this,e):o.type===1?p=new o.ctor(r,o.name,o.strings,this,e):o.type===6&&(p=new qe(r,this,e)),this._$AV.push(p),o=s[++l]}a!==o?.index&&(r=$.nextNode(),a++)}return $.currentNode=f,i}p(e){let t=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}}let Q=class de{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,s,i){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=k(this,e,t),S(e)?e===d||e==null||e===""?(this._$AH!==d&&this._$AR(),this._$AH=d):e!==this._$AH&&e!==v&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Ae(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==d&&S(this._$AH)?this._$AA.nextSibling.data=e:this.T(f.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=q.createElement(he(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{const r=new Ee(i,this),a=r.u(this.options);r.p(t),this.T(a),this._$AH=r}}_$AC(e){let t=ce.get(e.strings);return t===void 0&&ce.set(e.strings,t=new q(e)),t}k(e){H(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let s,i=0;for(const r of e)i===t.length?t.push(s=new de(this.O(P()),this.O(P()),this,this.options)):s=t[i],s._$AI(r),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const s=te(e).nextSibling;te(e).remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}};class B{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,r){this.type=1,this._$AH=d,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=d}_$AI(e,t=this,s,i){const r=this.strings;let a=!1;if(r===void 0)e=k(this,e,t,0),a=!S(e)||e!==this._$AH&&e!==v,a&&(this._$AH=e);else{const l=e;let o,p;for(e=r[0],o=0;o<r.length-1;o++)p=k(this,l[s+o],t,o),p===v&&(p=this._$AH[o]),a||=!S(p)||p!==this._$AH[o],p===d?e=d:e!==d&&(e+=(p??"")+r[o+1]),this._$AH[o]=p}a&&!i&&this.j(e)}j(e){e===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class Ie extends B{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===d?void 0:e}}class Ce extends B{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==d)}}class Te extends B{constructor(e,t,s,i,r){super(e,t,s,i,r),this.type=5}_$AI(e,t=this){if((e=k(this,e,t,0)??d)===v)return;const s=this._$AH,i=e===d&&s!==d||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,r=e!==d&&(s===d||i);i&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class qe{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){k(this,e)}}const Ue=z.litHtmlPolyfillSupport;Ue?.(q,Q),(z.litHtmlVersions??=[]).push("3.3.3");const Me=(n,e,t)=>{const s=t?.renderBefore??e;let i=s._$litPart$;if(i===void 0){const r=t?.renderBefore??null;s._$litPart$=i=new Q(e.insertBefore(P(),r),r,void 0,t??{})}return i._$AI(n),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const j=globalThis;let I=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Me(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return v}};I._$litElement$=!0,I.finalized=!0,j.litElementHydrateSupport?.({LitElement:I});const De=j.litElementPolyfillSupport;De?.({LitElement:I}),(j.litElementVersions??=[]).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Le={CHILD:2},Be=n=>(...e)=>({_$litDirective$:n,values:e});class Fe{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,s){this._$Ct=e,this._$AM=t,this._$Ci=s}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class V extends Fe{constructor(e){if(super(e),this.it=d,e.type!==Le.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===d||e==null)return this._t=void 0,this.it=e;if(e===v)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}}V.directiveName="unsafeHTML",V.resultType=1;const Re=Be(V);function C(...n){console.log("[MusicFlow card]",...n)}function Oe(...n){console.warn("[MusicFlow card]",...n)}function T(...n){console.error("[MusicFlow card]",...n)}class ze{constructor(e={}){this.hass=e.hass||null,this.url=e.url||null,this.apiKey=e.apiKey||null,this.ws=null,this._listeners=new Map,this._connected=!1,this._pendingInit=null,this._reconnectTimer=null}on(e,t){return this._listeners.has(e)||this._listeners.set(e,new Set),this._listeners.get(e).add(t),()=>this._listeners.get(e)?.delete(t)}_emit(e,t){this._listeners.get(e)?.forEach(s=>{try{s(t)}catch(i){T("listener error",i)}})}get connected(){return this._connected}async init(){if(!(this.url&&this.apiKey)){if(!this.hass)throw new Error("MusicFlow \u5361\u7247: \u7F3A\u5C11\u540E\u7AEF\u5730\u5740,\u4E14\u672A\u63D0\u4F9B hass \u4EE5\u81EA\u52A8\u83B7\u53D6");if(this._pendingInit)return this._pendingInit;this._pendingInit=(async()=>{C("fetching backend_config from HA integration");const e=await this.hass.callWS({type:"musicflow/backend_config"}),t=e&&e.backends||[];if(!t.length)throw new Error("MusicFlow \u96C6\u6210\u672A\u914D\u7F6E\u540E\u7AEF\u8FDE\u63A5");const s=t[0];this.url=s.url,this.apiKey=s.api_key,C("backend_config ok",this.url)})(),await this._pendingInit}}_restBase(){return(this.url||"").replace(/\/+$/,"")+"/rest"}_wsUrl(){const e=new URL(this.url);return`${e.protocol==="https:"?"wss:":"ws:"}//${e.host}/ws?token=${encodeURIComponent(this.apiKey)}`}_withToken(e,t){const s=this._restBase(),i=e.includes("?")?"&":"?",r=`token=${encodeURIComponent(this.apiKey)}`,a=t?`${i}${r}&${t}`:`${i}${r}`;return`${s}${e}${a}`}async rest(e,{method:t="GET",body:s}={}){const i=this._withToken(e),r={method:t,headers:{}};s!==void 0&&(r.headers["Content-Type"]="application/json",r.body=JSON.stringify(s)),C("REST",t,i.replace(/token=[^&]+/,"token=***"));let a;try{a=await fetch(i,r)}catch(l){const o=l instanceof TypeError?"\u7F51\u7EDC\u5C42\u5931\u8D25: \u901A\u5E38\u662F (1)CORS \u672A\u653E\u884C (2)\u6DF7\u5408\u5185\u5BB9 HTTPS\u9875\u8BBF\u95EEHTTP\u540E\u7AEF (3)\u540E\u7AEF\u5730\u5740\u6D4F\u89C8\u5668\u4E0D\u53EF\u8FBE\u3002\u8BF7\u786E\u8BA4\u540E\u7AEF\u5DF2\u653E\u884C\u8BE5\u6765\u6E90,\u4E14\u5361\u7247\u6240\u7528\u7684 url \u6D4F\u89C8\u5668\u80FD\u76F4\u63A5\u8BBF\u95EE":String(l);throw T("REST network error",t,i.replace(/token=[^&]+/,"token=***"),o),l}if(!a.ok){const l=await a.text().catch(()=>"");throw T("REST failed",t,e,a.status,l.slice(0,200)),new Error(`MusicFlow REST ${t} ${e} -> ${a.status}`)}if((a.headers.get("content-type")||"").includes("application/json")){const l=await a.json();return l&&l["subsonic-response"]?l["subsonic-response"]:l}return a}connect(){if(this.ws&&(this.ws.readyState===WebSocket.OPEN||this.ws.readyState===WebSocket.CONNECTING))return;let e;try{e=new WebSocket(this._wsUrl())}catch(t){T("WS open failed",t),this._scheduleReconnect();return}this.ws=e,e.onmessage=t=>{let s;try{s=JSON.parse(t.data)}catch{return}this._handle(s)},e.onopen=()=>{this._connected=!0,C("WS open"),this._emit("open")},e.onclose=()=>{this._connected=!1,Oe("WS close"),this._emit("close"),this._scheduleReconnect()},e.onerror=t=>{T("WS error",t);try{e.close()}catch{}}}_scheduleReconnect(){this._reconnectTimer||(this._reconnectTimer=setTimeout(()=>{this._reconnectTimer=null,this.connect()},3e3))}disconnect(){if(this._reconnectTimer&&(clearTimeout(this._reconnectTimer),this._reconnectTimer=null),this.ws){this.ws.onclose=null;try{this.ws.close()}catch{}this.ws=null}}_handle(e){switch(C("WS",e.type,e),e.type){case"snapshot":this._emit("snapshot",e.devices||{});break;case"peer_snapshot":this._emit("peer_snapshot",e.peers||[]);break;case"peer_registered":case"peer_available":case"peer_unavailable":e.peer&&this._emit("peer_update",e.peer);break;case"peer_queue_changed":this._emit("peer_queue",{peerId:e.peer_id,queue:e.queue});break;case"peer_queue_cleared":this._emit("peer_queue",{peerId:e.peer_id,queue:{items:[],currentIndex:-1,playMode:"order",isActive:!1}});break;case"queue_changed":this._emit("queue_changed",{deviceId:e.device_id,queue:e.queue});break;case"player_state_changed":this._emit("state",{deviceId:e.device_id,state:e.state});break;case"media_changed":this._emit("media",{deviceId:e.device_id,media:e.media});break;case"group_changed":this._emit("group",e.group);break;case"group_deleted":this._emit("group_deleted",e.id);break}}peerPath(e,t){return`/api/v1/peers/${encodeURIComponent(e)}${t}`}play(e){return this.rest(this.peerPath(e,"/play"),{method:"POST"})}pause(e){return this.rest(this.peerPath(e,"/pause"),{method:"POST"})}stop(e){return this.rest(this.peerPath(e,"/stop"),{method:"POST"})}next(e){return this.rest(this.peerPath(e,"/next"),{method:"POST"})}prev(e){return this.rest(this.peerPath(e,"/prev"),{method:"POST"})}seek(e,t){return this.rest(this.peerPath(e,"/seek"),{method:"POST",body:{seconds:t}})}setVolume(e,t){return this.rest(this.peerPath(e,"/volume"),{method:"POST",body:{volume:Math.round(t*100)}})}setMute(e,t){return this.rest(this.peerPath(e,"/mute"),{method:"POST",body:{muted:t}})}setPlayMode(e,t){return this.rest(this.peerPath(e,"/play-mode"),{method:"POST",body:{mode:t}})}playQueue(e,t,s=0){return this.rest(this.peerPath(e,"/queue/play"),{method:"POST",body:{items:t,startIndex:s}})}enqueue(e,t){return this.rest(this.peerPath(e,"/queue/enqueue"),{method:"POST",body:{items:t}})}removeAt(e,t){return this.rest(this.peerPath(e,`/queue/${t}`),{method:"DELETE"})}clearQueue(e){return this.rest(this.peerPath(e,"/queue"),{method:"DELETE"})}getQueue(e){return this.rest(this.peerPath(e,"/queue"))}getStatus(e){return this.rest(this.peerPath(e,"/status"))}getPeers(){return this.rest("/api/v1/peers")}async search(e,{count:t=20,offset:s=0}={}){return this.rest(`/search3?query=${encodeURIComponent(e)}&count=${t}&offset=${s}`)}async getLyrics(e){return this.rest(`/getLyricsBySongId?id=${encodeURIComponent(e)}&f=json`)}async star(e){return this.rest(`/star?id=${encodeURIComponent(e)}`)}async unstar(e){return this.rest(`/unstar?id=${encodeURIComponent(e)}`)}async getPlaylists(){return this.rest("/getPlaylists")}async updatePlaylist(e,{songIdsToAdd:t=[]}={}){const s=t.map(i=>`songIdToAdd=${encodeURIComponent(i)}`).join("&");return this.rest(`/updatePlaylist?playlistId=${encodeURIComponent(e)}${s?"&"+s:""}`)}async getStarred(){return this.rest("/getStarred2")}async getAlbumList2({type:e="alphabeticalByName",genre:t="",size:s=300,offset:i=0}={}){const r=`type=${encodeURIComponent(e)}&size=${s}&offset=${i}`+(t?`&genre=${encodeURIComponent(t)}`:"");return this.rest(`/getAlbumList2?${r}`)}async getArtists(){return this.rest("/getArtists")}async getArtist(e){return this.rest(`/getArtist?id=${encodeURIComponent(e)}`)}async getAlbum(e){return this.rest(`/getAlbum?id=${encodeURIComponent(e)}`)}async getGenres(){return this.rest("/getGenres")}async getPlaylistSongs(e){return this.rest(`/getPlaylist?id=${encodeURIComponent(e)}`)}coverUrl(e){return e?this._withToken(`/getCoverArt?id=${encodeURIComponent(e)}&size=300`):null}}function w(n){const e={mp3:"audio/mpeg",flac:"audio/flac",wav:"audio/wav",aac:"audio/aac",ogg:"audio/ogg",m4a:"audio/mp4",opus:"audio/opus",wma:"audio/x-ms-wma",ape:"audio/ape"},t=(n.suffix||"").toLowerCase();return{songId:n.id||n.songId,title:n.title||"\u672A\u77E5",artist:n.artist||void 0,album:n.album||void 0,albumId:n.albumId||void 0,mime:e[t]||"audio/mpeg",coverArt:n.coverArt||(n.albumId?`al-${n.albumId}`:void 0),duration:n.duration||void 0}}function He(n){const e=n?.lyricsList?.structuredLyrics||[],t=e.find(s=>s.synced)||e[0];return!t||!t.line?[]:t.line.filter(s=>s.start!==void 0&&s.start!==null).map(s=>({time:Number(s.start)/1e3,text:s.value})).sort((s,i)=>s.time-i.time)}const W=["order","one","all","shuffle"],Ne={order:"\u987A\u5E8F\u64AD\u653E",one:"\u5355\u66F2\u5FAA\u73AF",all:"\u5217\u8868\u5FAA\u73AF",shuffle:"\u968F\u673A\u64AD\u653E"},Qe={order:"listOrdered",one:"repeat1",all:"repeat",shuffle:"shuffle"},je={play:'<polygon points="6 3 20 12 6 21 6 3"/>',pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',prev:'<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',next:'<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',shuffle:'<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',repeat:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',repeat1:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/>',listOrdered:'<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',volume2:'<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',volumeX:'<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>'};function G(...n){console.log("[MF card]",...n)}function c(...n){console.error("[MF card]",...n)}class Ve extends I{static get properties(){return{hass:{attribute:!1},_config:{state:!0}}}setConfig(e){this._config=e||{}}constructor(){super(),this._client=null,this._ready=!1,this._ui={error:"",connected:!1,peers:[],currentPeerId:"",queue:[],currentIndex:-1,isPlaying:!1,currentTime:0,duration:0,playMode:"shuffle",volume:.8,muted:!1,song:null,lyrics:[],currentLyric:"",liked:!1,showLyrics:!1,showQueue:!1,showSearch:!1,showPlaylistPicker:!1,searchQuery:"",searchResults:[],playlists:[],pickerSongId:null,showBrowser:!1,browserStack:[],showVolume:!1},this._tickTimer=null,this._pollTimer=null,this._heartbeatTimer=null,this._volumeDebounce=null}disconnectedCallback(){super.disconnectedCallback(),this._teardown()}_teardown(){this._tickTimer&&(clearInterval(this._tickTimer),this._tickTimer=null),this._pollTimer&&(clearInterval(this._pollTimer),this._pollTimer=null),this._heartbeatTimer&&(clearInterval(this._heartbeatTimer),this._heartbeatTimer=null),this._client&&this._client.disconnect()}set hass(e){const t=this._hass;this._hass=e,!t&&e&&!this._ready&&this._bootstrap(e)}get hass(){return this._hass}async _bootstrap(e){this._ready=!0;const t=this._config||{};this._client=new ze({hass:e,url:t.url||null,apiKey:t.api_key||null});try{await this._client.init()}catch(s){const i=s.message||String(s);c("init failed",i),this._ui.error=i,this.requestUpdate();return}this._bindClient(),this._client.connect()}_bindClient(){const e=this._client;e.on("open",()=>{this._ui.connected=!0,this._startHeartbeat(),this.requestUpdate()}),e.on("close",()=>{this._ui.connected=!1,this.requestUpdate()}),e.on("snapshot",t=>this._applySnapshot(t)),e.on("peer_snapshot",t=>this._applyPeerSnapshot(t)),e.on("peer_update",t=>this._upsertPeer(t)),e.on("peer_queue",({peerId:t,queue:s})=>this._applyPeerQueue(t,s)),e.on("queue_changed",({deviceId:t,queue:s})=>this._applyDeviceQueue(t,s)),e.on("state",({deviceId:t,state:s})=>this._applyDeviceState(t,s)),e.on("media",({deviceId:t,media:s})=>this._applyDeviceMedia(t,s)),e.on("group",()=>this._refreshPeers()),e.on("group_deleted",()=>this._refreshPeers())}_resolveDefaultPeerId(e){const t=this._config||{};if(t.entity&&this._hass?.states?.[t.entity]){const s=this._hass.states[t.entity].attributes?.peer_id;if(s&&e.some(i=>i.peerId===s))return s}return null}_isDlnaPeer(e){return e?typeof e.peerId=="string"?e.peerId.startsWith("dlna:"):(e.kind||"")==="dlna":!1}_filterDlna(e){return(e||[]).filter(t=>this._isDlnaPeer(t))}_applyPeerSnapshot(e){const t=this._filterDlna(e);this._ui.peers=t;const s=this._resolveDefaultPeerId(t);if(!this._ui.currentPeerId||s){const i=s&&t.find(r=>r.peerId===s)||t.find(r=>r.available)||t[0];i&&this._selectPeer(i.peerId,!0)}else this._refreshCurrentPeerView();this.requestUpdate()}_applySnapshot(e){const t=this._ui.currentPeerId;if(!t||!t.startsWith("dlna:"))return;const s=t.slice(5),i=e[s];i&&this._applyStatus(i)}_upsertPeer(e){if(!e||!this._isDlnaPeer(e))return;const t=this._ui.peers.findIndex(s=>s.peerId===e.peerId);t>=0?this._ui.peers[t]={...this._ui.peers[t],...e}:this._ui.peers.push(e),this.requestUpdate()}_applyPeerQueue(e,t){e===this._ui.currentPeerId&&this._applyQueue(t);const s=this._ui.peers.findIndex(i=>i.peerId===e);s>=0&&(this._ui.peers[s]={...this._ui.peers[s],queue:t}),this.requestUpdate()}_applyDeviceQueue(e,t){const s=this._ui.currentPeerId;(s===`dlna:${e}`||s===`group:${e}`)&&this._applyQueue(t);const i=this._ui.peers.findIndex(r=>r.peerId===`dlna:${e}`||r.peerId===`group:${e}`);i>=0&&(this._ui.peers[i]={...this._ui.peers[i],queue:t}),this.requestUpdate()}_applyQueue(e){e&&(Array.isArray(e.items)&&(this._ui.queue=e.items.map(t=>({songId:t.songId,title:t.title||"\u672A\u77E5",artist:t.artist||"",album:t.album||"",coverArt:t.coverArt,duration:t.duration||0}))),typeof e.currentIndex=="number"&&(this._ui.currentIndex=e.currentIndex),typeof e.playMode=="string"&&(this._ui.playMode=e.playMode),this._syncCurrentSong())}_applyDeviceState(e,t){const s=this._ui.currentPeerId;s&&(s===`dlna:${e}`||s===`group:${e}`)&&this._applyStatus(t)}_applyDeviceMedia(e,t){const s=this._ui.currentPeerId;s&&(s===`dlna:${e}`||s===`group:${e}`)&&this._setMedia(t)}_applyStatus(e){e&&(this._ui.isPlaying=e.state==="PLAYING",typeof e.position=="number"&&(this._ui.currentTime=e.position),typeof e.duration=="number"&&e.duration>0&&(this._ui.duration=e.duration),typeof e.volume=="number"&&(this._ui.volume=Math.max(0,Math.min(100,e.volume))/100),typeof e.muted=="boolean"&&(this._ui.muted=e.muted),e.media&&this._setMedia(e.media),this._updateLyric(),this.requestUpdate())}_setMedia(e){if(!e)return;const t={songId:e.songId,title:e.title||"\u672A\u77E5",artist:e.artist||"",album:e.album||"",coverArt:e.coverArt,duration:e.duration||this._ui.duration||0},s=t.songId!==this._ui.song?.songId;this._ui.song=t,s&&t.songId&&(this._ui.lyrics=[],this._ui.currentLyric="",this._client.scrobble?.(t.songId).catch(i=>c("scrobble failed",i)),this._loadLyrics(t.songId),this._loadLiked(t.songId)),this.requestUpdate()}_syncCurrentSong(){const e=this._ui.currentIndex,t=this._ui.queue;if(e>=0&&e<t.length){const s=t[e];(!this._ui.song||this._ui.song.songId!==s.songId)&&(this._ui.song={songId:s.songId,title:s.title,artist:s.artist,album:s.album,coverArt:s.coverArt,duration:s.duration},s.songId&&(this._client.scrobble?.(s.songId).catch(i=>c("scrobble failed",i)),this._loadLyrics(s.songId),this._loadLiked(s.songId)))}}_refreshPeers(){this._client.getPeers().then(e=>{const t=this._filterDlna(e?.peers||[]);t.length&&(this._ui.peers=t,this.requestUpdate())}).catch(e=>c("getPeers failed",e))}async _refreshCurrentPeerView(){const e=this._ui.currentPeerId;if(e)try{const[t,s]=await Promise.all([this._client.getStatus(e),this._client.getQueue(e)]);this._applyStatus(t),this._applyQueue(s)}catch(t){c("refreshCurrentPeerView failed",t)}}_selectPeer(e,t){e!==this._ui.currentPeerId&&(this._ui.currentPeerId=e,this._stopTracking(),this._ui.queue=[],this._ui.currentIndex=-1,this._ui.song=null,this._ui.lyrics=[],this._ui.currentLyric="",this._ui.currentTime=0,this._ui.duration=0,this._refreshCurrentPeerView(),this._startTracking(),this.requestUpdate())}_startTracking(){this._stopTracking();const e=this._ui.currentPeerId;e&&(this._pollTimer=setInterval(async()=>{try{const[t,s]=await Promise.all([this._client.getStatus(e),this._client.getQueue(e)]);this._applyStatus(t),this._applyQueue(s)}catch(t){c("poll failed",t)}},2e3),this._tickTimer=setInterval(()=>{this._ui.isPlaying&&this._ui.duration>0&&this._ui.currentTime<this._ui.duration&&(this._ui.currentTime=Math.min(this._ui.duration,this._ui.currentTime+.25),this._updateLyric(),this.requestUpdate())},250))}_stopTracking(){this._tickTimer&&(clearInterval(this._tickTimer),this._tickTimer=null),this._pollTimer&&(clearInterval(this._pollTimer),this._pollTimer=null)}_startHeartbeat(){this._heartbeatTimer||(this._heartbeatTimer=setInterval(()=>{const e=this._ui.currentPeerId;e&&e.startsWith("local:")&&this._client.heartbeat(e).catch(t=>c("heartbeat failed",t))},3e4))}_togglePlay(){const e=this._ui.currentPeerId;e&&(this._ui.isPlaying?this._client.pause(e).catch(t=>c("pause failed",t)):this._client.play(e).catch(t=>c("play failed",t)),this._ui.isPlaying=!this._ui.isPlaying,this.requestUpdate())}_next(){const e=this._ui.currentPeerId;e&&this._client.next(e).catch(t=>c("next failed",t))}_prev(){const e=this._ui.currentPeerId;e&&(this._ui.currentTime>3?this._client.seek(e,0).then(()=>{this._ui.currentTime=0,this.requestUpdate()}).catch(t=>c("seek failed",t)):this._client.prev(e).catch(t=>c("prev failed",t)))}_cyclePlayMode(){const e=this._ui.currentPeerId;if(!e)return;const t=W[(W.indexOf(this._ui.playMode)+1)%W.length];this._ui.playMode=t,this._client.setPlayMode(e,t).catch(s=>c("setPlayMode failed",s)),this.requestUpdate()}_setVolume(e){const t=Number(e.target.value)/100;this._ui.volume=t;const s=this._ui.currentPeerId;s&&(this._volumeDebounce&&clearTimeout(this._volumeDebounce),this._volumeDebounce=setTimeout(()=>{this._client.setVolume(s,t).catch(i=>c("setVolume failed",i))},150)),this.requestUpdate()}_toggleMute(){const e=this._ui.currentPeerId;if(!e)return;const t=!this._ui.muted;this._ui.muted=t,this._client.setMute(e,t).catch(s=>c("setMute failed",s)),this.requestUpdate()}_seek(e){const t=this._ui.currentPeerId;if(!t)return;const s=Number(e.target.value)/100*(this._ui.duration||0);this._ui.currentTime=s,this._client.seek(t,s).catch(i=>c("seek failed",i)),this._updateLyric(),this.requestUpdate()}async _loadLyrics(e){try{const t=await this._client.getLyrics(e);this._ui.lyrics=He(t),this._updateLyric()}catch(t){c("loadLyrics failed",t),this._ui.lyrics=[]}this.requestUpdate()}_updateLyric(){const e=this._ui.lyrics;if(!e.length){this._ui.currentLyric="";return}const t=this._ui.currentTime;let s=-1;for(let i=0;i<e.length&&e[i].time<=t;i++)s=i;this._ui.currentLyric=s>=0?e[s].text:""}async _loadLiked(e){try{const t=await this._client.getStarred(),s=new Set((t?.starred2?.song||t?.starred?.song||[]).map(i=>i.id));this._ui.liked=s.has(e)}catch(t){c("loadLiked failed",t),this._ui.liked=!1}this.requestUpdate()}_toggleLike(){const e=this._ui.song;e?.songId&&(this._ui.liked?this._client.unstar(e.songId).catch(t=>c("unstar failed",t)):this._client.star(e.songId).catch(t=>c("star failed",t)),this._ui.liked=!this._ui.liked,this.requestUpdate())}_removeFromQueue(e){const t=this._ui.currentPeerId;t&&this._client.removeAt(t,e).catch(s=>c("removeAt failed",s))}_clearQueue(){const e=this._ui.currentPeerId;e&&this._client.clearQueue(e).catch(t=>c("clearQueue failed",t))}_jumpTo(e){const t=this._ui.currentPeerId;if(!t||!this._ui.queue[e])return;const s=this._ui.queue.map(i=>w(i));this._client.playQueue(t,s,e).catch(i=>c("jumpTo failed",i))}_appendAndPlay(e){const t=this._ui.currentPeerId;if(!t||!e)return;const s=[...this._ui.queue.map(i=>w(i)),w(e)];this._client.playQueue(t,s,this._ui.queue.length).catch(i=>c("appendAndPlay failed",i))}_enqueueOnly(e){const t=this._ui.currentPeerId;!t||!e||this._client.enqueue(t,[w(e)]).catch(s=>c("enqueue failed",s))}_reorder(e,t){const s=this._ui.currentPeerId;if(!s)return;const i=this._ui.queue.slice();if(e<0||e>=i.length||t<0||t>=i.length)return;const[r]=i.splice(e,1);i.splice(t,0,r);const a=this._ui.song?.songId;let l=i.findIndex(o=>o.songId===a);l<0&&(l=Math.max(0,Math.min(t,i.length-1))),this._ui.queue=i,this._ui.currentIndex=l,this._client.playQueue(s,i.map(w),l).catch(o=>c("reorder failed",o)),this.requestUpdate()}async _doSearch(){const e=(this._ui.searchQuery||"").trim();if(!e){this._ui.searchResults=[],this.requestUpdate();return}try{const t=await this._client.search(e,{count:30}),s=t?.searchResult3?.song||t?.searchResult2?.song||[];this._ui.searchResults=s.map(i=>({songId:i.id,title:i.title||"\u672A\u77E5",artist:i.artist||"",album:i.album||"",coverArt:i.coverArt,duration:i.duration||0,suffix:i.suffix}))}catch(t){c("search failed",t),this._ui.searchResults=[]}this.requestUpdate()}_searchPlay(e){this._appendAndPlay(e)}_searchEnqueue(e){const t=this._ui.currentPeerId;t&&this._client.enqueue(t,[w(e)]).catch(s=>c("searchEnqueue failed",s))}async _loadPlaylists(){try{const e=await this._client.getPlaylists(),t=e?.playlists?.playlist||e?.playlists||[];this._ui.playlists=t.filter(s=>s&&s.id!=null).map(s=>({id:String(s.id),name:s.name||"\u672A\u547D\u540D\u6B4C\u5355"}))}catch(e){c("loadPlaylists failed",e),this._ui.playlists=[]}this.requestUpdate()}_openPlaylistPicker(e){this._ui.pickerSongId=e,this._ui.showPlaylistPicker=!0,this._loadPlaylists()}_addToPlaylist(e){const t=this._ui.pickerSongId;t&&(this._client.updatePlaylist(e,{songIdsToAdd:[t]}).then(()=>G("added to playlist",e)).catch(s=>c("addToPlaylist failed",s)),this._ui.showPlaylistPicker=!1,this._ui.pickerSongId=null)}_icon(e,t=20,s=!1){const i=je[e]||"";return u`<svg viewBox="0 0 24 24" width="${t}" height="${t}"
      fill="${s?"currentColor":"none"}"
      stroke="${s?"none":"currentColor"}"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true">${Re(i)}</svg>`}_cover(e){return this._client?this._client.coverUrl(e):null}_fmtTime(e){if(!e||e<0)return"0:00";const t=Math.floor(e/60),s=Math.floor(e%60);return`${t}:${s<10?"0":""}${s}`}render(){if(this._ui.error)return u`<ha-card><div class="wrap"><div class="err">MusicFlow: ${this._ui.error}</div></div></ha-card>`;if(!this._client)return u`<ha-card><div class="wrap"><div class="err">MusicFlow 卡片初始化中…</div></div></ha-card>`;const e=this._ui,t=e.song,s=e.duration>0?e.currentTime/e.duration*100:0,i=Math.round(e.volume*100);return u`
      <ha-card>
        <div class="wrap">
          ${this._renderOutputs()}

          <div class="now">
            <div class="cover">${t?.coverArt?u`<img src="${this._cover(t.coverArt)}" alt="" />`:u`<div class="nocover">♪</div>`}</div>
            <div class="meta">
              <div class="track">${t?t.title:"\u672A\u5728\u64AD\u653E"}</div>
              <div class="artist">${t?t.artist:"\u2014"}</div>
              <div class="progress-row">
                <span class="t">${this._fmtTime(e.currentTime)}</span>
                <input class="seek" type="range" min="0" max="100" step="0.1" value="${s}"
                  style="background: linear-gradient(90deg, #f62c55 ${s}%, rgba(255,255,255,0.18) ${s}%)"
                  @input=${this._seek} />
                <span class="t">${this._fmtTime(e.duration)}</span>
              </div>
            </div>
            <span class="conn ${e.connected?"on":"off"}" title="后端连接状态">${e.connected?"\u5DF2\u8FDE\u63A5":"\u672A\u8FDE\u63A5"}</span>
          </div>

          <div class="controls">
            <button class="ctl" title="${Ne[e.playMode]}" @click=${this._cyclePlayMode}>${this._icon(Qe[e.playMode],20)}</button>
            <button class="ctl" title="上一首" @click=${this._prev}>${this._icon("prev",22)}</button>
            <button class="ctl play" title="播放/暂停" @click=${this._togglePlay}>${this._icon(e.isPlaying?"pause":"play",24,!0)}</button>
            <button class="ctl" title="下一首" @click=${this._next}>${this._icon("next",22)}</button>
            <button class="ctl like ${e.liked?"on":""}" title="喜欢" @click=${this._toggleLike}>${this._icon("heart",20,e.liked)}</button>
            <button class="ctl ${e.showVolume?"vol-open":""}" title="音量" @click=${()=>{e.showVolume=!e.showVolume,this.requestUpdate()}}>${this._icon(e.muted||e.volume<=0?"volumeX":"volume2",20)}</button>

            ${e.showVolume?u`
              <div class="volpop" @click=${r=>r.stopPropagation()}>
                <span class="vpct">${i}%</span>
                <input class="vol-v" type="range" orient="vertical" min="0" max="100" value="${i}"
                  style="background: linear-gradient(to top, #f62c55 ${i}%, rgba(255,255,255,0.18) ${i}%)"
                  @input=${this._setVolume} />
                <button class="vbtn ${e.muted?"muted":""}" title="${e.muted?"\u53D6\u6D88\u9759\u97F3":"\u9759\u97F3"}" @click=${this._toggleMute}>${this._icon(e.muted?"volumeX":"volume2",18)}</button>
              </div>
            `:""}
          </div>
          ${e.showVolume?u`<div class="volpop-backdrop" @click=${()=>{e.showVolume=!1,this.requestUpdate()}}></div>`:""}

          <div class="actions">
            <button class="act ${e.showLyrics?"active":""}" @click=${()=>{e.showLyrics=!e.showLyrics,e.showQueue=!1,e.showSearch=!1,e.showBrowser=!1,this.requestUpdate()}}>歌词</button>
            <button class="act ${e.showQueue?"active":""}" @click=${()=>{e.showQueue=!e.showQueue,e.showLyrics=!1,e.showSearch=!1,e.showBrowser=!1,this.requestUpdate()}}>队列</button>
            <button class="act ${e.showSearch?"active":""}" @click=${()=>{e.showSearch=!e.showSearch,e.showLyrics=!1,e.showQueue=!1,e.showBrowser=!1,this.requestUpdate()}}>搜索</button>
            <button class="act ${e.showBrowser?"active":""}" @click=${this._openBrowser}>媒体库</button>
          </div>

          ${e.showLyrics?this._renderLyrics():""}
          ${e.showQueue?this._renderQueue():""}
          ${e.showSearch?this._renderSearch():""}
          ${e.showBrowser?this._renderMediaBrowser():""}
        </div>

        ${e.showPlaylistPicker?this._renderPlaylistPicker():""}
      </ha-card>
    `}_renderOutputs(){const e=this._ui.peers||[];return e.length?u`
      <div class="outputs">
        ${e.map(t=>u`
          <button class="out ${t.peerId===this._ui.currentPeerId?"active":""} ${t.available?"":"off"}"
            title="${t.kind||""}"
            @click=${()=>this._selectPeer(t.peerId)}>
            ${t.kind==="group"?"\u{1F465}":t.kind==="dlna"?"\u{1F50A}":"\u{1F4BB}"} ${t.name||t.peerId}
          </button>
        `)}
      </div>
    `:u`<div class="outputs"><span class="hint">无可用播放器</span></div>`}_renderLyrics(){const e=this._ui.lyrics;if(!e.length)return u`<div class="panel"><div class="empty">无歌词</div></div>`;const t=this._ui.currentTime;let s=-1;for(let i=0;i<e.length&&e[i].time<=t;i++)s=i;return u`
      <div class="panel lyrics">
        ${e.map((i,r)=>u`<div class="lyr ${r===s?"active":""}">${i.text||"\u2026"}</div>`)}
      </div>
    `}_renderQueue(){const e=this._ui.queue||[];return u`
      <div class="panel queue">
        <div class="panel-head">
          <span>队列 (${e.length})</span>
          <button class="mini" @click=${this._clearQueue}>清空</button>
        </div>
        ${e.length===0?u`<div class="empty">队列为空</div>`:u`
          <div class="qlist">
            ${e.map((t,s)=>u`
              <div class="qitem ${s===this._ui.currentIndex?"cur":""}"
                draggable="true"
                @dragstart=${i=>{i.dataTransfer.setData("text/plain",String(s))}}
                @dragover=${i=>i.preventDefault()}
                @drop=${i=>{i.preventDefault();const r=Number(i.dataTransfer.getData("text/plain"));this._reorder(r,s)}}>
                <span class="idx">${s+1}</span>
                <span class="qt">${t.title}</span>
                <span class="qa">${t.artist||""}</span>
                <button class="mini" title="跳播" @click=${()=>this._jumpTo(s)}>▶</button>
                <button class="mini" title="移除" @click=${()=>this._removeFromQueue(s)}>✕</button>
              </div>
            `)}
          </div>
        `}
      </div>
    `}_renderSearch(){return u`
      <div class="panel search">
        <div class="panel-head">
          <input class="search-input" placeholder="搜索歌曲…"
            .value=${this._ui.searchQuery}
            @input=${e=>{this._ui.searchQuery=e.target.value}}
            @keydown=${e=>{e.key==="Enter"&&this._doSearch()}} />
          <button class="mini" @click=${this._doSearch}>搜索</button>
        </div>
        <div class="slist">
          ${this._ui.searchResults.map(e=>u`
            <div class="sitem">
              <span class="st">${e.title}</span>
              <span class="sa">${e.artist||""}</span>
              <button class="mini" title="播放" @click=${()=>this._searchPlay(e)}>▶</button>
              <button class="mini" title="加入队列" @click=${()=>this._searchEnqueue(e)}>＋</button>
              <button class="mini" title="加入歌单" @click=${()=>this._openPlaylistPicker(e.songId)}>♥+</button>
            </div>
          `)}
        </div>
      </div>
    `}_renderPlaylistPicker(){return u`
      <div class="overlay" @click=${()=>{this._ui.showPlaylistPicker=!1,this.requestUpdate()}}>
        <div class="picker" @click=${e=>e.stopPropagation()}>
          <div class="panel-head"><span>添加到歌单</span><button class="mini" @click=${()=>{this._ui.showPlaylistPicker=!1,this.requestUpdate()}}>关闭</button></div>
          <div class="plist">
            ${(this._ui.playlists||[]).map(e=>u`
              <div class="pitem" @click=${()=>this._addToPlaylist(e.id)}>${e.name}</div>
            `)}
            ${(this._ui.playlists||[]).length===0?u`<div class="empty">无歌单</div>`:""}
          </div>
        </div>
      </div>
    `}_openBrowser(){const e=this._ui;e.showBrowser=!0,e.showLyrics=e.showQueue=e.showSearch=!1,e.browserStack=[{type:"root",items:[{kind:"cat",cat:"playlists",name:"\u6B4C\u5355"},{kind:"cat",cat:"albums",name:"\u4E13\u8F91"},{kind:"cat",cat:"artists",name:"\u827A\u672F\u5BB6"},{kind:"cat",cat:"genres",name:"\u6D41\u6D3E"},{kind:"cat",cat:"starred",name:"\u6211\u559C\u6B22\u7684\u97F3\u4E50"}],query:"",loading:!1}],this.requestUpdate()}_crumbName(e){switch(e.type){case"root":return"\u5A92\u4F53\u5E93";case"playlists":return"\u6B4C\u5355";case"playlist":return e.name||"\u6B4C\u5355";case"albums":return"\u4E13\u8F91";case"album":return e.name||"\u4E13\u8F91";case"artists":return"\u827A\u672F\u5BB6";case"artist":return e.name||"\u827A\u672F\u5BB6";case"genres":return"\u6D41\u6D3E";case"genre":return e.name||"\u6D41\u6D3E";case"starred":return"\u6211\u559C\u6B22\u7684\u97F3\u4E50";default:return""}}_toSongItem(e){return{kind:"song",id:String(e.id),title:e.title||"\u672A\u77E5",artist:e.artist||"",album:e.album||"",coverArt:e.coverArt,duration:e.duration||0,suffix:e.suffix}}async _browserLoad(e){e.loading=!0,this.requestUpdate();try{if(e.type==="playlists"){const t=await this._client.getPlaylists();e.items=(t?.playlists?.playlist||t?.playlists||[]).map(s=>({kind:"playlist",id:String(s.id),name:s.name||"\u672A\u547D\u540D\u6B4C\u5355",coverArt:s.coverArt,songCount:s.songCount}))}else if(e.type==="playlist"){const t=await this._client.getPlaylistSongs(e.id);e.items=(t?.playlist?.entry||[]).map(s=>this._toSongItem(s))}else if(e.type==="albums"){const t=await this._client.getAlbumList2({type:"alphabeticalByName",size:300});e.items=(t?.albumList2?.album||[]).map(s=>({kind:"album",id:String(s.id),name:s.name||"\u672A\u77E5\u4E13\u8F91",artist:s.artist||"",coverArt:s.coverArt,songCount:s.songCount}))}else if(e.type==="album"){const t=await this._client.getAlbum(e.id);e.items=(t?.album?.song||[]).map(s=>this._toSongItem(s))}else if(e.type==="artists"){const t=(await this._client.getArtists())?.artists?.index||[],s=[];for(const i of t)for(const r of i.artist||[])s.push({kind:"artist",id:String(r.id),name:r.name||"\u672A\u77E5\u827A\u672F\u5BB6",coverArt:r.coverArt});e.items=s}else if(e.type==="artist"){const t=await this._client.getArtist(e.id);e.items=(t?.artist?.album||[]).map(s=>({kind:"album",id:String(s.id),name:s.name||"\u672A\u77E5\u4E13\u8F91",artist:s.artist||"",coverArt:s.coverArt}))}else if(e.type==="genres"){const t=await this._client.getGenres();e.items=(t?.genres?.genre||[]).map(s=>({kind:"genre",id:s.value,name:s.value,songCount:s.songCount,albumCount:s.albumCount}))}else if(e.type==="genre"){const t=await this._client.getAlbumList2({type:"byGenre",genre:e.id,size:300});e.items=(t?.albumList2?.album||[]).map(s=>({kind:"album",id:String(s.id),name:s.name||"\u672A\u77E5\u4E13\u8F91",artist:s.artist||"",coverArt:s.coverArt,songCount:s.songCount}))}else if(e.type==="starred"){const t=await this._client.getStarred();e.items=(t?.starred2?.song||[]).map(s=>this._toSongItem(s))}}catch(t){c("browser load failed",t),e.items=[]}e.loading=!1,this.requestUpdate()}_browserPush(e){this._ui.browserStack.push(e),this._browserLoad(e)}_browserPopTo(e){for(;this._ui.browserStack.length>e+1;)this._ui.browserStack.pop();this.requestUpdate()}_browserSearch(){const e=this._ui.browserStack[this._ui.browserStack.length-1];if(!e)return;const t=(e.query||"").trim();if(e.type==="albums"){if(!t){this._browserLoad(e);return}this._client.search(t,{count:100}).then(s=>{e.items=(s?.searchResult3?.album||[]).map(i=>({kind:"album",id:String(i.id),name:i.name||"\u672A\u77E5\u4E13\u8F91",artist:i.artist||"",coverArt:i.coverArt,songCount:i.songCount})),this.requestUpdate()}).catch(s=>c("browser album search failed",s))}else if(e.type==="artists"){if(!t){this._browserLoad(e);return}this._client.search(t,{count:100}).then(s=>{e.items=(s?.searchResult3?.artist||[]).map(i=>({kind:"artist",id:String(i.id),name:i.name||"\u672A\u77E5\u827A\u672F\u5BB6",coverArt:i.coverArt})),this.requestUpdate()}).catch(s=>c("browser artist search failed",s))}else this.requestUpdate()}_browserItemClick(e){if(e)if(e.kind==="cat"){const t={playlists:"playlists",albums:"albums",artists:"artists",genres:"genres",starred:"starred"};this._browserPush({type:t[e.cat],items:[],query:"",loading:!1})}else e.kind==="playlist"?this._browserPush({type:"playlist",id:e.id,name:e.name,items:[],query:"",loading:!1}):e.kind==="album"?this._browserPush({type:"album",id:e.id,name:e.name,items:[],query:"",loading:!1}):e.kind==="artist"?this._browserPush({type:"artist",id:e.id,name:e.name,items:[],query:"",loading:!1}):e.kind==="genre"?this._browserPush({type:"genre",id:e.id,name:e.name,items:[],query:"",loading:!1}):e.kind==="song"&&this._appendAndPlay(e)}_browserPlaySong(e){this._appendAndPlay(e)}_browserEnqueueSong(e){this._enqueueOnly(e)}_collLabel(e){switch(e.kind){case"playlist":return"\u6B4C\u5355";case"album":return"\u4E13\u8F91";case"artist":return"\u827A\u4EBA";case"genre":return"\u6D41\u6D3E";default:return"\u5217\u8868"}}async _browserPlayCollection(e){const t=this._ui.currentPeerId;if(!t||!e)return;let s=[];try{if(e.kind==="playlist")s=((await this._client.getPlaylistSongs(e.id))?.playlist?.entry||[]).map(r=>this._toSongItem(r));else if(e.kind==="album")s=((await this._client.getAlbum(e.id))?.album?.song||[]).map(r=>this._toSongItem(r));else if(e.kind==="artist"){const r=(await this._client.getArtist(e.id))?.artist?.album||[];for(const a of r){const l=await this._client.getAlbum(String(a.id));s.push(...(l?.album?.song||[]).map(o=>this._toSongItem(o)))}}else if(e.kind==="genre"){const r=(await this._client.getAlbumList2({type:"byGenre",genre:e.id,size:500}))?.albumList2?.album||[];for(const a of r){const l=await this._client.getAlbum(String(a.id));s.push(...(l?.album?.song||[]).map(o=>this._toSongItem(o)))}}}catch(r){c("browser play collection failed",r);return}if(!s.length){G("collection empty");return}const i=s.map(r=>w(r));this._client.playQueue(t,i,0).then(()=>G("playing",this._collLabel(e),e.name,s.length,"songs")).catch(r=>c("playCollection failed",r))}_renderBrowserItem(e){const t=e.coverArt?this._cover(e.coverArt):null;if(e.kind==="song")return u`
        <div class="bitem">
          <div class="bthumb">${t?u`<img src="${t}" alt="" />`:u`<span class="bnocover">♪</span>`}</div>
          <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" @click=${()=>this._browserItemClick(e)}>
            <div class="bt">${e.title}</div>
            <div class="ba">${e.artist||""}</div>
          </div>
          <button class="mini" title="播放(加入队列并播放)" @click=${()=>this._browserPlaySong(e)}>▶</button>
          <button class="mini" title="加入队列" @click=${()=>this._browserEnqueueSong(e)}>＋</button>
        </div>`;const s=e.kind==="album"?e.artist||"":e.kind==="genre"?`${e.albumCount||0} \u4E13\u8F91`:e.kind==="playlist"?`${e.songCount||0} \u9996`:"";return u`
      <div class="bitem">
        <div class="bthumb" style="cursor:pointer" title="播放整个${this._collLabel(e)}" @click=${()=>this._browserPlayCollection(e)}>
          ${t?u`<img src="${t}" alt="" />`:u`<span class="bnocover">♪</span>`}
        </div>
        <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" title="进入查看" @click=${()=>this._browserItemClick(e)}>
          <div class="bt">${e.name}</div>
          <div class="ba">${s}</div>
        </div>
        <button class="mini" title="进入查看" @click=${()=>this._browserItemClick(e)}>›</button>
      </div>`}_renderMediaBrowser(){const e=this._ui.browserStack,t=e[e.length-1];if(!t)return u``;const s=(t.query||"").trim().toLowerCase();let i=t.items||[];s&&(t.type==="playlists"||t.type==="genres"||t.type==="starred")&&(i=t.type==="starred"?i.filter(a=>(a.title||"").toLowerCase().includes(s)):i.filter(a=>(a.name||"").toLowerCase().includes(s)));const r=["playlists","albums","artists","genres","starred"].includes(t.type);return u`
      <div class="overlay" @click=${()=>{this._ui.showBrowser=!1,this.requestUpdate()}}>
        <div class="browser" @click=${a=>a.stopPropagation()}>
          <div class="br-head">
            <span class="br-title">媒体库</span>
            <button class="mini" @click=${()=>{this._ui.showBrowser=!1,this.requestUpdate()}}>关闭</button>
          </div>
          <div class="br-crumbs">
            ${e.map((a,l)=>u`
              <span class="crumb ${l===e.length-1?"cur":""}" @click=${()=>this._browserPopTo(l)}>${this._crumbName(a)}</span>
              ${l<e.length-1?u`<span class="crumb-sep">›</span>`:""}
            `)}
          </div>
          ${r?u`
            <div class="br-search">
              <input class="search-input" placeholder="搜索…" .value=${t.query}
                @input=${a=>{t.query=a.target.value}}
                @keydown=${a=>{a.key==="Enter"&&this._browserSearch()}} />
              <button class="mini" @click=${this._browserSearch}>搜索</button>
            </div>
          `:""}
          <div class="br-list">
            ${t.loading?u`<div class="empty">加载中…</div>`:""}
            ${!t.loading&&t.type==="root"?u`
              <div class="cat-grid">
                ${i.map(a=>u`<button class="cat" @click=${()=>this._browserItemClick(a)}>${a.name}</button>`)}
              </div>
            `:""}
            ${!t.loading&&t.type!=="root"?u`
              ${i.length===0?u`<div class="empty">无内容</div>`:""}
              ${i.map(a=>this._renderBrowserItem(a))}
            `:""}
          </div>
        </div>
      </div>
    `}static get styles(){return _e`
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
      .wrap { position: relative; z-index: 1; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
      .conn { font-size: 11px; padding: 2px 9px; border-radius: 10px; white-space: nowrap; }
      .conn.on { color: #9fe07c; background: rgba(107, 171, 69, 0.18); }
      .conn.off { color: rgba(255, 255, 255, 0.5); background: rgba(255, 255, 255, 0.08); }
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
      .vol-v { writing-mode: vertical-lr; direction: rtl; width: 6px; height: 130px; border-radius: 3px; }
      .seek, .vol-v { -webkit-appearance: none; appearance: none;
        background: rgba(255, 255, 255, 0.18); outline: none; cursor: pointer; }
      .seek::-webkit-slider-thumb, .vol-v::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
        width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid #f62c55;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); cursor: pointer; transition: transform 0.15s ease; }
      .seek:hover::-webkit-slider-thumb, .vol-v:hover::-webkit-slider-thumb { transform: scale(1.2); }
      .seek::-moz-range-track { height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.18); }
      .seek::-moz-range-progress { height: 6px; border-radius: 3px; background: #f62c55; }
      .vol-v::-moz-range-track { width: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.18); }
      .vol-v::-moz-range-progress { width: 6px; border-radius: 3px; background: #f62c55; }
      .seek::-moz-range-thumb, .vol-v::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%;
        background: #fff; border: 2px solid #f62c55; }
      .controls { display: flex; justify-content: center; align-items: center; gap: 10px; position: relative; }
      .ctl { border: none; background: transparent; color: rgba(255, 255, 255, 0.85); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        width: 42px; height: 42px; padding: 0; border-radius: 50%;
        transition: background 0.2s, box-shadow 0.2s, transform 0.12s, color 0.2s; }
      .ctl svg { display: block; }
      .ctl:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .ctl:active { transform: scale(0.92); }
      .ctl.play { width: 54px; height: 54px; background: #f62c55; color: #fff;
        box-shadow: 0 4px 16px rgba(246, 44, 85, 0.4); }
      .ctl.play:hover { background: #e63954; box-shadow: 0 6px 22px rgba(246, 44, 85, 0.55); transform: scale(1.06); }
      .ctl.play:active { transform: scale(0.94); }
      .ctl.like.on { color: #f62c55; }
      .ctl.vol-open { background: rgba(246, 44, 85, 0.16); color: #f62c55; }
      .volpop-backdrop { position: fixed; inset: 0; z-index: 15; background: transparent; }
      .volpop { position: absolute; bottom: calc(100% + 10px); right: 0; z-index: 20;
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        background: #1f1c2a; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px;
        padding: 12px 10px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); }
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
    `}}customElements.define("hass-musicflow-card",Ve),window.customCards=window.customCards||[],window.customCards.push({type:"hass-musicflow-card",name:"MusicFlow Remote Card",description:"MusicFlow \u670D\u52A1\u5668\u7684\u5916\u90E8\u63A7\u5236\u5668:\u5B9E\u65F6\u540C\u6B65\u64AD\u653E/\u961F\u5217/\u6B4C\u8BCD/\u6B4C\u5355/\u559C\u6B22\u3002"});
