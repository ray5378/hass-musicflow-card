var jt=Object.defineProperty;var zt=(r,e,t)=>e in r?jt(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var D=(r,e,t)=>zt(r,typeof e!="symbol"?e+"":e,t);var B=globalThis,j=B.ShadowRoot&&(B.ShadyCSS===void 0||B.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,K=Symbol(),pt=new WeakMap,V=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==K)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(j&&e===void 0){let s=t!==void 0&&t.length===1;s&&(e=pt.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&pt.set(t,e))}return e}toString(){return this.cssText}},dt=r=>new V(typeof r=="string"?r:r+"",void 0,K),Y=(r,...e)=>{let t=r.length===1?r[0]:e.reduce((s,i,o)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[o+1],r[0]);return new V(t,r,K)},ut=(r,e)=>{if(j)r.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let s=document.createElement("style"),i=B.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,r.appendChild(s)}},G=j?r=>r:r=>r instanceof CSSStyleSheet?(e=>{let t="";for(let s of e.cssRules)t+=s.cssText;return dt(t)})(r):r;var{is:Zt,defineProperty:Ft,getOwnPropertyDescriptor:qt,getOwnPropertyNames:Wt,getOwnPropertySymbols:Kt,getPrototypeOf:Yt}=Object,w=globalThis,_t=w.trustedTypes,Gt=_t?_t.emptyScript:"",J=w.reactiveElementPolyfillSupport,P=(r,e)=>r,X={toAttribute(r,e){switch(e){case Boolean:r=r?Gt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,e){let t=r;switch(e){case Boolean:t=r!==null;break;case Number:t=r===null?null:Number(r);break;case Object:case Array:try{t=JSON.parse(r)}catch{t=null}}return t}},$t=(r,e)=>!Zt(r,e),mt={attribute:!0,type:String,converter:X,reflect:!1,useDefault:!1,hasChanged:$t},ft,vt;(ft=Symbol.metadata)!=null||(Symbol.metadata=Symbol("metadata")),(vt=w.litPropertyMetadata)!=null||(w.litPropertyMetadata=new WeakMap);var g=class extends HTMLElement{static addInitializer(e){var t;this._$Ei(),((t=this.l)!=null?t:this.l=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=mt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&Ft(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){var n;let{get:i,set:o}=(n=qt(this.prototype,e))!=null?n:{get(){return this[t]},set(l){this[t]=l}};return{get:i,set(l){let a=i==null?void 0:i.call(this);o==null||o.call(this,l),this.requestUpdate(e,a,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){var t;return(t=this.elementProperties.get(e))!=null?t:mt}static _$Ei(){if(this.hasOwnProperty(P("elementProperties")))return;let e=Yt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(P("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(P("properties"))){let t=this.properties,s=[...Wt(t),...Kt(t)];for(let i of s)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[t,s]of this.elementProperties){let i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let i of s)t.unshift(G(i))}else e!==void 0&&t.push(G(e));return t}static _$Eu(e,t){let s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach(t=>t(this))}addController(e){var t,s;((t=this._$EO)!=null?t:this._$EO=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&((s=e.hostConnected)==null||s.call(e))}removeController(e){var t;(t=this._$EO)==null||t.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){var t;let e=(t=this.shadowRoot)!=null?t:this.attachShadow(this.constructor.shadowRootOptions);return ut(e,this.constructor.elementStyles),e}connectedCallback(){var e,t;(e=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$EO)==null||t.forEach(s=>{var i;return(i=s.hostConnected)==null?void 0:i.call(s)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach(t=>{var s;return(s=t.hostDisconnected)==null?void 0:s.call(t)})}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){var o;let s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){let n=(((o=s.converter)==null?void 0:o.toAttribute)!==void 0?s.converter:X).toAttribute(t,s.type);this._$Em=e,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(e,t){var o,n,l;let s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let a=s.getPropertyOptions(i),h=typeof a.converter=="function"?{fromAttribute:a.converter}:((o=a.converter)==null?void 0:o.fromAttribute)!==void 0?a.converter:X;this._$Em=i;let c=h.fromAttribute(t,a.type);this[i]=(l=c!=null?c:(n=this._$Ej)==null?void 0:n.get(i))!=null?l:c,this._$Em=null}}requestUpdate(e,t,s,i=!1,o){var n,l;if(e!==void 0){let a=this.constructor;if(i===!1&&(o=this[e]),s!=null||(s=a.getPropertyOptions(e)),!(((n=s.hasChanged)!=null?n:$t)(o,t)||s.useDefault&&s.reflect&&o===((l=this._$Ej)==null?void 0:l.get(e))&&!this.hasAttribute(a._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:o},n){var l,a,h;s&&!((l=this._$Ej)!=null?l:this._$Ej=new Map).has(e)&&(this._$Ej.set(e,(a=n!=null?n:t)!=null?a:this[e]),o!==!0||n!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&((h=this._$Eq)!=null?h:this._$Eq=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var s,i;if(!this.isUpdatePending)return;if(!this.hasUpdated){if((s=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[n,l]of this._$Ep)this[n]=l;this._$Ep=void 0}let o=this.constructor.elementProperties;if(o.size>0)for(let[n,l]of o){let{wrapped:a}=l,h=this[n];a!==!0||this._$AL.has(n)||h===void 0||this.C(n,void 0,l,h)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),(i=this._$EO)==null||i.forEach(o=>{var n;return(n=o.hostUpdate)==null?void 0:n.call(o)}),this.update(t)):this._$EM()}catch(o){throw e=!1,this._$EM(),o}e&&this._$AE(t)}willUpdate(e){}_$AE(e){var t;(t=this._$EO)==null||t.forEach(s=>{var i;return(i=s.hostUpdated)==null?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(t=>this._$ET(t,this[t]))),this._$EM()}updated(e){}firstUpdated(e){}},yt;g.elementStyles=[],g.shadowRootOptions={mode:"open"},g[P("elementProperties")]=new Map,g[P("finalized")]=new Map,J==null||J({ReactiveElement:g}),((yt=w.reactiveElementVersions)!=null?yt:w.reactiveElementVersions=[]).push("2.1.2");var T=globalThis,gt=r=>r,z=T.trustedTypes,bt=z?z.createPolicy("lit-html",{createHTML:r=>r}):void 0,St="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,Mt="?"+E,Jt=`<${Mt}>`,S=document,U=()=>S.createComment(""),N=r=>r===null||typeof r!="object"&&typeof r!="function",nt=Array.isArray,Xt=r=>nt(r)||typeof(r==null?void 0:r[Symbol.iterator])=="function",Q=`[ 	
\f\r]`,O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,At=/-->/g,wt=/>/g,x=RegExp(`>|${Q}(?:([^\\s"'>=/]+)(${Q}*=${Q}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Et=/'/g,kt=/"/g,Lt=/^(?:script|style|textarea|title)$/i,at=r=>(e,...t)=>({_$litType$:r,strings:e,values:t}),m=at(1),ce=at(2),he=at(3),b=Symbol.for("lit-noChange"),_=Symbol.for("lit-nothing"),xt=new WeakMap,C=S.createTreeWalker(S,129);function Ht(r,e){if(!nt(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return bt!==void 0?bt.createHTML(e):e}var Qt=(r,e)=>{let t=r.length-1,s=[],i,o=e===2?"<svg>":e===3?"<math>":"",n=O;for(let l=0;l<t;l++){let a=r[l],h,c,p=-1,v=0;for(;v<a.length&&(n.lastIndex=v,c=n.exec(a),c!==null);)v=n.lastIndex,n===O?c[1]==="!--"?n=At:c[1]!==void 0?n=wt:c[2]!==void 0?(Lt.test(c[2])&&(i=RegExp("</"+c[2],"g")),n=x):c[3]!==void 0&&(n=x):n===x?c[0]===">"?(n=i!=null?i:O,p=-1):c[1]===void 0?p=-2:(p=n.lastIndex-c[2].length,h=c[1],n=c[3]===void 0?x:c[3]==='"'?kt:Et):n===kt||n===Et?n=x:n===At||n===wt?n=O:(n=x,i=void 0);let $=n===x&&r[l+1].startsWith("/>")?" ":"";o+=n===O?a+Jt:p>=0?(s.push(h),a.slice(0,p)+St+a.slice(p)+E+$):a+E+(p===-2?l:$)}return[Ht(r,o+(r[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]},R=class r{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let o=0,n=0,l=e.length-1,a=this.parts,[h,c]=Qt(e,t);if(this.el=r.createElement(h,s),C.currentNode=this.el.content,t===2||t===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(i=C.nextNode())!==null&&a.length<l;){if(i.nodeType===1){if(i.hasAttributes())for(let p of i.getAttributeNames())if(p.endsWith(St)){let v=c[n++],$=i.getAttribute(p).split(E),k=/([.?@])?(.*)/.exec(v);a.push({type:1,index:o,name:k[2],strings:$,ctor:k[1]==="."?st:k[1]==="?"?it:k[1]==="@"?rt:H}),i.removeAttribute(p)}else p.startsWith(E)&&(a.push({type:6,index:o}),i.removeAttribute(p));if(Lt.test(i.tagName)){let p=i.textContent.split(E),v=p.length-1;if(v>0){i.textContent=z?z.emptyScript:"";for(let $=0;$<v;$++)i.append(p[$],U()),C.nextNode(),a.push({type:2,index:++o});i.append(p[v],U())}}}else if(i.nodeType===8)if(i.data===Mt)a.push({type:2,index:o});else{let p=-1;for(;(p=i.data.indexOf(E,p+1))!==-1;)a.push({type:7,index:o}),p+=E.length-1}o++}}static createElement(e,t){let s=S.createElement("template");return s.innerHTML=e,s}};function L(r,e,t=r,s){var n,l,a;if(e===b)return e;let i=s!==void 0?(n=t._$Co)==null?void 0:n[s]:t._$Cl,o=N(e)?void 0:e._$litDirective$;return(i==null?void 0:i.constructor)!==o&&((l=i==null?void 0:i._$AO)==null||l.call(i,!1),o===void 0?i=void 0:(i=new o(r),i._$AT(r,t,s)),s!==void 0?((a=t._$Co)!=null?a:t._$Co=[])[s]=i:t._$Cl=i),i!==void 0&&(e=L(r,i._$AS(r,e.values),i,s)),e}var et=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){var h;let{el:{content:t},parts:s}=this._$AD,i=((h=e==null?void 0:e.creationScope)!=null?h:S).importNode(t,!0);C.currentNode=i;let o=C.nextNode(),n=0,l=0,a=s[0];for(;a!==void 0;){if(n===a.index){let c;a.type===2?c=new I(o,o.nextSibling,this,e):a.type===1?c=new a.ctor(o,a.name,a.strings,this,e):a.type===6&&(c=new ot(o,this,e)),this._$AV.push(c),a=s[++l]}n!==(a==null?void 0:a.index)&&(o=C.nextNode(),n++)}return C.currentNode=S,i}p(e){let t=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}},I=class r{get _$AU(){var e,t;return(t=(e=this._$AM)==null?void 0:e._$AU)!=null?t:this._$Cv}constructor(e,t,s,i){var o;this.type=2,this._$AH=_,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=(o=i==null?void 0:i.isConnected)!=null?o:!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=L(this,e,t),N(e)?e===_||e==null||e===""?(this._$AH!==_&&this._$AR(),this._$AH=_):e!==this._$AH&&e!==b&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Xt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==_&&N(this._$AH)?this._$AA.nextSibling.data=e:this.T(S.createTextNode(e)),this._$AH=e}$(e){var o;let{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=R.createElement(Ht(s.h,s.h[0]),this.options)),s);if(((o=this._$AH)==null?void 0:o._$AD)===i)this._$AH.p(t);else{let n=new et(i,this),l=n.u(this.options);n.p(t),this.T(l),this._$AH=n}}_$AC(e){let t=xt.get(e.strings);return t===void 0&&xt.set(e.strings,t=new R(e)),t}k(e){nt(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,s,i=0;for(let o of e)i===t.length?t.push(s=new r(this.O(U()),this.O(U()),this,this.options)):s=t[i],s._$AI(o),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){var s;for((s=this._$AP)==null?void 0:s.call(this,!1,!0,t);e!==this._$AB;){let i=gt(e).nextSibling;gt(e).remove(),e=i}}setConnected(e){var t;this._$AM===void 0&&(this._$Cv=e,(t=this._$AP)==null||t.call(this,e))}},H=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,o){this.type=1,this._$AH=_,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=_}_$AI(e,t=this,s,i){let o=this.strings,n=!1;if(o===void 0)e=L(this,e,t,0),n=!N(e)||e!==this._$AH&&e!==b,n&&(this._$AH=e);else{let l=e,a,h;for(e=o[0],a=0;a<o.length-1;a++)h=L(this,l[s+a],t,a),h===b&&(h=this._$AH[a]),n||(n=!N(h)||h!==this._$AH[a]),h===_?e=_:e!==_&&(e+=(h!=null?h:"")+o[a+1]),this._$AH[a]=h}n&&!i&&this.j(e)}j(e){e===_?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e!=null?e:"")}},st=class extends H{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===_?void 0:e}},it=class extends H{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==_)}},rt=class extends H{constructor(e,t,s,i,o){super(e,t,s,i,o),this.type=5}_$AI(e,t=this){var n;if((e=(n=L(this,e,t,0))!=null?n:_)===b)return;let s=this._$AH,i=e===_&&s!==_||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,o=e!==_&&(s===_||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t,s;typeof this._$AH=="function"?this._$AH.call((s=(t=this.options)==null?void 0:t.host)!=null?s:this.element,e):this._$AH.handleEvent(e)}},ot=class{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){L(this,e)}};var tt=T.litHtmlPolyfillSupport,Ct;tt==null||tt(R,I),((Ct=T.litHtmlVersions)!=null?Ct:T.litHtmlVersions=[]).push("3.3.3");var Vt=(r,e,t)=>{var o,n;let s=(o=t==null?void 0:t.renderBefore)!=null?o:e,i=s._$litPart$;if(i===void 0){let l=(n=t==null?void 0:t.renderBefore)!=null?n:null;s._$litPart$=i=new I(e.insertBefore(U(),l),l,void 0,t!=null?t:{})}return i._$AI(r),i};var M=globalThis,A=class extends g{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,s;let e=super.createRenderRoot();return(s=(t=this.renderOptions).renderBefore)!=null||(t.renderBefore=e.firstChild),e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Vt(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return b}},Pt;A._$litElement$=!0,A.finalized=!0,(Pt=M.litElementHydrateSupport)==null||Pt.call(M,{LitElement:A});var lt=M.litElementPolyfillSupport;lt==null||lt({LitElement:A});var Ot;((Ot=M.litElementVersions)!=null?Ot:M.litElementVersions=[]).push("4.2.2");var Tt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Ut=r=>(...e)=>({_$litDirective$:r,values:e}),Z=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,s){this._$Ct=e,this._$AM=t,this._$Ci=s}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var Nt=Ut(class extends Z{constructor(r){var e;if(super(r),r.type!==Tt.ATTRIBUTE||r.name!=="class"||((e=r.strings)==null?void 0:e.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(r){return" "+Object.keys(r).filter(e=>r[e]).join(" ")+" "}update(r,[e]){var s,i;if(this.st===void 0){this.st=new Set,r.strings!==void 0&&(this.nt=new Set(r.strings.join(" ").split(/\s/).filter(o=>o!=="")));for(let o in e)e[o]&&!((s=this.nt)!=null&&s.has(o))&&this.st.add(o);return this.render(e)}let t=r.element.classList;for(let o of this.st)o in e||(t.remove(o),this.st.delete(o));for(let o in e){let n=!!e[o];n===this.st.has(o)||(i=this.nt)!=null&&i.has(o)||(n?(t.add(o),this.st.add(o)):(t.remove(o),this.st.delete(o)))}return b}});var te={play:"M8,5.14V19.14L19,12.14L8,5.14Z",pause:"M14,19H18V5H14M6,19H10V5H6V19Z",play_pause:"M3,5V19L11,12M13,19H16V5H13M18,5V19H21V5",skip_previous:"M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z",skip_next:"M16,18H18V6H16M6,18L14.5,12L6,6V18Z",power_standby:"M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19C8.14,19 5,15.88 5,12C5,9.91 5.95,7.91 7.58,6.58L6.17,5.17C2.38,8.39 1.92,14.07 5.14,17.86C8.36,21.64 14.04,22.1 17.83,18.88C19.85,17.17 21,14.65 21,12C21,9.37 19.84,6.87 17.83,5.17Z",power_off:"M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12A9,9 0 0,0 12,3M12,19A7,7 0 0,1 5,12A7,7 0 0,1 12,5A7,7 0 0,1 19,12A7,7 0 0,1 12,19Z",power_on:"M11,3H13V21H11V3Z",volume_high:"M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z",volume_off:"M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z",volume_minus:"M3,9H7L12,4V20L7,15H3V9M14,11H22V13H14V11Z",volume_plus:"M3,9H7L12,4V20L7,15H3V9M14,11H17V8H19V11H22V13H19V16H17V13H14V11Z",repeat:"M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",repeat_once:"M13,15V9H12L10,10V11H11.5V15M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",shuffle:"M17,3L22.25,7.5L17,12L22.25,16.5L17,21V18H14.26L11.44,15.18L13.56,13.06L15.5,15H17V12L17,9H15.5L6.5,18H2V15H5.26L14.26,6H17V3M2,6H6.5L9.32,8.82L7.2,10.94L5.26,9H2V6Z",arrow_right:"M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z",headphones:"M12,1C7,1 3,5 3,10V17A3,3 0 0,0 6,20H9V12H5V10A7,7 0 0,1 12,3A7,7 0 0,1 19,10V12H15V20H18A3,3 0 0,0 21,17V10C21,5 16.97,1 12,1Z",heart:"M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z",heart_outline:"M12.1,18.55L12,18.65L11.89,18.55C7.14,14.24 4,11.39 4,8.5C4,6.5 5.5,5 7.5,5C9.04,5 10.54,6 11.07,7.36H12.93C13.46,6 14.96,5 16.5,5C18.5,5 20,6.5 20,8.5C20,11.39 16.86,14.24 12.1,18.55M16.5,3C14.76,3 13.09,3.81 12,5.08C10.91,3.81 9.24,3 7.5,3C4.42,3 2,5.41 2,8.5C2,12.27 5.4,15.36 10.55,20.03L12,21.35L13.45,20.03C18.6,15.36 22,12.27 22,8.5C22,5.41 19.58,3 16.5,3Z",playlist_music:"M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z",check:"M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",cast:"M1,10V12A9,9 0 0,1 10,21H12C12,14.92 7.07,10 1,10M1,14V16A5,5 0 0,1 6,21H8A7,7 0 0,0 1,14M1,18V21H4A3,3 0 0,0 1,18M21,3H3C1.89,3 1,3.89 1,5V8H3V5H21V19H14V21H21A2,2 0 0,0 23,19V5C23,3.89 22.1,3 21,3Z",music_note:"M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z",stop:"M18,18H6V6H18V18Z"},f=(r,e=22)=>m`
  <svg width="${e}" height="${e}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="${te[r]}" fill="currentColor" />
  </svg>
`,Rt="musicflow",d={PAUSE:1,SEEK:2,VOLUME_SET:4,VOLUME_MUTE:8,PREVIOUS_TRACK:16,SKIP:32,NEXT_TRACK:64,TURN_OFF:128,TURN_ON:256,PLAY_MEDIA:512,VOLUME_STEP:1024,SELECT_SOURCE:2048,STOP:4096,CLEAR_PLAYLIST:8192,PLAY:16384,SHUFFLE_SET:32768,REPEAT_SET:65536,GROUPING:131072,MEDIA_ENQUEUE:524288,MEDIA_ANNOUNCE:1048576,BROWSE_MEDIA:2097152,SEARCH_MEDIA:4194304},u=(r,e)=>{var t;return!!(((t=r==null?void 0:r.attributes)==null?void 0:t.supported_features)&e)},F=r=>{let e=r==null?void 0:r.state;return e==="playing"||e==="paused"||e==="on"},It="unavailable";function ee(r,e,t=!1){let s;return function(...i){let o=this,n=()=>{s=void 0,t||r.apply(o,i)},l=t&&!s;clearTimeout(s),s=setTimeout(n,e),l&&r.apply(o,i)}}var q=class extends A{constructor(){super();D(this,"_closePickerOnOutsideClick",t=>{if(!this._showPlayerPicker)return;(t.composedPath?t.composedPath():[]).includes(this)||(this._showPlayerPicker=!1)});this._activeEntity="",this._showPlayerPicker=!1,this._narrow=!1,this._veryNarrow=!1,this._seekPos=null,this._seeking=!1,this._tick=0}static get properties(){return{hass:{type:Object},config:{type:Object},_activeEntity:{type:String},_showPlayerPicker:{type:Boolean},_narrow:{type:Boolean},_veryNarrow:{type:Boolean},_seekPos:{type:Number},_seeking:{type:Boolean},_tick:{type:Number}}}connectedCallback(){super.connectedCallback(),this._ticker=setInterval(()=>this._tick++,1e3),document.addEventListener("click",this._closePickerOnOutsideClick,!0),this._attachObserver()}disconnectedCallback(){var t;super.disconnectedCallback(),this._ticker&&clearInterval(this._ticker),document.removeEventListener("click",this._closePickerOnOutsideClick,!0),(t=this._resizeObserver)==null||t.unobserve(this)}setConfig(t){if(!t||!t.entity)throw new Error("\u8BF7\u914D\u7F6E MusicFlow \u64AD\u653E\u5668\u5B9E\u4F53 (entity)");this.config={show_artwork:!0,...t},(!this._activeEntity||!this._isMusicFlowEntity(t.entity))&&(this._activeEntity=t.entity)}get _stateObj(){var t,s;return(s=(t=this.hass)==null?void 0:t.states)==null?void 0:s[this._activeEntity]}get _attr(){var t;return((t=this._stateObj)==null?void 0:t.attributes)||{}}get _state(){var t;return(t=this._stateObj)==null?void 0:t.state}get _playing(){return this._state==="playing"}get _on(){return this._state!=="off"&&this._state!=="unavailable"}get _position(){if(this._seeking&&this._seekPos!=null)return this._seekPos;let t=this._attr,s=Number(t.media_position||0);if(this._playing&&t.media_position_updated_at){let i=Date.parse(t.media_position_updated_at);if(isFinite(i)){let o=(Date.now()-i)/1e3,n=Number(t.media_duration||0);return n>0?Math.max(0,Math.min(s+o,n)):s+o}}return s}get _duration(){return Number(this._attr.media_duration||0)}get _volume(){return Number(this._attr.volume_level||0)}get _liked(){return!!this._attr.liked}get _peers(){var s,i;if(!((s=this.hass)!=null&&s.states))return[];let t=[];for(let[o,n]of Object.entries(this.hass.states)){if(!o.startsWith("media_player."))continue;let l=(i=this.hass.entities)==null?void 0:i[o];!l||l.platform!==Rt||t.push({entityId:o,state:n,available:n.state!=="unavailable"})}return t}_isMusicFlowEntity(t){var s,i,o;return((o=(i=(s=this.hass)==null?void 0:s.entities)==null?void 0:i[t])==null?void 0:o.platform)===Rt}_peerLabel(t){var s;return((s=t.state.attributes)==null?void 0:s.friendly_name)||t.entityId}_peerMeta(t){var a;let s=t.state.attributes||{},i=(a=s.queue_size)!=null?a:0,o=s.queue_position,n=s.play_mode&&s.queue_size>0&&o!=null&&o>=0,l=s.media_title;return n&&l?`${i} \u9996 \xB7 ${l}`:n?`${i} \u9996 \xB7 \u64AD\u653E\u4E2D`:i>0?`${i} \u9996 \xB7 \u7A7A\u95F2`:"\u7A7A\u95F2"}_fmt(t){if(!isFinite(t)||t<0)return"0:00";let s=Math.floor(t/60),i=Math.floor(t%60);return`${s}:${String(i).padStart(2,"0")}`}_mediaDescription(){let t=this._attr,s=t.media_title,i=t.media_artist||"",o=t.media_album_name||"",n=[];return i&&n.push(i),o&&n.push(o),s?`${s}${n.length?` \xB7 ${n.join(" \xB7 ")}`:""}`:""}_computeControlButton(){let t=this._state;return t==="on"?{icon:"play_pause",action:"media_play_pause"}:t!=="playing"?{icon:"play",action:"media_play"}:u(this._stateObj,d.PAUSE)?{icon:"pause",action:"media_pause"}:{icon:"stop",action:"media_stop"}}_service(t,s,i={}){this.hass.callService(t,s,i,{entity_id:this._activeEntity})}_turnOn(){this._service("media_player","turn_on")}_turnOff(){this._service("media_player","turn_off")}_playPauseStop(){let t=this._state!=="playing"?"media_play":u(this._stateObj,d.PAUSE)?"media_pause":"media_stop";this._service("media_player",t)}_play(){this._service("media_player","media_play")}_pause(){this._service("media_player","media_pause")}_stop(){this._service("media_player","media_stop")}_previousTrack(){this._service("media_player","media_previous_track")}_nextTrack(){this._service("media_player","media_next_track")}_toggleMute(){this._service("media_player","volume_mute",{is_volume_muted:!this._attr.is_volume_muted})}_volumeDown(){this._service("media_player","volume_down")}_volumeUp(){this._service("media_player","volume_up")}_selectedVolumeChanged(t){this._service("media_player","volume_set",{volume_level:Number(t.target.value)})}_toggleLike(){this._service("musicflow","like_track")}_cyclePlayMode(){let t=["order","all","one","shuffle"],s=this._attr.play_mode||"order",i=t[(t.indexOf(s)+1)%t.length];this._service("musicflow","set_play_mode",{play_mode:i})}_playModeIcon(t){return t==="shuffle"?"shuffle":t==="one"?"repeat_once":t==="all"?"repeat":"arrow_right"}_playModeLabel(t){return t==="shuffle"?"\u968F\u673A":t==="one"?"\u5355\u66F2\u5FAA\u73AF":t==="all"?"\u5217\u8868\u5FAA\u73AF":"\u987A\u5E8F"}_seekStart(t){this._seeking=!0,this._seekPos=Number(t.target.value)}_seekInput(t){this._seekPos=Number(t.target.value)}_seekEnd(t){this._service("media_player","media_seek",{seek_position:Number(t.target.value)}),this._seekPos=null,this._seeking=!1}_switchPeer(t){if(!t||t===this._activeEntity){this._showPlayerPicker=!1;return}this._showPlayerPicker=!1,this._activeEntity=t,this.requestUpdate()}_openMediaBrowser(){this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:this._activeEntity},bubbles:!0,composed:!0}))}_attachObserver(){this._resizeObserver||(this._resizeObserver=new ResizeObserver(ee(()=>this._measureCard(),250,!1))),this._resizeObserver.observe(this)}_measureCard(){this.isConnected&&(this._narrow=(this.clientWidth||0)<300,this._veryNarrow=(this.clientWidth||0)<225)}render(){var ct,ht;if(!this.hass||!this._stateObj)return m`<ha-card class="card"><div class="title">未找到实体 ${((ct=this.config)==null?void 0:ct.entity)||""}</div></ha-card>`;let t=this._stateObj,s=this._state,i=t.attributes.assumed_state===!0,o=this._computeControlButton(),n=this._attr,l=n.play_mode||"order",a=l!=="order",h=this._position,c=this._duration,p=this._peers,v=this._peerLabel({entityId:this._activeEntity,state:t}),$=(ht=p.find(y=>y.entityId===this._activeEntity))==null?void 0:ht.available,k=this.config.show_artwork?n.entity_picture:null,ie=this._mediaDescription()||this._fmtState(),Dt=(u(t,d.VOLUME_STEP)||u(t,d.VOLUME_SET))&&F(t),Bt=m`
      ${!this._narrow&&(s==="playing"||i)&&u(t,d.PREVIOUS_TRACK)?m`<button class="action" title="上一首" @click=${this._previousTrack}>${f("skip_previous",24)}</button>`:""}
      ${!i&&(s==="playing"&&(u(t,d.PAUSE)||u(t,d.STOP))||(s==="paused"||s==="idle")&&u(t,d.PLAY)||s==="on"&&(u(t,d.PLAY)||u(t,d.PAUSE)))?m`<button class="action" title=${this._label(o.action)} @click=${this._playPauseStop}>${f(o.icon,30)}</button>`:""}
      ${i&&u(t,d.PLAY)?m`<button class="action" title="播放" @click=${this._play}>${f("play",24)}</button>`:""}
      ${i&&u(t,d.PAUSE)?m`<button class="action" title="暂停" @click=${this._pause}>${f("pause",24)}</button>`:""}
      ${i&&u(t,d.STOP)&&!u(t,d.VOLUME_SET)?m`<button class="action" title="停止" @click=${this._stop}>${f("stop",24)}</button>`:""}
      ${(s==="playing"||i&&!u(t,d.VOLUME_SET))&&u(t,d.NEXT_TRACK)?m`<button class="action" title="下一首" @click=${this._nextTrack}>${f("skip_next",24)}</button>`:""}
    `;return m`
      <ha-card class="card">
        <!-- 顶部:cast 图标 + 设备名 -->
        <div class="top">
          <span class="icon-badge">${f("cast",18)}</span>
          <span class="device-name" title="${v}">${v}</span>
        </div>

        <!-- 标题 / 艺术家 -->
        <div class="title-block">
          <div class="title">${n.media_title||(this._on?"\u672A\u5728\u64AD\u653E":"\u5DF2\u5173\u95ED")}</div>
          <div class="secondary">${n.media_artist||n.media_album_name||this._fmtState()}</div>
        </div>

        <!-- ❤ 喜欢(始终可点) -->
        <div class="actions">
          <button class="action ${this._liked?"on":""}" title="喜欢 / 取消喜欢" @click=${this._toggleLike}>
            ${f(this._liked?"heart":"heart_outline",22)}
          </button>
        </div>

        <!-- 控制行:电源 + 播放按钮组 + 播放模式 + 切换播放器 -->
        <div class="controls">
          ${u(t,d.TURN_ON)&&(!F(t)||i)&&s!==It?m`<button class="action" title="开启" @click=${this._turnOn}>${f(i?"power_on":"power_standby",22)}</button>`:""}
          ${!u(t,d.VOLUME_SET)&&!u(t,d.VOLUME_STEP)&&(F(t)||i||!u(t,d.TURN_ON)||s===It)?Bt:""}
          ${u(t,d.TURN_OFF)&&(F(t)||i)?m`<button class="action" title="关闭" @click=${this._turnOff}>${f(i?"power_off":"power_standby",22)}</button>`:""}
          <!-- MusicFlow 增强:播放模式单按钮(循环切换) -->
          <button class="action ${a?"on":""}" title="播放模式:${this._playModeLabel(l)} (点击循环切换)" @click=${this._cyclePlayMode}>
            ${f(this._playModeIcon(l),22)}
          </button>
          <!-- MusicFlow 增强:切换播放器(耳机) -->
          <span class="picker-wrap">
            <button class="picker-toggle ${$?"is-current":""}" @click=${y=>{y.stopPropagation(),this._showPlayerPicker=!this._showPlayerPicker}} title="切换播放器">
              ${f("headphones",20)}
            </button>
            ${this._showPlayerPicker?m`
              <div class="picker" @click=${y=>y.stopPropagation()}>
                ${p.length===0?m`<div class="picker-item-meta">没有 MusicFlow 播放器</div>`:p.map(y=>m`
                      <div class="picker-item ${Nt({active:y.entityId===this._activeEntity,offline:!y.available})}" @click=${()=>this._switchPeer(y.entityId)}>
                        <span class="picker-item-icon">${f("headphones",18)}</span>
                        <div class="picker-item-info">
                          <div class="picker-item-name">${this._peerLabel(y)}</div>
                          <div class="picker-item-meta">${this._peerMeta(y)}</div>
                        </div>
                        ${y.entityId===this._activeEntity?f("check",18):_}
                      </div>`)}
              </div>`:_}
          </span>
        </div>

        <!-- 大封面(右列满铺) + 媒体库按钮(右下角) -->
        <div class="art">
          ${k?m`<img src="${k}" alt="" />`:f("music_note",!1,64)}
          <button class="art-browse" title="浏览媒体库" @click=${this._openMediaBrowser}>${f("playlist_music",18)}</button>
        </div>

        <!-- 音量(右列底部,官方布局) -->
        <div class="volume-bar">
          ${Dt?m`
            ${u(t,d.VOLUME_MUTE)?m`<button class="action ${n.is_volume_muted?"on":""}" title="静音" @click=${this._toggleMute}>${f(n.is_volume_muted?"volume_off":"volume_high",20)}</button>`:""}
            ${!this._veryNarrow&&u(t,d.VOLUME_SET)?m`<input type="range" min="0" max="1" step="0.01" value=${this._volume} @change=${this._selectedVolumeChanged} />`:!this._veryNarrow&&u(t,d.VOLUME_STEP)?m`<button class="action" title="音量-" @click=${this._volumeDown}>${f("volume_minus",20)}</button>
                       <button class="action" title="音量+" @click=${this._volumeUp}>${f("volume_plus",20)}</button>`:""}
          `:""}
        </div>

        <!-- 进度条(底部跨整张,HA 插值实时更新) -->
        <div class="progress-bar">
          <span class="time">${this._fmt(h)}</span>
          <input type="range" min="0" max=${c||100} step="1" value=${Math.min(h,c||100)}
                 @pointerdown=${this._seekStart} @input=${this._seekInput} @change=${this._seekEnd}
                 ?disabled=${!c} />
          <span class="time">${this._fmt(c)}</span>
        </div>
      </ha-card>
    `}_label(t){return{media_play:"\u64AD\u653E",media_pause:"\u6682\u505C",media_stop:"\u505C\u6B62",media_play_pause:"\u64AD\u653E/\u6682\u505C"}[t]||t}_fmtState(){let t=this._state;return{playing:"\u64AD\u653E\u4E2D",paused:"\u5DF2\u6682\u505C",idle:"\u7A7A\u95F2",off:"\u5DF2\u5173\u95ED",unavailable:"\u4E0D\u53EF\u7528",on:"\u5DF2\u5F00\u542F"}[t]||t||""}};D(q,"styles",Y`
    :host {
      display: block;
      font-family: var(--primary-font-family, inherit);
      color: var(--primary-text-color);
    }
    .card {
      background: var(--ha-card-background, var(--card-background-color, #fff));
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, none);
      padding: 12px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto auto auto auto auto auto;
      column-gap: 12px;
      row-gap: 8px;
      align-items: start;
    }

    .top {
      grid-column: 1;
      grid-row: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .icon-badge {
      flex-shrink: 0;
      color: var(--primary-color);
      display: inline-flex;
      align-items: center;
    }
    .device-name {
      flex: 1;
      min-width: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .title-block {
      grid-column: 1;
      grid-row: 2;
      min-width: 0;
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .secondary {
      font-size: 13px;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Controls row (official entity-row logic) */
    .controls {
      grid-column: 1;
      grid-row: 4;
      display: flex;
      align-items: center;
      gap: 2px;
      white-space: nowrap;
      direction: ltr;
      flex-wrap: wrap;
    }
    .action {
      background: none;
      border: none;
      color: var(--secondary-text-color);
      cursor: pointer;
      padding: 6px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .action:hover {
      color: var(--primary-color);
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .action.on { color: var(--primary-color); }
    .action:disabled { opacity: 0.35; cursor: default; }

    /* Favorite button row */
    .actions {
      grid-column: 1;
      grid-row: 3;
    }

    /* Full-bleed artwork on the right column */
    .art {
      grid-column: 2;
      grid-row: 1 / 7;
      min-height: 220px;
      border-radius: 10px;
      background: var(--secondary-background-color, #eee);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--disabled-text-color);
      overflow: hidden;
      position: relative;
    }
    .art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .art-browse {
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.45);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(2px);
    }
    .art-browse:hover { background: rgba(0, 0, 0, 0.65); }

    /* Volume (official layout: mute + slider) */
    .volume-bar {
      grid-column: 2;
      grid-row: 7;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .volume-bar input[type="range"] {
      flex: 1;
      min-width: 0;
      accent-color: var(--primary-color);
    }

    /* Progress bar - bottom of the card, full width */
    .progress-bar {
      grid-column: 1 / -1;
      grid-row: 7;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .progress-bar .time {
      font-size: 11px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
      min-width: 32px;
      text-align: center;
    }
    .progress-bar input[type="range"] {
      flex: 1;
      min-width: 0;
      accent-color: var(--primary-color);
    }

    /* Player switcher dropdown */
    .picker-wrap { position: relative; }
    .picker-toggle {
      background: none;
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      color: var(--secondary-text-color);
      border-radius: 999px;
      padding: 2px 6px;
      cursor: pointer;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .picker-toggle.is-current {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
    .picker-toggle:hover {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
    .picker {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: var(--ha-card-background, #fff);
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      padding: 4px;
      min-width: 220px;
      max-width: 280px;
      max-height: 280px;
      overflow-y: auto;
      z-index: 9;
    }
    .picker-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }
    .picker-item:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .picker-item.active {
      color: var(--primary-color);
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .picker-item.offline { opacity: 0.55; }
    .picker-item-icon {
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }
    .picker-item-info { flex: 1; min-width: 0; }
    .picker-item-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .picker-item-meta {
      font-size: 11px;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `);customElements.define("musicflow-player-card",q);var se=[{name:"entity",required:!0,selector:{entity:{domain:"media_player"}}},{name:"show_artwork",selector:{boolean:{}},default:!0}],W=class extends A{setConfig(e){this.config=e}render(){return!this.hass||!this.config?_:m`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${se}
        .computeLabel=${e=>{var t;return(t=e.label)!=null?t:e.name}}
        @value-changed=${this._onChange}
      ></ha-form>
    `}_onChange(e){this.dispatchEvent(new CustomEvent("config-changed",{detail:{value:e.detail.value},bubbles:!0,composed:!0}))}};D(W,"properties",{hass:{type:Object},config:{type:Object}});customElements.define("musicflow-player-card-editor",W);window.customCards=window.customCards||[];window.customCards.push({type:"musicflow-player-card",name:"MusicFlow Player",description:"MusicFlow media player card - a faithful replica of the HA native media_player controls with MusicFlow enhancements: favorite, browse media library, switch between MusicFlow players. Requires MusicFlow integration 1.2.6+.",preview:!0});
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/class-map.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
