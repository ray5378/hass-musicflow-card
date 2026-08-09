var Nt=Object.defineProperty;var Ut=(o,t,e)=>t in o?Nt(o,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[t]=e;var R=(o,t,e)=>Ut(o,typeof t!="symbol"?t+"":t,e);var V=globalThis,j=V.ShadowRoot&&(V.ShadyCSS===void 0||V.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,F=Symbol(),ht=new WeakMap,M=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==F)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(j&&t===void 0){let i=e!==void 0&&e.length===1;i&&(t=ht.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&ht.set(e,t))}return t}toString(){return this.cssText}},dt=o=>new M(typeof o=="string"?o:o+"",void 0,F),K=(o,...t)=>{let e=o.length===1?o[0]:t.reduce((i,s,r)=>i+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+o[r+1],o[0]);return new M(e,o,F)},pt=(o,t)=>{if(j)o.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let i=document.createElement("style"),s=V.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=e.cssText,o.appendChild(i)}},J=j?o=>o:o=>o instanceof CSSStyleSheet?(t=>{let e="";for(let i of t.cssRules)e+=i.cssText;return dt(e)})(o):o;var{is:Rt,defineProperty:Vt,getOwnPropertyDescriptor:jt,getOwnPropertyNames:Bt,getOwnPropertySymbols:Dt,getPrototypeOf:qt}=Object,b=globalThis,ut=b.trustedTypes,Wt=ut?ut.emptyScript:"",Y=b.reactiveElementPolyfillSupport,C=(o,t)=>o,Z={toAttribute(o,t){switch(t){case Boolean:o=o?Wt:null;break;case Object:case Array:o=o==null?o:JSON.stringify(o)}return o},fromAttribute(o,t){let e=o;switch(t){case Boolean:e=o!==null;break;case Number:e=o===null?null:Number(o);break;case Object:case Array:try{e=JSON.parse(o)}catch{e=null}}return e}},ft=(o,t)=>!Rt(o,t),_t={attribute:!0,type:String,converter:Z,reflect:!1,useDefault:!1,hasChanged:ft},yt,vt;(yt=Symbol.metadata)!=null||(Symbol.metadata=Symbol("metadata")),(vt=b.litPropertyMetadata)!=null||(b.litPropertyMetadata=new WeakMap);var f=class extends HTMLElement{static addInitializer(t){var e;this._$Ei(),((e=this.l)!=null?e:this.l=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=_t){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let i=Symbol(),s=this.getPropertyDescriptor(t,i,e);s!==void 0&&Vt(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){var n;let{get:s,set:r}=(n=jt(this.prototype,t))!=null?n:{get(){return this[e]},set(l){this[e]=l}};return{get:s,set(l){let a=s==null?void 0:s.call(this);r==null||r.call(this,l),this.requestUpdate(t,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){var e;return(e=this.elementProperties.get(t))!=null?e:_t}static _$Ei(){if(this.hasOwnProperty(C("elementProperties")))return;let t=qt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(C("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(C("properties"))){let e=this.properties,i=[...Bt(e),...Dt(e)];for(let s of i)this.createProperty(s,e[s])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[i,s]of e)this.elementProperties.set(i,s)}this._$Eh=new Map;for(let[e,i]of this.elementProperties){let s=this._$Eu(e,i);s!==void 0&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let i=new Set(t.flat(1/0).reverse());for(let s of i)e.unshift(J(s))}else t!==void 0&&e.push(J(t));return e}static _$Eu(t,e){let i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(e=>e(this))}addController(t){var e,i;((e=this._$EO)!=null?e:this._$EO=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&((i=t.hostConnected)==null||i.call(t))}removeController(t){var e;(e=this._$EO)==null||e.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){var e;let t=(e=this.shadowRoot)!=null?e:this.attachShadow(this.constructor.shadowRootOptions);return pt(t,this.constructor.elementStyles),t}connectedCallback(){var t,e;(t=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(i=>{var s;return(s=i.hostConnected)==null?void 0:s.call(i)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$EO)==null||t.forEach(e=>{var i;return(i=e.hostDisconnected)==null?void 0:i.call(e)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){var r;let i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(s!==void 0&&i.reflect===!0){let n=(((r=i.converter)==null?void 0:r.toAttribute)!==void 0?i.converter:Z).toAttribute(e,i.type);this._$Em=t,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){var r,n,l;let i=this.constructor,s=i._$Eh.get(t);if(s!==void 0&&this._$Em!==s){let a=i.getPropertyOptions(s),c=typeof a.converter=="function"?{fromAttribute:a.converter}:((r=a.converter)==null?void 0:r.fromAttribute)!==void 0?a.converter:Z;this._$Em=s;let h=c.fromAttribute(e,a.type);this[s]=(l=h!=null?h:(n=this._$Ej)==null?void 0:n.get(s))!=null?l:h,this._$Em=null}}requestUpdate(t,e,i,s=!1,r){var n,l;if(t!==void 0){let a=this.constructor;if(s===!1&&(r=this[t]),i!=null||(i=a.getPropertyOptions(t)),!(((n=i.hasChanged)!=null?n:ft)(r,e)||i.useDefault&&i.reflect&&r===((l=this._$Ej)==null?void 0:l.get(t))&&!this.hasAttribute(a._$Eu(t,i))))return;this.C(t,e,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:r},n){var l,a,c;i&&!((l=this._$Ej)!=null?l:this._$Ej=new Map).has(t)&&(this._$Ej.set(t,(a=n!=null?n:e)!=null?a:this[t]),r!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),s===!0&&this._$Em!==t&&((c=this._$Eq)!=null?c:this._$Eq=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var i,s;if(!this.isUpdatePending)return;if(!this.hasUpdated){if((i=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[n,l]of this._$Ep)this[n]=l;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[n,l]of r){let{wrapped:a}=l,c=this[n];a!==!0||this._$AL.has(n)||c===void 0||this.C(n,void 0,l,c)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),(s=this._$EO)==null||s.forEach(r=>{var n;return(n=r.hostUpdate)==null?void 0:n.call(r)}),this.update(e)):this._$EM()}catch(r){throw t=!1,this._$EM(),r}t&&this._$AE(e)}willUpdate(t){}_$AE(t){var e;(e=this._$EO)==null||e.forEach(i=>{var s;return(s=i.hostUpdated)==null?void 0:s.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(e=>this._$ET(e,this[e]))),this._$EM()}updated(t){}firstUpdated(t){}},mt;f.elementStyles=[],f.shadowRootOptions={mode:"open"},f[C("elementProperties")]=new Map,f[C("finalized")]=new Map,Y==null||Y({ReactiveElement:f}),((mt=b.reactiveElementVersions)!=null?mt:b.reactiveElementVersions=[]).push("2.1.2");var H=globalThis,gt=o=>o,B=H.trustedTypes,$t=B?B.createPolicy("lit-html",{createHTML:o=>o}):void 0,St="$lit$",w=`lit$${Math.random().toFixed(9).slice(2)}$`,Pt="?"+w,Ft=`<${Pt}>`,k=document,T=()=>k.createComment(""),O=o=>o===null||typeof o!="object"&&typeof o!="function",rt=Array.isArray,Kt=o=>rt(o)||typeof(o==null?void 0:o[Symbol.iterator])=="function",G=`[ 	
\f\r]`,z=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,bt=/-->/g,wt=/>/g,x=RegExp(`>|${G}(?:([^\\s"'>=/]+)(${G}*=${G}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),xt=/'/g,At=/"/g,Lt=/^(?:script|style|textarea|title)$/i,ot=o=>(t,...e)=>({_$litType$:o,strings:t,values:e}),_=ot(1),ie=ot(2),se=ot(3),g=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),kt=new WeakMap,A=k.createTreeWalker(k,129);function Mt(o,t){if(!rt(o)||!o.hasOwnProperty("raw"))throw Error("invalid template strings array");return $t!==void 0?$t.createHTML(t):t}var Jt=(o,t)=>{let e=o.length-1,i=[],s,r=t===2?"<svg>":t===3?"<math>":"",n=z;for(let l=0;l<e;l++){let a=o[l],c,h,d=-1,v=0;for(;v<a.length&&(n.lastIndex=v,h=n.exec(a),h!==null);)v=n.lastIndex,n===z?h[1]==="!--"?n=bt:h[1]!==void 0?n=wt:h[2]!==void 0?(Lt.test(h[2])&&(s=RegExp("</"+h[2],"g")),n=x):h[3]!==void 0&&(n=x):n===x?h[0]===">"?(n=s!=null?s:z,d=-1):h[1]===void 0?d=-2:(d=n.lastIndex-h[2].length,c=h[1],n=h[3]===void 0?x:h[3]==='"'?At:xt):n===At||n===xt?n=x:n===bt||n===wt?n=z:(n=x,s=void 0);let m=n===x&&o[l+1].startsWith("/>")?" ":"";r+=n===z?a+Ft:d>=0?(i.push(c),a.slice(0,d)+St+a.slice(d)+w+m):a+w+(d===-2?l:m)}return[Mt(o,r+(o[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),i]},I=class o{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let r=0,n=0,l=t.length-1,a=this.parts,[c,h]=Jt(t,e);if(this.el=o.createElement(c,i),A.currentNode=this.el.content,e===2||e===3){let d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(s=A.nextNode())!==null&&a.length<l;){if(s.nodeType===1){if(s.hasAttributes())for(let d of s.getAttributeNames())if(d.endsWith(St)){let v=h[n++],m=s.getAttribute(d).split(w),S=/([.?@])?(.*)/.exec(v);a.push({type:1,index:r,name:S[2],strings:m,ctor:S[1]==="."?tt:S[1]==="?"?et:S[1]==="@"?it:L}),s.removeAttribute(d)}else d.startsWith(w)&&(a.push({type:6,index:r}),s.removeAttribute(d));if(Lt.test(s.tagName)){let d=s.textContent.split(w),v=d.length-1;if(v>0){s.textContent=B?B.emptyScript:"";for(let m=0;m<v;m++)s.append(d[m],T()),A.nextNode(),a.push({type:2,index:++r});s.append(d[v],T())}}}else if(s.nodeType===8)if(s.data===Pt)a.push({type:2,index:r});else{let d=-1;for(;(d=s.data.indexOf(w,d+1))!==-1;)a.push({type:7,index:r}),d+=w.length-1}r++}}static createElement(t,e){let i=k.createElement("template");return i.innerHTML=t,i}};function P(o,t,e=o,i){var n,l,a;if(t===g)return t;let s=i!==void 0?(n=e._$Co)==null?void 0:n[i]:e._$Cl,r=O(t)?void 0:t._$litDirective$;return(s==null?void 0:s.constructor)!==r&&((l=s==null?void 0:s._$AO)==null||l.call(s,!1),r===void 0?s=void 0:(s=new r(o),s._$AT(o,e,i)),i!==void 0?((a=e._$Co)!=null?a:e._$Co=[])[i]=s:e._$Cl=s),s!==void 0&&(t=P(o,s._$AS(o,t.values),s,i)),t}var X=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var c;let{el:{content:e},parts:i}=this._$AD,s=((c=t==null?void 0:t.creationScope)!=null?c:k).importNode(e,!0);A.currentNode=s;let r=A.nextNode(),n=0,l=0,a=i[0];for(;a!==void 0;){if(n===a.index){let h;a.type===2?h=new N(r,r.nextSibling,this,t):a.type===1?h=new a.ctor(r,a.name,a.strings,this,t):a.type===6&&(h=new st(r,this,t)),this._$AV.push(h),a=i[++l]}n!==(a==null?void 0:a.index)&&(r=A.nextNode(),n++)}return A.currentNode=k,s}p(t){let e=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}},N=class o{get _$AU(){var t,e;return(e=(t=this._$AM)==null?void 0:t._$AU)!=null?e:this._$Cv}constructor(t,e,i,s){var r;this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=(r=s==null?void 0:s.isConnected)!=null?r:!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=P(this,t,e),O(t)?t===p||t==null||t===""?(this._$AH!==p&&this._$AR(),this._$AH=p):t!==this._$AH&&t!==g&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Kt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==p&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(k.createTextNode(t)),this._$AH=t}$(t){var r;let{values:e,_$litType$:i}=t,s=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=I.createElement(Mt(i.h,i.h[0]),this.options)),i);if(((r=this._$AH)==null?void 0:r._$AD)===s)this._$AH.p(e);else{let n=new X(s,this),l=n.u(this.options);n.p(e),this.T(l),this._$AH=n}}_$AC(t){let e=kt.get(t.strings);return e===void 0&&kt.set(t.strings,e=new I(t)),e}k(t){rt(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,i,s=0;for(let r of t)s===e.length?e.push(i=new o(this.O(T()),this.O(T()),this,this.options)):i=e[s],i._$AI(r),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){var i;for((i=this._$AP)==null?void 0:i.call(this,!1,!0,e);t!==this._$AB;){let s=gt(t).nextSibling;gt(t).remove(),t=s}}setConnected(t){var e;this._$AM===void 0&&(this._$Cv=t,(e=this._$AP)==null||e.call(this,t))}},L=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,r){this.type=1,this._$AH=p,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=p}_$AI(t,e=this,i,s){let r=this.strings,n=!1;if(r===void 0)t=P(this,t,e,0),n=!O(t)||t!==this._$AH&&t!==g,n&&(this._$AH=t);else{let l=t,a,c;for(t=r[0],a=0;a<r.length-1;a++)c=P(this,l[i+a],e,a),c===g&&(c=this._$AH[a]),n||(n=!O(c)||c!==this._$AH[a]),c===p?t=p:t!==p&&(t+=(c!=null?c:"")+r[a+1]),this._$AH[a]=c}n&&!s&&this.j(t)}j(t){t===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t!=null?t:"")}},tt=class extends L{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===p?void 0:t}},et=class extends L{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==p)}},it=class extends L{constructor(t,e,i,s,r){super(t,e,i,s,r),this.type=5}_$AI(t,e=this){var n;if((t=(n=P(this,t,e,0))!=null?n:p)===g)return;let i=this._$AH,s=t===p&&i!==p||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==p&&(i===p||s);s&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;typeof this._$AH=="function"?this._$AH.call((i=(e=this.options)==null?void 0:e.host)!=null?i:this.element,t):this._$AH.handleEvent(t)}},st=class{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){P(this,t)}};var Q=H.litHtmlPolyfillSupport,Et;Q==null||Q(I,N),((Et=H.litHtmlVersions)!=null?Et:H.litHtmlVersions=[]).push("3.3.3");var Ct=(o,t,e)=>{var r,n;let i=(r=e==null?void 0:e.renderBefore)!=null?r:t,s=i._$litPart$;if(s===void 0){let l=(n=e==null?void 0:e.renderBefore)!=null?n:null;i._$litPart$=s=new N(t.insertBefore(T(),l),l,void 0,e!=null?e:{})}return s._$AI(o),s};var E=globalThis,$=class extends f{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e,i;let t=super.createRenderRoot();return(i=(e=this.renderOptions).renderBefore)!=null||(e.renderBefore=t.firstChild),t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Ct(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return g}},zt;$._$litElement$=!0,$.finalized=!0,(zt=E.litElementHydrateSupport)==null||zt.call(E,{LitElement:$});var nt=E.litElementPolyfillSupport;nt==null||nt({LitElement:$});var Ht;((Ht=E.litElementVersions)!=null?Ht:E.litElementVersions=[]).push("4.2.2");var Tt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Ot=o=>(...t)=>({_$litDirective$:o,values:t}),D=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var at=Ot(class extends D{constructor(o){var t;if(super(o),o.type!==Tt.ATTRIBUTE||o.name!=="class"||((t=o.strings)==null?void 0:t.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(o){return" "+Object.keys(o).filter(t=>o[t]).join(" ")+" "}update(o,[t]){var i,s;if(this.st===void 0){this.st=new Set,o.strings!==void 0&&(this.nt=new Set(o.strings.join(" ").split(/\s/).filter(r=>r!=="")));for(let r in t)t[r]&&!((i=this.nt)!=null&&i.has(r))&&this.st.add(r);return this.render(t)}let e=o.element.classList;for(let r of this.st)r in t||(e.remove(r),this.st.delete(r));for(let r in t){let n=!!t[r];n===this.st.has(r)||(s=this.nt)!=null&&s.has(r)||(n?(e.add(r),this.st.add(r)):(e.remove(r),this.st.delete(r)))}return g}});var Yt={play:"M8 5v14l11-7z",pause:"M6 19h4V5H6v14zm8-14v14h4V5h-4z",next:"M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",prev:"M18 18L9.5 12 18 6v12zM6 6v12h2V6H6z",power:"M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0 1 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.18 1-4.12 2.59-5.41L6.17 5.17A8.932 8.932 0 0 0 3 12a9 9 0 1 0 18 0c0-2.83-1.31-5.34-3.17-7.83z",heart:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",heart_outline:"M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",playlist_add:"M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z",library:"M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16zm-2-12H6v-2h12v2zm0 4H6v-2h12v2zm0 4H6v-2h12v2z",shuffle:"M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",repeat:"M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",repeat_one:"M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z",volume:"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",volume_off:"M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",swap:"M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z",swap_horiz:"M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z",swap_vert:"M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z",cast:"M3.27 1L1 3.27 4.73 7H1v4h5.73L3 14.73V18h3.27L9.45 21l1.41-1.41L5.27 14.18l5.46-5.46 6.09 6.09L21 18.55V22h-3.45l-3.18 3.18L21 21.91V1L3.27 1zM3 21v-3h3v3H3zm9.5-9.5L9.45 14.55 12 17.09l3.5-3.5L12 10l-.5 1.5zM21 19.09L17.91 16 21 12.91v6.18z",check:"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",expand_more:"M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z",expand_less:"M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z",music_off:"M14 7V3.41L11.59 1H4v2h5.59L0 12.59 1.41 14 4 11.41V20h2v-7.59l4 4V20l6-6v-3.59l4.59 4.59L22 13l-8-8z",music:"M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"},y=(o,t=22)=>_`
  <svg width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="${Yt[o]}" fill="currentColor" />
  </svg>
`,It="musicflow",q=class extends ${constructor(){super();R(this,"_closePickerOnOutsideClick",e=>{if(!this._showPlayerPicker)return;(e.composedPath?e.composedPath():[]).includes(this)||(this._showPlayerPicker=!1)});this._activeEntity="",this._showPlayerPicker=!1,this._showLyrics=!1,this._showAddToPlaylist=!1,this._playlists=null,this._lyrics=null,this._lyricIndex=-1,this._seekPos=null,this._seeking=!1,this._tick=0}static get properties(){return{hass:{type:Object},config:{type:Object},_activeEntity:{type:String},_showPlayerPicker:{type:Boolean},_showLyrics:{type:Boolean},_showAddToPlaylist:{type:Boolean},_playlists:{type:Array},_lyrics:{type:Array},_lyricIndex:{type:Number},_seekPos:{type:Number},_seeking:{type:Boolean},_tick:{type:Number}}}connectedCallback(){super.connectedCallback(),this._ticker=setInterval(()=>this._tick++,1e3),document.addEventListener("click",this._closePickerOnOutsideClick,!0)}disconnectedCallback(){super.disconnectedCallback(),this._ticker&&clearInterval(this._ticker),document.removeEventListener("click",this._closePickerOnOutsideClick,!0)}setConfig(e){if(!e||!e.entity)throw new Error("\u8BF7\u914D\u7F6E MusicFlow \u64AD\u653E\u5668\u5B9E\u4F53 (entity)");this.config={show_artwork:!0,show_lyrics:!0,...e},(!this._activeEntity||!this._isMusicFlowEntity(e.entity))&&(this._activeEntity=e.entity)}get _entity(){var e,i;return(i=(e=this.hass)==null?void 0:e.states)==null?void 0:i[this._activeEntity]}get _attr(){var e;return((e=this._entity)==null?void 0:e.attributes)||{}}get _state(){var e;return(e=this._entity)==null?void 0:e.state}get _playing(){return this._state==="playing"}get _on(){return this._state!=="off"&&this._state!=="unavailable"}get _position(){return this._seeking&&this._seekPos!=null?this._seekPos:Number(this._attr.media_position||0)}get _duration(){return Number(this._attr.media_duration||0)}get _volume(){return Number(this._attr.volume_level||0)}get _liked(){return!!this._attr.liked}get _songId(){return this._attr.song_id||null}get _peers(){var i,s;if(!((i=this.hass)!=null&&i.states))return[];let e=[];for(let[r,n]of Object.entries(this.hass.states)){if(!r.startsWith("media_player."))continue;let l=(s=this.hass.entities)==null?void 0:s[r];!l||l.platform!==It||e.push({entityId:r,state:n,available:n.state!=="unavailable"})}return e}_isMusicFlowEntity(e){var i,s,r;return((r=(s=(i=this.hass)==null?void 0:i.entities)==null?void 0:s[e])==null?void 0:r.platform)===It}_peerLabel(e){var i;return((i=e.state.attributes)==null?void 0:i.friendly_name)||e.entityId}_peerMeta(e){var a;let i=e.state.attributes||{},s=(a=i.queue_size)!=null?a:0,r=i.queue_position,n=i.play_mode&&i.queue_size>0&&r!=null&&r>=0,l=i.media_title;return n&&l?`${s} \u9996 \xB7 ${l}`:n?`${s} \u9996 \xB7 \u64AD\u653E\u4E2D`:s>0?`${s} \u9996 \xB7 \u7A7A\u95F2`:"\u7A7A\u95F2"}_fmt(e){if(!isFinite(e)||e<0)return"0:00";let i=Math.floor(e/60),s=Math.floor(e%60);return`${i}:${String(s).padStart(2,"0")}`}_service(e,i,s={},r={}){this.hass.callService(e,i,s,{entity_id:this._activeEntity,...r})}_togglePlay(){this._service("media_player",this._playing?"media_pause":"media_play")}_togglePower(){this._service("media_player",this._on?"turn_off":"turn_on")}_toggleLike(){this._service("musicflow","like_track")}_toggleShuffle(){this._service("musicflow","set_play_mode",{play_mode:this._attr.shuffle?"order":"shuffle"})}_cycleRepeat(){let e=this._attr.play_mode,i=e==="one"?"order":e==="all"?"one":"all";this._service("musicflow","set_play_mode",{play_mode:i})}_setVolume(e){this._service("media_player","volume_set",{volume_level:Number(e.target.value)})}_toggleMute(){this._service("media_player","volume_mute",{is_volume_muted:!this._attr.is_volume_muted})}_seekStart(e){this._seeking=!0,this._seekPos=Number(e.target.value)}_seekInput(e){this._seekPos=Number(e.target.value)}_seekEnd(e){this._service("media_player","media_seek",{seek_position:Number(e.target.value)}),this._seekPos=null,this._seeking=!1}_switchPeer(e){if(!e||e===this._activeEntity){this._showPlayerPicker=!1;return}this._showPlayerPicker=!1,this._showLyrics=!1,this._lyrics=null,this._lyricIndex=-1,this._activeEntity=e,this.requestUpdate()}_addToPlaylist(e){let i=e.target.value;i&&(this.hass.callService("musicflow","add_to_playlist",{playlist_id:i},{entity_id:this._activeEntity}),e.target.value="",this._showAddToPlaylist=!1)}async _loadPlaylists(){if(!this._playlists)try{let e=await this.hass.callWS({type:"musicflow/playlists",entity_id:this._activeEntity});this._playlists=e.playlists||[]}catch{this._playlists=[]}}_toggleAddToPlaylist(){this._showAddToPlaylist=!this._showAddToPlaylist,this._showAddToPlaylist&&this._loadPlaylists()}_openMediaBrowser(){this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:this._activeEntity},bubbles:!0,composed:!0}))}async _loadLyrics(){if(!this._songId){this._lyrics=null;return}try{let e=await this.hass.callWS({type:"musicflow/lyrics",entity_id:this._activeEntity,song_id:this._songId});this._lyrics=e.lines||[]}catch{this._lyrics=[]}}_toggleLyrics(){this._showLyrics=!this._showLyrics,this._showLyrics&&this._loadLyrics()}_updateLyricIndex(){let e=this._lyrics;if(!e||e.length===0){this._lyricIndex=-1;return}let i=this._position*1e3,s=-1;for(let r=0;r<e.length&&i>=e[r].start;r++)s=r;s!==this._lyricIndex&&(this._lyricIndex=s)}updated(e){var i,s,r;if(e.has("hass")){let n=e.get("hass");(((s=(i=n==null?void 0:n.states)==null?void 0:i[this._activeEntity])==null?void 0:s.attributes)||{}).song_id!==this._songId&&(this._lyrics=null,this._lyricIndex=-1,this._showLyrics&&this._loadLyrics())}if(this._updateLyricIndex(),this._showLyrics&&this._lyricIndex>=0){let n=(r=this.shadowRoot)==null?void 0:r.querySelector(".lyrics-panel"),l=n==null?void 0:n.querySelector(".line.active");if(l){let a=l.offsetTop-n.clientHeight/2+l.clientHeight/2;n.scrollTo({top:Math.max(0,a),behavior:"smooth"})}}}render(){var lt,ct;if(!this.hass||!this._entity)return _`<ha-card class="card"><div class="empty">未找到实体 ${((lt=this.config)==null?void 0:lt.entity)||""}</div></ha-card>`;let e=this._attr,i=this._position,s=this._duration,r=e.media_title||(this._on?"\u672A\u5728\u64AD\u653E":"\u5DF2\u5173\u95ED"),n=e.media_artist||"",a=this.config.show_artwork?e.entity_picture:null,c=e.play_mode||"order",h=c!=="order",d=this._peers,v=this._peerLabel({entityId:this._activeEntity,state:this._entity}),m=this._lyrics&&this._lyricIndex>=0&&this._lyrics[this._lyricIndex].value||"",S=this.config.show_lyrics&&!this._showLyrics&&this._playing&&m;return _`
      <ha-card class="card" @click=${u=>{u.target===u.currentTarget&&(this._showLyrics=!1)}}>
        <!-- 顶部:Wi-Fi-ish 图标 + 设备名 + 播放器切换器 -->
        <div class="top">
          <span class="icon-badge">${y("cast",18)}</span>
          <span class="device-name" title="${v}">${v}</span>
          <span class="picker-wrap">
            <button
              class="picker-toggle ${(ct=d.find(u=>u.entityId===this._activeEntity))!=null&&ct.available?"is-current":""}"
              @click=${u=>{u.stopPropagation(),this._showPlayerPicker=!this._showPlayerPicker}}
              title="切换播放器"
            >
              ${y("swap_horiz",14)}
              <span>切换</span>
            </button>
            ${this._showPlayerPicker?_`
              <div class="picker" @click=${u=>u.stopPropagation()}>
                ${d.length===0?_`<div class="empty">没有 MusicFlow 播放器</div>`:d.map(u=>{var U;return _`
                      <div
                        class="picker-item ${at({active:u.entityId===this._activeEntity,offline:!u.available})}"
                        @click=${()=>this._switchPeer(u.entityId)}
                      >
                        <span class="picker-item-icon">${y((U=u.state.attributes)!=null&&U.icon?"music":"cast",18)}</span>
                        <div class="picker-item-info">
                          <div class="picker-item-name">${this._peerLabel(u)}</div>
                          <div class="picker-item-meta">${this._peerMeta(u)}</div>
                        </div>
                        ${u.entityId===this._activeEntity?y("check",18):p}
                      </div>
                    `})}
              </div>
            `:p}
          </span>
        </div>

        <!-- 主信息区(标题/艺术家 + 可选紧凑歌词) -->
        <div class="info">
          <div class="title">${r}</div>
          <div class="secondary">${n}</div>
          ${S?_`<div class="lyric-line">♪ ${m}</div>`:p}
          ${this.config.show_lyrics&&this._lyrics?_`<button class="lyric-toggle" @click=${()=>this._toggleLyrics()}>
                ${this._showLyrics?"\u6536\u8D77\u6B4C\u8BCD":"\u5C55\u5F00\u6B4C\u8BCD"}
                ${y(this._showLyrics?"expand_less":"expand_more",14)}
              </button>`:p}
        </div>

        <!-- 大封面 -->
        <div class="art" @click=${()=>this._toggleLyrics()} title="${this._showLyrics?"\u6536\u8D77\u6B4C\u8BCD":"\u5C55\u5F00\u6B4C\u8BCD"}">
          ${a?_`<img src="${a}" alt="" />`:y("music",!1,56)}
        </div>

        <!-- 增强按钮行:❤喜欢 / 加歌单 / 浏览媒体库(HA 原生入口) -->
        <div class="actions">
          <button
            class="action ${this._liked?"on":""}"
            title="喜欢 / 取消喜欢"
            @click=${this._toggleLike}
            ?disabled=${!this._songId}
          >${y(this._liked?"heart":"heart_outline",20)}</button>
          <button
            class="action ${this._showAddToPlaylist?"on":""}"
            title="添加到歌单"
            @click=${this._toggleAddToPlaylist}
            ?disabled=${!this._songId}
          >${y("playlist_add",20)}</button>
          <button
            class="action"
            title="浏览媒体库(打开 HA 原生媒体浏览)"
            @click=${this._openMediaBrowser}
          >${y("library",20)}</button>
        </div>

        ${this._showAddToPlaylist?_`
          <div class="playlist-picker">
            <select @focus=${this._loadPlaylists} @change=${this._addToPlaylist}>
              <option value="">${this._playlists===null?"\u52A0\u8F7D\u6B4C\u5355...":"\u9009\u62E9\u6B4C\u5355..."}</option>
              ${(this._playlists||[]).map(u=>_`<option value=${u.id}>${u.name}</option>`)}
            </select>
          </div>
        `:p}

        <!-- 进度条 -->
        <div class="progress">
          <span>${this._fmt(i)}</span>
          <input
            type="range"
            min="0"
            max=${s||100}
            step="1"
            value=${Math.min(i,s||100)}
            @pointerdown=${this._seekStart}
            @input=${this._seekInput}
            @change=${this._seekEnd}
            ?disabled=${!s}
          />
          <span>${this._fmt(s)}</span>
        </div>

        <!-- 控制行:上一首/播放/下一首/随机/循环/音量/电源 -->
        <div class="controls">
          <button class="action" title="上一首" @click=${()=>this._service("media_player","media_previous_track")}>${y("prev",22)}</button>
          <button class="action" title="${this._playing?"\u6682\u505C":"\u64AD\u653E"}" @click=${this._togglePlay}>
            ${y(this._playing?"pause":"play",28)}
          </button>
          <button class="action" title="下一首" @click=${()=>this._service("media_player","media_next_track")}>${y("next",22)}</button>
          <button class="action ${e.shuffle?"on":""}" title="随机" @click=${this._toggleShuffle}>${y("shuffle",16)}</button>
          <button class="action ${h?"on":""}" title="循环模式:${c}" @click=${this._cycleRepeat}>
            ${y(c==="one"?"repeat_one":"repeat",16)}
          </button>
          <span style="flex:1"></span>
          <button class="action ${e.is_volume_muted?"on":""}" title="静音" @click=${this._toggleMute}>${y(e.is_volume_muted?"volume_off":"volume",18)}</button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value=${this._volume}
            @change=${this._setVolume}
          />
          <button class="action" title="${this._on?"\u5173\u95ED":"\u5F00\u542F"}" @click=${this._togglePower}>
            ${y("power",18)}
          </button>
        </div>

        ${this._showLyrics?_`
          <div class="lyrics-panel">
            ${this._lyrics===null?_`<div class="empty">加载歌词中...</div>`:this._lyrics.length===0?_`<div class="empty">暂无歌词</div>`:this._lyrics.map((u,U)=>_`
                    <div class="line ${at({active:U===this._lyricIndex})} ${u.value.trim()===""?"blank":""}">
                      ${u.value||"\u266A"}
                    </div>
                  `)}
          </div>
        `:p}
      </ha-card>
    `}};R(q,"styles",K`
    :host {
      display: block;
      font-family: var(--primary-font-family, inherit);
      color: var(--primary-text-color);
    }
    /* HA 原生 media-player 卡片的整体外观 */
    .card {
      background: var(--ha-card-background, var(--card-background-color, #fff));
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, none);
      padding: 12px;
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto auto auto;
      gap: 8px 12px;
      align-items: center;
    }
    .top {
      grid-column: 1 / -1;
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
    .picker-toggle {
      background: none;
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      color: var(--secondary-text-color);
      border-radius: 999px;
      padding: 2px 8px;
      cursor: pointer;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      max-width: 38%;
      min-width: 0;
    }
    .picker-toggle span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .picker-toggle:hover {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
    .picker-toggle.is-current {
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
    .picker-item.offline {
      opacity: 0.55;
    }
    .picker-item-icon {
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }
    .picker-item-info {
      flex: 1;
      min-width: 0;
    }
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
    .picker-wrap {
      position: relative;
      flex-shrink: 0;
    }

    /* 主信息区(标题/艺术家/歌词) */
    .info {
      grid-column: 1 / 2;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
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
    .lyric-line {
      font-size: 13px;
      color: var(--secondary-text-color);
      font-style: italic;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lyric-line.active {
      color: var(--primary-color);
      font-weight: 600;
      font-style: normal;
    }
    .lyric-toggle {
      background: none;
      border: none;
      color: var(--secondary-text-color);
      cursor: pointer;
      padding: 0;
      margin-top: 4px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .lyric-toggle:hover { color: var(--primary-color); }

    /* 大封面 */
    .art {
      grid-column: 2 / 3;
      grid-row: 2 / 4;
      width: 120px;
      height: 120px;
      border-radius: 12px;
      background: var(--secondary-background-color, #eee);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--disabled-text-color);
      flex-shrink: 0;
      overflow: hidden;
    }
    .art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* 增强按钮行(喜欢 / 加歌单 / 浏览媒体库) */
    .actions {
      grid-column: 1 / 2;
      display: flex;
      gap: 4px;
      margin-top: 4px;
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

    /* 进度条 */
    .progress {
      grid-column: 1 / 2;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--secondary-text-color);
    }
    .progress input[type="range"] {
      flex: 1;
      accent-color: var(--primary-color);
    }

    /* 控制行:上一首/播放/下一首/模式/音量/电源 */
    .controls {
      grid-column: 1 / 2;
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .controls input[type="range"] {
      width: 60px;
      accent-color: var(--primary-color);
    }
    .mute-toggle.on { color: var(--primary-color); }

    /* 歌词滚动面板 */
    .lyrics-panel {
      grid-column: 1 / -1;
      max-height: 200px;
      overflow-y: auto;
      border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      padding-top: 6px;
      scroll-behavior: smooth;
    }
    .lyrics-panel .line {
      padding: 3px 4px;
      border-radius: 4px;
      font-size: 14px;
      color: var(--secondary-text-color);
    }
    .lyrics-panel .line.active {
      color: var(--primary-text-color);
      background: var(--primary-color);
      font-weight: 600;
    }
    .lyrics-panel .line.blank {
      opacity: 0.4;
      font-style: italic;
    }
    .lyrics-panel .empty {
      text-align: center;
      color: var(--disabled-text-color);
      font-size: 13px;
      padding: 12px 0;
    }

    /* 加歌单下拉 */
    .playlist-picker {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }
    .playlist-picker select {
      flex: 1;
      background: var(--input-background-color, var(--secondary-background-color));
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 13px;
    }

    .empty {
      grid-column: 1 / -1;
      text-align: center;
      color: var(--disabled-text-color);
      padding: 12px 0;
    }
  `);customElements.define("musicflow-player-card",q);var Zt=[{name:"entity",required:!0,selector:{entity:{domain:"media_player"}}},{name:"show_artwork",selector:{boolean:{}},default:!0},{name:"show_lyrics",selector:{boolean:{}},default:!0}],W=class extends ${setConfig(t){this.config=t}render(){return!this.hass||!this.config?p:_`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${Zt}
        .computeLabel=${t=>{var e;return(e=t.label)!=null?e:t.name}}
        @value-changed=${this._onChange}
      ></ha-form>
    `}_onChange(t){this.dispatchEvent(new CustomEvent("config-changed",{detail:{value:t.detail.value},bubbles:!0,composed:!0}))}};R(W,"properties",{hass:{type:Object},config:{type:Object}});customElements.define("musicflow-player-card-editor",W);window.customCards=window.customCards||[];window.customCards.push({type:"musicflow-player-card",name:"MusicFlow Player",description:"MusicFlow media player control card. Mirrors the HA native media_player card with enhancements: favorite, add-to-playlist, scrolling lyrics, switch between MusicFlow players (control target only). Requires MusicFlow integration 1.2.6+.",preview:!0});
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
