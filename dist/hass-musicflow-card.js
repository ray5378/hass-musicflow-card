var Tt=Object.defineProperty;var Ut=(r,t,e)=>t in r?Tt(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var R=(r,t,e)=>Ut(r,typeof t!="symbol"?t+"":t,e);var I=globalThis,V=I.ShadowRoot&&(I.ShadyCSS===void 0||I.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,F=Symbol(),at=new WeakMap,C=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==F)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(V&&t===void 0){let i=e!==void 0&&e.length===1;i&&(t=at.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&at.set(e,t))}return t}toString(){return this.cssText}},lt=r=>new C(typeof r=="string"?r:r+"",void 0,F),W=(r,...t)=>{let e=r.length===1?r[0]:t.reduce((i,s,o)=>i+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+r[o+1],r[0]);return new C(e,r,F)},ct=(r,t)=>{if(V)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let i=document.createElement("style"),s=I.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=e.cssText,r.appendChild(i)}},K=V?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(let i of t.cssRules)e+=i.cssText;return lt(e)})(r):r;var{is:Nt,defineProperty:Rt,getOwnPropertyDescriptor:It,getOwnPropertyNames:Vt,getOwnPropertySymbols:jt,getPrototypeOf:Dt}=Object,b=globalThis,ht=b.trustedTypes,Bt=ht?ht.emptyScript:"",J=b.reactiveElementPolyfillSupport,z=(r,t)=>r,Y={toAttribute(r,t){switch(t){case Boolean:r=r?Bt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},mt=(r,t)=>!Nt(r,t),dt={attribute:!0,type:String,converter:Y,reflect:!1,useDefault:!1,hasChanged:mt},pt,ut;(pt=Symbol.metadata)!=null||(Symbol.metadata=Symbol("metadata")),(ut=b.litPropertyMetadata)!=null||(b.litPropertyMetadata=new WeakMap);var f=class extends HTMLElement{static addInitializer(t){var e;this._$Ei(),((e=this.l)!=null?e:this.l=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=dt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let i=Symbol(),s=this.getPropertyDescriptor(t,i,e);s!==void 0&&Rt(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){var n;let{get:s,set:o}=(n=It(this.prototype,t))!=null?n:{get(){return this[e]},set(l){this[e]=l}};return{get:s,set(l){let a=s==null?void 0:s.call(this);o==null||o.call(this,l),this.requestUpdate(t,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){var e;return(e=this.elementProperties.get(t))!=null?e:dt}static _$Ei(){if(this.hasOwnProperty(z("elementProperties")))return;let t=Dt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(z("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(z("properties"))){let e=this.properties,i=[...Vt(e),...jt(e)];for(let s of i)this.createProperty(s,e[s])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[i,s]of e)this.elementProperties.set(i,s)}this._$Eh=new Map;for(let[e,i]of this.elementProperties){let s=this._$Eu(e,i);s!==void 0&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let i=new Set(t.flat(1/0).reverse());for(let s of i)e.unshift(K(s))}else t!==void 0&&e.push(K(t));return e}static _$Eu(t,e){let i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(e=>e(this))}addController(t){var e,i;((e=this._$EO)!=null?e:this._$EO=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&((i=t.hostConnected)==null||i.call(t))}removeController(t){var e;(e=this._$EO)==null||e.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){var e;let t=(e=this.shadowRoot)!=null?e:this.attachShadow(this.constructor.shadowRootOptions);return ct(t,this.constructor.elementStyles),t}connectedCallback(){var t,e;(t=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(i=>{var s;return(s=i.hostConnected)==null?void 0:s.call(i)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$EO)==null||t.forEach(e=>{var i;return(i=e.hostDisconnected)==null?void 0:i.call(e)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){var o;let i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(s!==void 0&&i.reflect===!0){let n=(((o=i.converter)==null?void 0:o.toAttribute)!==void 0?i.converter:Y).toAttribute(e,i.type);this._$Em=t,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){var o,n,l;let i=this.constructor,s=i._$Eh.get(t);if(s!==void 0&&this._$Em!==s){let a=i.getPropertyOptions(s),c=typeof a.converter=="function"?{fromAttribute:a.converter}:((o=a.converter)==null?void 0:o.fromAttribute)!==void 0?a.converter:Y;this._$Em=s;let h=c.fromAttribute(e,a.type);this[s]=(l=h!=null?h:(n=this._$Ej)==null?void 0:n.get(s))!=null?l:h,this._$Em=null}}requestUpdate(t,e,i,s=!1,o){var n,l;if(t!==void 0){let a=this.constructor;if(s===!1&&(o=this[t]),i!=null||(i=a.getPropertyOptions(t)),!(((n=i.hasChanged)!=null?n:mt)(o,e)||i.useDefault&&i.reflect&&o===((l=this._$Ej)==null?void 0:l.get(t))&&!this.hasAttribute(a._$Eu(t,i))))return;this.C(t,e,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:o},n){var l,a,c;i&&!((l=this._$Ej)!=null?l:this._$Ej=new Map).has(t)&&(this._$Ej.set(t,(a=n!=null?n:e)!=null?a:this[t]),o!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),s===!0&&this._$Em!==t&&((c=this._$Eq)!=null?c:this._$Eq=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var i,s;if(!this.isUpdatePending)return;if(!this.hasUpdated){if((i=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[n,l]of this._$Ep)this[n]=l;this._$Ep=void 0}let o=this.constructor.elementProperties;if(o.size>0)for(let[n,l]of o){let{wrapped:a}=l,c=this[n];a!==!0||this._$AL.has(n)||c===void 0||this.C(n,void 0,l,c)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),(s=this._$EO)==null||s.forEach(o=>{var n;return(n=o.hostUpdate)==null?void 0:n.call(o)}),this.update(e)):this._$EM()}catch(o){throw t=!1,this._$EM(),o}t&&this._$AE(e)}willUpdate(t){}_$AE(t){var e;(e=this._$EO)==null||e.forEach(i=>{var s;return(s=i.hostUpdated)==null?void 0:s.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(e=>this._$ET(e,this[e]))),this._$EM()}updated(t){}firstUpdated(t){}},_t;f.elementStyles=[],f.shadowRootOptions={mode:"open"},f[z("elementProperties")]=new Map,f[z("finalized")]=new Map,J==null||J({ReactiveElement:f}),((_t=b.reactiveElementVersions)!=null?_t:b.reactiveElementVersions=[]).push("2.1.2");var H=globalThis,vt=r=>r,j=H.trustedTypes,ft=j?j.createPolicy("lit-html",{createHTML:r=>r}):void 0,xt="$lit$",w=`lit$${Math.random().toFixed(9).slice(2)}$`,kt="?"+w,qt=`<${kt}>`,E=document,O=()=>E.createComment(""),T=r=>r===null||typeof r!="object"&&typeof r!="function",st=Array.isArray,Ft=r=>st(r)||typeof(r==null?void 0:r[Symbol.iterator])=="function",Z=`[ 	
\f\r]`,L=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,gt=/-->/g,yt=/>/g,x=RegExp(`>|${Z}(?:([^\\s"'>=/]+)(${Z}*=${Z}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),$t=/'/g,bt=/"/g,Et=/^(?:script|style|textarea|title)$/i,rt=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),y=rt(1),te=rt(2),ee=rt(3),g=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),wt=new WeakMap,k=E.createTreeWalker(E,129);function St(r,t){if(!st(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return ft!==void 0?ft.createHTML(t):t}var Wt=(r,t)=>{let e=r.length-1,i=[],s,o=t===2?"<svg>":t===3?"<math>":"",n=L;for(let l=0;l<e;l++){let a=r[l],c,h,d=-1,_=0;for(;_<a.length&&(n.lastIndex=_,h=n.exec(a),h!==null);)_=n.lastIndex,n===L?h[1]==="!--"?n=gt:h[1]!==void 0?n=yt:h[2]!==void 0?(Et.test(h[2])&&(s=RegExp("</"+h[2],"g")),n=x):h[3]!==void 0&&(n=x):n===x?h[0]===">"?(n=s!=null?s:L,d=-1):h[1]===void 0?d=-2:(d=n.lastIndex-h[2].length,c=h[1],n=h[3]===void 0?x:h[3]==='"'?bt:$t):n===bt||n===$t?n=x:n===gt||n===yt?n=L:(n=x,s=void 0);let v=n===x&&r[l+1].startsWith("/>")?" ":"";o+=n===L?a+qt:d>=0?(i.push(c),a.slice(0,d)+xt+a.slice(d)+w+v):a+w+(d===-2?l:v)}return[St(r,o+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),i]},U=class r{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let o=0,n=0,l=t.length-1,a=this.parts,[c,h]=Wt(t,e);if(this.el=r.createElement(c,i),k.currentNode=this.el.content,e===2||e===3){let d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(s=k.nextNode())!==null&&a.length<l;){if(s.nodeType===1){if(s.hasAttributes())for(let d of s.getAttributeNames())if(d.endsWith(xt)){let _=h[n++],v=s.getAttribute(d).split(w),A=/([.?@])?(.*)/.exec(_);a.push({type:1,index:o,name:A[2],strings:v,ctor:A[1]==="."?X:A[1]==="?"?tt:A[1]==="@"?et:M}),s.removeAttribute(d)}else d.startsWith(w)&&(a.push({type:6,index:o}),s.removeAttribute(d));if(Et.test(s.tagName)){let d=s.textContent.split(w),_=d.length-1;if(_>0){s.textContent=j?j.emptyScript:"";for(let v=0;v<_;v++)s.append(d[v],O()),k.nextNode(),a.push({type:2,index:++o});s.append(d[_],O())}}}else if(s.nodeType===8)if(s.data===kt)a.push({type:2,index:o});else{let d=-1;for(;(d=s.data.indexOf(w,d+1))!==-1;)a.push({type:7,index:o}),d+=w.length-1}o++}}static createElement(t,e){let i=E.createElement("template");return i.innerHTML=t,i}};function P(r,t,e=r,i){var n,l,a;if(t===g)return t;let s=i!==void 0?(n=e._$Co)==null?void 0:n[i]:e._$Cl,o=T(t)?void 0:t._$litDirective$;return(s==null?void 0:s.constructor)!==o&&((l=s==null?void 0:s._$AO)==null||l.call(s,!1),o===void 0?s=void 0:(s=new o(r),s._$AT(r,e,i)),i!==void 0?((a=e._$Co)!=null?a:e._$Co=[])[i]=s:e._$Cl=s),s!==void 0&&(t=P(r,s._$AS(r,t.values),s,i)),t}var Q=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var c;let{el:{content:e},parts:i}=this._$AD,s=((c=t==null?void 0:t.creationScope)!=null?c:E).importNode(e,!0);k.currentNode=s;let o=k.nextNode(),n=0,l=0,a=i[0];for(;a!==void 0;){if(n===a.index){let h;a.type===2?h=new N(o,o.nextSibling,this,t):a.type===1?h=new a.ctor(o,a.name,a.strings,this,t):a.type===6&&(h=new it(o,this,t)),this._$AV.push(h),a=i[++l]}n!==(a==null?void 0:a.index)&&(o=k.nextNode(),n++)}return k.currentNode=E,s}p(t){let e=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}},N=class r{get _$AU(){var t,e;return(e=(t=this._$AM)==null?void 0:t._$AU)!=null?e:this._$Cv}constructor(t,e,i,s){var o;this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=(o=s==null?void 0:s.isConnected)!=null?o:!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=P(this,t,e),T(t)?t===p||t==null||t===""?(this._$AH!==p&&this._$AR(),this._$AH=p):t!==this._$AH&&t!==g&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Ft(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==p&&T(this._$AH)?this._$AA.nextSibling.data=t:this.T(E.createTextNode(t)),this._$AH=t}$(t){var o;let{values:e,_$litType$:i}=t,s=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=U.createElement(St(i.h,i.h[0]),this.options)),i);if(((o=this._$AH)==null?void 0:o._$AD)===s)this._$AH.p(e);else{let n=new Q(s,this),l=n.u(this.options);n.p(e),this.T(l),this._$AH=n}}_$AC(t){let e=wt.get(t.strings);return e===void 0&&wt.set(t.strings,e=new U(t)),e}k(t){st(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,i,s=0;for(let o of t)s===e.length?e.push(i=new r(this.O(O()),this.O(O()),this,this.options)):i=e[s],i._$AI(o),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){var i;for((i=this._$AP)==null?void 0:i.call(this,!1,!0,e);t!==this._$AB;){let s=vt(t).nextSibling;vt(t).remove(),t=s}}setConnected(t){var e;this._$AM===void 0&&(this._$Cv=t,(e=this._$AP)==null||e.call(this,t))}},M=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,o){this.type=1,this._$AH=p,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=p}_$AI(t,e=this,i,s){let o=this.strings,n=!1;if(o===void 0)t=P(this,t,e,0),n=!T(t)||t!==this._$AH&&t!==g,n&&(this._$AH=t);else{let l=t,a,c;for(t=o[0],a=0;a<o.length-1;a++)c=P(this,l[i+a],e,a),c===g&&(c=this._$AH[a]),n||(n=!T(c)||c!==this._$AH[a]),c===p?t=p:t!==p&&(t+=(c!=null?c:"")+o[a+1]),this._$AH[a]=c}n&&!s&&this.j(t)}j(t){t===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t!=null?t:"")}},X=class extends M{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===p?void 0:t}},tt=class extends M{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==p)}},et=class extends M{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){var n;if((t=(n=P(this,t,e,0))!=null?n:p)===g)return;let i=this._$AH,s=t===p&&i!==p||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==p&&(i===p||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;typeof this._$AH=="function"?this._$AH.call((i=(e=this.options)==null?void 0:e.host)!=null?i:this.element,t):this._$AH.handleEvent(t)}},it=class{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){P(this,t)}};var G=H.litHtmlPolyfillSupport,At;G==null||G(U,N),((At=H.litHtmlVersions)!=null?At:H.litHtmlVersions=[]).push("3.3.3");var Pt=(r,t,e)=>{var o,n;let i=(o=e==null?void 0:e.renderBefore)!=null?o:t,s=i._$litPart$;if(s===void 0){let l=(n=e==null?void 0:e.renderBefore)!=null?n:null;i._$litPart$=s=new N(t.insertBefore(O(),l),l,void 0,e!=null?e:{})}return s._$AI(r),s};var S=globalThis,$=class extends f{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e,i;let t=super.createRenderRoot();return(i=(e=this.renderOptions).renderBefore)!=null||(e.renderBefore=t.firstChild),t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Pt(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return g}},Mt;$._$litElement$=!0,$.finalized=!0,(Mt=S.litElementHydrateSupport)==null||Mt.call(S,{LitElement:$});var ot=S.litElementPolyfillSupport;ot==null||ot({LitElement:$});var Ct;((Ct=S.litElementVersions)!=null?Ct:S.litElementVersions=[]).push("4.2.2");var zt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Lt=r=>(...t)=>({_$litDirective$:r,values:t}),D=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var Ht=Lt(class extends D{constructor(r){var t;if(super(r),r.type!==zt.ATTRIBUTE||r.name!=="class"||((t=r.strings)==null?void 0:t.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(r){return" "+Object.keys(r).filter(t=>r[t]).join(" ")+" "}update(r,[t]){var i,s;if(this.st===void 0){this.st=new Set,r.strings!==void 0&&(this.nt=new Set(r.strings.join(" ").split(/\s/).filter(o=>o!=="")));for(let o in t)t[o]&&!((i=this.nt)!=null&&i.has(o))&&this.st.add(o);return this.render(t)}let e=r.element.classList;for(let o of this.st)o in t||(e.remove(o),this.st.delete(o));for(let o in t){let n=!!t[o];n===this.st.has(o)||(s=this.nt)!=null&&s.has(o)||(n?(e.add(o),this.st.add(o)):(e.remove(o),this.st.delete(o)))}return g}});var Kt={play:"M8 5v14l11-7z",pause:"M6 19h4V5H6v14zm8-14v14h4V5h-4z",next:"M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",prev:"M18 18L9.5 12 18 6v12zM6 6v12h2V6H6z",power:"M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0 1 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.18 1-4.12 2.59-5.41L6.17 5.17A8.932 8.932 0 0 0 3 12a9 9 0 1 0 18 0c0-2.83-1.31-5.34-3.17-7.83z",heart:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",heart_outline:"M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",queue_music:"M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-4z",shuffle:"M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",repeat:"M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",repeat_one:"M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z",trending_flat:"M22 12l-4-4v3H3v2h15v3z",volume:"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",volume_off:"M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",headphones:"M12 3a9 9 0 0 0-9 9v7h2v-7a7 7 0 0 1 14 0v7h2v-7a9 9 0 0 0-9-9zm0 13a3 3 0 0 0-3 3v3a3 3 0 0 0 6 0v-3a3 3 0 0 0-3-3z",cast:"M3.27 1L1 3.27 4.73 7H1v4h5.73L3 14.73V18h3.27L9.45 21l1.41-1.41L5.27 14.18l5.46-5.46 6.09 6.09L21 18.55V22h-3.45l-3.18 3.18L21 21.91V1L3.27 1zM3 21v-3h3v3H3zm9.5-9.5L9.45 14.55 12 17.09l3.5-3.5L12 10l-.5 1.5zM21 19.09L17.91 16 21 12.91v6.18z",check:"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",music:"M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"},u=(r,t=22)=>y`
  <svg width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="${Kt[r]}" fill="currentColor" />
  </svg>
`,Ot="musicflow",B=class extends ${constructor(){super();R(this,"_closePickerOnOutsideClick",e=>{if(!this._showPlayerPicker)return;(e.composedPath?e.composedPath():[]).includes(this)||(this._showPlayerPicker=!1)});this._activeEntity="",this._showPlayerPicker=!1,this._seekPos=null,this._seeking=!1,this._tick=0}static get properties(){return{hass:{type:Object},config:{type:Object},_activeEntity:{type:String},_showPlayerPicker:{type:Boolean},_seekPos:{type:Number},_seeking:{type:Boolean},_tick:{type:Number}}}connectedCallback(){super.connectedCallback(),this._ticker=setInterval(()=>this._tick++,1e3),document.addEventListener("click",this._closePickerOnOutsideClick,!0)}disconnectedCallback(){super.disconnectedCallback(),this._ticker&&clearInterval(this._ticker),document.removeEventListener("click",this._closePickerOnOutsideClick,!0)}setConfig(e){if(!e||!e.entity)throw new Error("\u8BF7\u914D\u7F6E MusicFlow \u64AD\u653E\u5668\u5B9E\u4F53 (entity)");this.config={show_artwork:!0,...e},(!this._activeEntity||!this._isMusicFlowEntity(e.entity))&&(this._activeEntity=e.entity)}get _entity(){var e,i;return(i=(e=this.hass)==null?void 0:e.states)==null?void 0:i[this._activeEntity]}get _attr(){var e;return((e=this._entity)==null?void 0:e.attributes)||{}}get _state(){var e;return(e=this._entity)==null?void 0:e.state}get _playing(){return this._state==="playing"}get _on(){return this._state!=="off"&&this._state!=="unavailable"}get _position(){return this._seeking&&this._seekPos!=null?this._seekPos:Number(this._attr.media_position||0)}get _duration(){return Number(this._attr.media_duration||0)}get _volume(){return Number(this._attr.volume_level||0)}get _liked(){return!!this._attr.liked}get _peers(){var i,s;if(!((i=this.hass)!=null&&i.states))return[];let e=[];for(let[o,n]of Object.entries(this.hass.states)){if(!o.startsWith("media_player."))continue;let l=(s=this.hass.entities)==null?void 0:s[o];!l||l.platform!==Ot||e.push({entityId:o,state:n,available:n.state!=="unavailable"})}return e}_isMusicFlowEntity(e){var i,s,o;return((o=(s=(i=this.hass)==null?void 0:i.entities)==null?void 0:s[e])==null?void 0:o.platform)===Ot}_peerLabel(e){var i;return((i=e.state.attributes)==null?void 0:i.friendly_name)||e.entityId}_peerMeta(e){var a;let i=e.state.attributes||{},s=(a=i.queue_size)!=null?a:0,o=i.queue_position,n=i.play_mode&&i.queue_size>0&&o!=null&&o>=0,l=i.media_title;return n&&l?`${s} \u9996 \xB7 ${l}`:n?`${s} \u9996 \xB7 \u64AD\u653E\u4E2D`:s>0?`${s} \u9996 \xB7 \u7A7A\u95F2`:"\u7A7A\u95F2"}_fmt(e){if(!isFinite(e)||e<0)return"0:00";let i=Math.floor(e/60),s=Math.floor(e%60);return`${i}:${String(s).padStart(2,"0")}`}_service(e,i,s={}){this.hass.callService(e,i,s,{entity_id:this._activeEntity})}_togglePlay(){this._service("media_player",this._playing?"media_pause":"media_play")}_togglePower(){this._service("media_player",this._on?"turn_off":"turn_on")}_toggleLike(){this._service("musicflow","like_track")}_cyclePlayMode(){let e=["order","all","one","shuffle"],i=this._attr.play_mode||"order",s=e.indexOf(i),o=e[(s+1)%e.length];this._service("musicflow","set_play_mode",{play_mode:o})}_playModeIcon(e){return e==="shuffle"?"shuffle":e==="one"?"repeat_one":e==="all"?"repeat":"trending_flat"}_playModeLabel(e){return e==="shuffle"?"\u968F\u673A":e==="one"?"\u5355\u66F2\u5FAA\u73AF":e==="all"?"\u5217\u8868\u5FAA\u73AF":"\u987A\u5E8F"}_setVolume(e){this._service("media_player","volume_set",{volume_level:Number(e.target.value)})}_toggleMute(){this._service("media_player","volume_mute",{is_volume_muted:!this._attr.is_volume_muted})}_seekStart(e){this._seeking=!0,this._seekPos=Number(e.target.value)}_seekInput(e){this._seekPos=Number(e.target.value)}_seekEnd(e){this._service("media_player","media_seek",{seek_position:Number(e.target.value)}),this._seekPos=null,this._seeking=!1}_switchPeer(e){if(!e||e===this._activeEntity){this._showPlayerPicker=!1;return}this._showPlayerPicker=!1,this._activeEntity=e,this.requestUpdate()}_openMediaBrowser(){this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:this._activeEntity},bubbles:!0,composed:!0}))}render(){var A,nt;if(!this.hass||!this._entity)return y`<ha-card class="card"><div class="empty">未找到实体 ${((A=this.config)==null?void 0:A.entity)||""}</div></ha-card>`;let e=this._attr,i=this._position,s=this._duration,o=e.media_title||(this._on?"\u672A\u5728\u64AD\u653E":"\u5DF2\u5173\u95ED"),n=e.media_artist||"",a=this.config.show_artwork?e.entity_picture:null,c=e.play_mode||"order",h=c!=="order",d=this._peers,_=this._peerLabel({entityId:this._activeEntity,state:this._entity}),v=(nt=d.find(m=>m.entityId===this._activeEntity))==null?void 0:nt.available;return y`
      <ha-card class="card">
        <!-- 顶部:cast 图标 + 设备名 -->
        <div class="top">
          <span class="icon-badge">${u("cast",18)}</span>
          <span class="device-name" title="${_}">${_}</span>
        </div>

        <!-- 标题 / 艺术家 -->
        <div class="title-block">
          <div class="title">${o}</div>
          <div class="secondary">${n}</div>
        </div>

        <!-- 增强按钮行:❤喜欢(始终可点) -->
        <div class="actions">
          <button
            class="action ${this._liked?"on":""}"
            title="喜欢 / 取消喜欢"
            @click=${this._toggleLike}
          >${u(this._liked?"heart":"heart_outline",22)}</button>
        </div>

        <!-- 控制行:[⏻关闭] [⏮] [▶/⏸] [⏭] [播放模式循环] [切换播放器(耳机)] -->
        <div class="controls">
          <button class="action" title="${this._on?"\u5173\u95ED":"\u5F00\u542F"}" @click=${this._togglePower}>
            ${u("power",22)}
          </button>
          <button class="action" title="上一首" @click=${()=>this._service("media_player","media_previous_track")}>
            ${u("prev",26)}
          </button>
          <button class="action" title="${this._playing?"\u6682\u505C":"\u64AD\u653E"}" @click=${this._togglePlay}>
            ${u(this._playing?"pause":"play",30)}
          </button>
          <button class="action" title="下一首" @click=${()=>this._service("media_player","media_next_track")}>
            ${u("next",26)}
          </button>
          <button
            class="action ${h?"on":""}"
            title="播放模式:${this._playModeLabel(c)} (点击循环切换)"
            @click=${this._cyclePlayMode}
          >${u(this._playModeIcon(c),22)}</button>

          <!-- 切换播放器(耳机图标,MusicFlow 主项目同款) -->
          <span class="picker-wrap">
            <button
              class="picker-toggle ${v?"is-current":""}"
              @click=${m=>{m.stopPropagation(),this._showPlayerPicker=!this._showPlayerPicker}}
              title="切换播放器"
            >
              ${u("headphones",20)}
            </button>
            ${this._showPlayerPicker?y`
              <div class="picker" @click=${m=>m.stopPropagation()}>
                ${d.length===0?y`<div class="picker-item-meta">没有 MusicFlow 播放器</div>`:d.map(m=>y`
                      <div
                        class="picker-item ${Ht({active:m.entityId===this._activeEntity,offline:!m.available})}"
                        @click=${()=>this._switchPeer(m.entityId)}
                      >
                        <span class="picker-item-icon">${u("headphones",18)}</span>
                        <div class="picker-item-info">
                          <div class="picker-item-name">${this._peerLabel(m)}</div>
                          <div class="picker-item-meta">${this._peerMeta(m)}</div>
                        </div>
                        ${m.entityId===this._activeEntity?u("check",18):p}
                      </div>
                    `)}
              </div>
            `:p}
          </span>
        </div>

        <!-- 大封面(右列满铺),媒体库按钮绝对定位在封面右下角 -->
        <div class="art">
          ${a?y`<img src="${a}" alt="" />`:u("music",!1,64)}
          <button
            class="art-browse"
            title="浏览媒体库(打开 HA 原生媒体浏览)"
            @click=${this._openMediaBrowser}
          >${u("queue_music",18)}</button>
        </div>

        <!-- 音量:右列底部独立 -->
        <div class="volume-bar">
          <button class="action ${e.is_volume_muted?"on":""}" title="静音" @click=${this._toggleMute}>
            ${u(e.is_volume_muted?"volume_off":"volume",20)}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value=${this._volume}
            @change=${this._setVolume}
          />
        </div>

        <!-- 进度条:卡片底部跨整张,视觉上与音量完全分离 -->
        <div class="progress-bar">
          <span class="time">${this._fmt(i)}</span>
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
          <span class="time">${this._fmt(s)}</span>
        </div>
      </ha-card>
    `}};R(B,"styles",W`
    :host {
      display: block;
      font-family: var(--primary-font-family, inherit);
      color: var(--primary-text-color);
    }
    /* Two-column layout that mirrors HA's native media_player card.
       Left column: top / title / action / controls. Right column: artwork.
       Progress bar at the bottom spans the full card width.
       Volume in its own row under the artwork on the right column. */
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
      position: relative;
    }

    /* Header strip: cast icon + device name (no picker button here anymore) */
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

    /* Single enhancement button: favorite (always clickable) */
    .actions {
      grid-column: 1;
      grid-row: 3;
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

    /* Transport row: power | prev | play/pause | next | mode-cycle | player-switcher */
    .controls {
      grid-column: 1;
      grid-row: 4;
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .controls .action {
      padding: 6px;
    }

    /* Full-bleed artwork on the right column (rows 1-6) */
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
    /* Browse media library button - bottom-right corner of artwork, like HA native */
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
    .art-browse:hover {
      background: rgba(0, 0, 0, 0.65);
    }

    /* Volume - right column, last row (under the artwork) */
    .volume-bar {
      grid-column: 2;
      grid-row: 7;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .volume-bar input[type="range"] {
      flex: 1;
      accent-color: var(--primary-color);
      min-width: 0;
    }
    .mute-toggle.on { color: var(--primary-color); }

    /* Progress bar - bottom of the card, spans both columns (full width) */
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
      accent-color: var(--primary-color);
      min-width: 0;
    }

    /* Player switcher dropdown (anchored to the headphones button) */
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
  `);customElements.define("musicflow-player-card",B);var Jt=[{name:"entity",required:!0,selector:{entity:{domain:"media_player"}}},{name:"show_artwork",selector:{boolean:{}},default:!0}],q=class extends ${setConfig(t){this.config=t}render(){return!this.hass||!this.config?p:y`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${Jt}
        .computeLabel=${t=>{var e;return(e=t.label)!=null?e:t.name}}
        @value-changed=${this._onChange}
      ></ha-form>
    `}_onChange(t){this.dispatchEvent(new CustomEvent("config-changed",{detail:{value:t.detail.value},bubbles:!0,composed:!0}))}};R(q,"properties",{hass:{type:Object},config:{type:Object}});customElements.define("musicflow-player-card-editor",q);window.customCards=window.customCards||[];window.customCards.push({type:"musicflow-player-card",name:"MusicFlow Player",description:"MusicFlow media player card - enhanced version of the HA native media_player card. Favorite, browse media library (opens HA native browser), switch between MusicFlow players. Requires MusicFlow integration 1.2.6+.",preview:!0});
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
