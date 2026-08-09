var Ot=Object.defineProperty;var Tt=(r,t,e)=>t in r?Ot(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var R=(r,t,e)=>Tt(r,typeof t!="symbol"?t+"":t,e);var I=globalThis,V=I.ShadowRoot&&(I.ShadyCSS===void 0||I.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,F=Symbol(),nt=new WeakMap,M=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==F)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(V&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=nt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&nt.set(e,t))}return t}toString(){return this.cssText}},at=r=>new M(typeof r=="string"?r:r+"",void 0,F),W=(r,...t)=>{let e=r.length===1?r[0]:t.reduce((s,i,o)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[o+1],r[0]);return new M(e,r,F)},lt=(r,t)=>{if(V)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),i=I.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,r.appendChild(s)}},K=V?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return at(e)})(r):r;var{is:Ut,defineProperty:Nt,getOwnPropertyDescriptor:Rt,getOwnPropertyNames:It,getOwnPropertySymbols:Vt,getPrototypeOf:jt}=Object,b=globalThis,ct=b.trustedTypes,Dt=ct?ct.emptyScript:"",J=b.reactiveElementPolyfillSupport,z=(r,t)=>r,Y={toAttribute(r,t){switch(t){case Boolean:r=r?Dt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},_t=(r,t)=>!Ut(r,t),ht={attribute:!0,type:String,converter:Y,reflect:!1,useDefault:!1,hasChanged:_t},dt,pt;(dt=Symbol.metadata)!=null||(Symbol.metadata=Symbol("metadata")),(pt=b.litPropertyMetadata)!=null||(b.litPropertyMetadata=new WeakMap);var f=class extends HTMLElement{static addInitializer(t){var e;this._$Ei(),((e=this.l)!=null?e:this.l=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=ht){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&Nt(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){var n;let{get:i,set:o}=(n=Rt(this.prototype,t))!=null?n:{get(){return this[e]},set(l){this[e]=l}};return{get:i,set(l){let a=i==null?void 0:i.call(this);o==null||o.call(this,l),this.requestUpdate(t,a,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){var e;return(e=this.elementProperties.get(t))!=null?e:ht}static _$Ei(){if(this.hasOwnProperty(z("elementProperties")))return;let t=jt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(z("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(z("properties"))){let e=this.properties,s=[...It(e),...Vt(e)];for(let i of s)this.createProperty(i,e[i])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let i of s)e.unshift(K(i))}else t!==void 0&&e.push(K(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(e=>e(this))}addController(t){var e,s;((e=this._$EO)!=null?e:this._$EO=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&((s=t.hostConnected)==null||s.call(t))}removeController(t){var e;(e=this._$EO)==null||e.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){var e;let t=(e=this.shadowRoot)!=null?e:this.attachShadow(this.constructor.shadowRootOptions);return lt(t,this.constructor.elementStyles),t}connectedCallback(){var t,e;(t=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(s=>{var i;return(i=s.hostConnected)==null?void 0:i.call(s)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$EO)==null||t.forEach(e=>{var s;return(s=e.hostDisconnected)==null?void 0:s.call(e)})}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){var o;let s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){let n=(((o=s.converter)==null?void 0:o.toAttribute)!==void 0?s.converter:Y).toAttribute(e,s.type);this._$Em=t,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,e){var o,n,l;let s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){let a=s.getPropertyOptions(i),c=typeof a.converter=="function"?{fromAttribute:a.converter}:((o=a.converter)==null?void 0:o.fromAttribute)!==void 0?a.converter:Y;this._$Em=i;let h=c.fromAttribute(e,a.type);this[i]=(l=h!=null?h:(n=this._$Ej)==null?void 0:n.get(i))!=null?l:h,this._$Em=null}}requestUpdate(t,e,s,i=!1,o){var n,l;if(t!==void 0){let a=this.constructor;if(i===!1&&(o=this[t]),s!=null||(s=a.getPropertyOptions(t)),!(((n=s.hasChanged)!=null?n:_t)(o,e)||s.useDefault&&s.reflect&&o===((l=this._$Ej)==null?void 0:l.get(t))&&!this.hasAttribute(a._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:o},n){var l,a,c;s&&!((l=this._$Ej)!=null?l:this._$Ej=new Map).has(t)&&(this._$Ej.set(t,(a=n!=null?n:e)!=null?a:this[t]),o!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&((c=this._$Eq)!=null?c:this._$Eq=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var s,i;if(!this.isUpdatePending)return;if(!this.hasUpdated){if((s=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[n,l]of this._$Ep)this[n]=l;this._$Ep=void 0}let o=this.constructor.elementProperties;if(o.size>0)for(let[n,l]of o){let{wrapped:a}=l,c=this[n];a!==!0||this._$AL.has(n)||c===void 0||this.C(n,void 0,l,c)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),(i=this._$EO)==null||i.forEach(o=>{var n;return(n=o.hostUpdate)==null?void 0:n.call(o)}),this.update(e)):this._$EM()}catch(o){throw t=!1,this._$EM(),o}t&&this._$AE(e)}willUpdate(t){}_$AE(t){var e;(e=this._$EO)==null||e.forEach(s=>{var i;return(i=s.hostUpdated)==null?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(e=>this._$ET(e,this[e]))),this._$EM()}updated(t){}firstUpdated(t){}},ut;f.elementStyles=[],f.shadowRootOptions={mode:"open"},f[z("elementProperties")]=new Map,f[z("finalized")]=new Map,J==null||J({ReactiveElement:f}),((ut=b.reactiveElementVersions)!=null?ut:b.reactiveElementVersions=[]).push("2.1.2");var H=globalThis,mt=r=>r,j=H.trustedTypes,vt=j?j.createPolicy("lit-html",{createHTML:r=>r}):void 0,At="$lit$",w=`lit$${Math.random().toFixed(9).slice(2)}$`,xt="?"+w,Bt=`<${xt}>`,E=document,O=()=>E.createComment(""),T=r=>r===null||typeof r!="object"&&typeof r!="function",it=Array.isArray,qt=r=>it(r)||typeof(r==null?void 0:r[Symbol.iterator])=="function",Z=`[ 	
\f\r]`,L=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ft=/-->/g,gt=/>/g,x=RegExp(`>|${Z}(?:([^\\s"'>=/]+)(${Z}*=${Z}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),$t=/'/g,yt=/"/g,kt=/^(?:script|style|textarea|title)$/i,rt=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),$=rt(1),Xt=rt(2),te=rt(3),g=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),bt=new WeakMap,k=E.createTreeWalker(E,129);function Et(r,t){if(!it(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return vt!==void 0?vt.createHTML(t):t}var Ft=(r,t)=>{let e=r.length-1,s=[],i,o=t===2?"<svg>":t===3?"<math>":"",n=L;for(let l=0;l<e;l++){let a=r[l],c,h,d=-1,_=0;for(;_<a.length&&(n.lastIndex=_,h=n.exec(a),h!==null);)_=n.lastIndex,n===L?h[1]==="!--"?n=ft:h[1]!==void 0?n=gt:h[2]!==void 0?(kt.test(h[2])&&(i=RegExp("</"+h[2],"g")),n=x):h[3]!==void 0&&(n=x):n===x?h[0]===">"?(n=i!=null?i:L,d=-1):h[1]===void 0?d=-2:(d=n.lastIndex-h[2].length,c=h[1],n=h[3]===void 0?x:h[3]==='"'?yt:$t):n===yt||n===$t?n=x:n===ft||n===gt?n=L:(n=x,i=void 0);let v=n===x&&r[l+1].startsWith("/>")?" ":"";o+=n===L?a+Bt:d>=0?(s.push(c),a.slice(0,d)+At+a.slice(d)+w+v):a+w+(d===-2?l:v)}return[Et(r,o+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},U=class r{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let o=0,n=0,l=t.length-1,a=this.parts,[c,h]=Ft(t,e);if(this.el=r.createElement(c,s),k.currentNode=this.el.content,e===2||e===3){let d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(i=k.nextNode())!==null&&a.length<l;){if(i.nodeType===1){if(i.hasAttributes())for(let d of i.getAttributeNames())if(d.endsWith(At)){let _=h[n++],v=i.getAttribute(d).split(w),A=/([.?@])?(.*)/.exec(_);a.push({type:1,index:o,name:A[2],strings:v,ctor:A[1]==="."?X:A[1]==="?"?tt:A[1]==="@"?et:P}),i.removeAttribute(d)}else d.startsWith(w)&&(a.push({type:6,index:o}),i.removeAttribute(d));if(kt.test(i.tagName)){let d=i.textContent.split(w),_=d.length-1;if(_>0){i.textContent=j?j.emptyScript:"";for(let v=0;v<_;v++)i.append(d[v],O()),k.nextNode(),a.push({type:2,index:++o});i.append(d[_],O())}}}else if(i.nodeType===8)if(i.data===xt)a.push({type:2,index:o});else{let d=-1;for(;(d=i.data.indexOf(w,d+1))!==-1;)a.push({type:7,index:o}),d+=w.length-1}o++}}static createElement(t,e){let s=E.createElement("template");return s.innerHTML=t,s}};function C(r,t,e=r,s){var n,l,a;if(t===g)return t;let i=s!==void 0?(n=e._$Co)==null?void 0:n[s]:e._$Cl,o=T(t)?void 0:t._$litDirective$;return(i==null?void 0:i.constructor)!==o&&((l=i==null?void 0:i._$AO)==null||l.call(i,!1),o===void 0?i=void 0:(i=new o(r),i._$AT(r,e,s)),s!==void 0?((a=e._$Co)!=null?a:e._$Co=[])[s]=i:e._$Cl=i),i!==void 0&&(t=C(r,i._$AS(r,t.values),i,s)),t}var Q=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var c;let{el:{content:e},parts:s}=this._$AD,i=((c=t==null?void 0:t.creationScope)!=null?c:E).importNode(e,!0);k.currentNode=i;let o=k.nextNode(),n=0,l=0,a=s[0];for(;a!==void 0;){if(n===a.index){let h;a.type===2?h=new N(o,o.nextSibling,this,t):a.type===1?h=new a.ctor(o,a.name,a.strings,this,t):a.type===6&&(h=new st(o,this,t)),this._$AV.push(h),a=s[++l]}n!==(a==null?void 0:a.index)&&(o=k.nextNode(),n++)}return k.currentNode=E,i}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},N=class r{get _$AU(){var t,e;return(e=(t=this._$AM)==null?void 0:t._$AU)!=null?e:this._$Cv}constructor(t,e,s,i){var o;this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=(o=i==null?void 0:i.isConnected)!=null?o:!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=C(this,t,e),T(t)?t===p||t==null||t===""?(this._$AH!==p&&this._$AR(),this._$AH=p):t!==this._$AH&&t!==g&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):qt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==p&&T(this._$AH)?this._$AA.nextSibling.data=t:this.T(E.createTextNode(t)),this._$AH=t}$(t){var o;let{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=U.createElement(Et(s.h,s.h[0]),this.options)),s);if(((o=this._$AH)==null?void 0:o._$AD)===i)this._$AH.p(e);else{let n=new Q(i,this),l=n.u(this.options);n.p(e),this.T(l),this._$AH=n}}_$AC(t){let e=bt.get(t.strings);return e===void 0&&bt.set(t.strings,e=new U(t)),e}k(t){it(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let o of t)i===e.length?e.push(s=new r(this.O(O()),this.O(O()),this,this.options)):s=e[i],s._$AI(o),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){var s;for((s=this._$AP)==null?void 0:s.call(this,!1,!0,e);t!==this._$AB;){let i=mt(t).nextSibling;mt(t).remove(),t=i}}setConnected(t){var e;this._$AM===void 0&&(this._$Cv=t,(e=this._$AP)==null||e.call(this,t))}},P=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,o){this.type=1,this._$AH=p,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=p}_$AI(t,e=this,s,i){let o=this.strings,n=!1;if(o===void 0)t=C(this,t,e,0),n=!T(t)||t!==this._$AH&&t!==g,n&&(this._$AH=t);else{let l=t,a,c;for(t=o[0],a=0;a<o.length-1;a++)c=C(this,l[s+a],e,a),c===g&&(c=this._$AH[a]),n||(n=!T(c)||c!==this._$AH[a]),c===p?t=p:t!==p&&(t+=(c!=null?c:"")+o[a+1]),this._$AH[a]=c}n&&!i&&this.j(t)}j(t){t===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t!=null?t:"")}},X=class extends P{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===p?void 0:t}},tt=class extends P{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==p)}},et=class extends P{constructor(t,e,s,i,o){super(t,e,s,i,o),this.type=5}_$AI(t,e=this){var n;if((t=(n=C(this,t,e,0))!=null?n:p)===g)return;let s=this._$AH,i=t===p&&s!==p||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==p&&(s===p||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,s;typeof this._$AH=="function"?this._$AH.call((s=(e=this.options)==null?void 0:e.host)!=null?s:this.element,t):this._$AH.handleEvent(t)}},st=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){C(this,t)}};var G=H.litHtmlPolyfillSupport,wt;G==null||G(U,N),((wt=H.litHtmlVersions)!=null?wt:H.litHtmlVersions=[]).push("3.3.3");var St=(r,t,e)=>{var o,n;let s=(o=e==null?void 0:e.renderBefore)!=null?o:t,i=s._$litPart$;if(i===void 0){let l=(n=e==null?void 0:e.renderBefore)!=null?n:null;s._$litPart$=i=new N(t.insertBefore(O(),l),l,void 0,e!=null?e:{})}return i._$AI(r),i};var S=globalThis,y=class extends f{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e,s;let t=super.createRenderRoot();return(s=(e=this.renderOptions).renderBefore)!=null||(e.renderBefore=t.firstChild),t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=St(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return g}},Ct;y._$litElement$=!0,y.finalized=!0,(Ct=S.litElementHydrateSupport)==null||Ct.call(S,{LitElement:y});var ot=S.litElementPolyfillSupport;ot==null||ot({LitElement:y});var Pt;((Pt=S.litElementVersions)!=null?Pt:S.litElementVersions=[]).push("4.2.2");var Mt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},zt=r=>(...t)=>({_$litDirective$:r,values:t}),D=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,s){this._$Ct=t,this._$AM=e,this._$Ci=s}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var Lt=zt(class extends D{constructor(r){var t;if(super(r),r.type!==Mt.ATTRIBUTE||r.name!=="class"||((t=r.strings)==null?void 0:t.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(r){return" "+Object.keys(r).filter(t=>r[t]).join(" ")+" "}update(r,[t]){var s,i;if(this.st===void 0){this.st=new Set,r.strings!==void 0&&(this.nt=new Set(r.strings.join(" ").split(/\s/).filter(o=>o!=="")));for(let o in t)t[o]&&!((s=this.nt)!=null&&s.has(o))&&this.st.add(o);return this.render(t)}let e=r.element.classList;for(let o of this.st)o in t||(e.remove(o),this.st.delete(o));for(let o in t){let n=!!t[o];n===this.st.has(o)||(i=this.nt)!=null&&i.has(o)||(n?(e.add(o),this.st.add(o)):(e.remove(o),this.st.delete(o)))}return g}});var Wt={play:"M8 5v14l11-7z",pause:"M6 19h4V5H6v14zm8-14v14h4V5h-4z",next:"M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",prev:"M18 18L9.5 12 18 6v12zM6 6v12h2V6H6z",power:"M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0 1 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.18 1-4.12 2.59-5.41L6.17 5.17A8.932 8.932 0 0 0 3 12a9 9 0 1 0 18 0c0-2.83-1.31-5.34-3.17-7.83z",heart:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",heart_outline:"M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",queue_music:"M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-4z",shuffle:"M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",repeat:"M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",repeat_one:"M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z",volume:"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",volume_off:"M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",swap_horiz:"M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z",cast:"M3.27 1L1 3.27 4.73 7H1v4h5.73L3 14.73V18h3.27L9.45 21l1.41-1.41L5.27 14.18l5.46-5.46 6.09 6.09L21 18.55V22h-3.45l-3.18 3.18L21 21.91V1L3.27 1zM3 21v-3h3v3H3zm9.5-9.5L9.45 14.55 12 17.09l3.5-3.5L12 10l-.5 1.5zM21 19.09L17.91 16 21 12.91v6.18z",check:"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",music:"M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"},u=(r,t=22)=>$`
  <svg width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="${Wt[r]}" fill="currentColor" />
  </svg>
`,Ht="musicflow",B=class extends y{constructor(){super();R(this,"_closePickerOnOutsideClick",e=>{if(!this._showPlayerPicker)return;(e.composedPath?e.composedPath():[]).includes(this)||(this._showPlayerPicker=!1)});this._activeEntity="",this._showPlayerPicker=!1,this._seekPos=null,this._seeking=!1,this._tick=0}static get properties(){return{hass:{type:Object},config:{type:Object},_activeEntity:{type:String},_showPlayerPicker:{type:Boolean},_seekPos:{type:Number},_seeking:{type:Boolean},_tick:{type:Number}}}connectedCallback(){super.connectedCallback(),this._ticker=setInterval(()=>this._tick++,1e3),document.addEventListener("click",this._closePickerOnOutsideClick,!0)}disconnectedCallback(){super.disconnectedCallback(),this._ticker&&clearInterval(this._ticker),document.removeEventListener("click",this._closePickerOnOutsideClick,!0)}setConfig(e){if(!e||!e.entity)throw new Error("\u8BF7\u914D\u7F6E MusicFlow \u64AD\u653E\u5668\u5B9E\u4F53 (entity)");this.config={show_artwork:!0,...e},(!this._activeEntity||!this._isMusicFlowEntity(e.entity))&&(this._activeEntity=e.entity)}get _entity(){var e,s;return(s=(e=this.hass)==null?void 0:e.states)==null?void 0:s[this._activeEntity]}get _attr(){var e;return((e=this._entity)==null?void 0:e.attributes)||{}}get _state(){var e;return(e=this._entity)==null?void 0:e.state}get _playing(){return this._state==="playing"}get _on(){return this._state!=="off"&&this._state!=="unavailable"}get _position(){return this._seeking&&this._seekPos!=null?this._seekPos:Number(this._attr.media_position||0)}get _duration(){return Number(this._attr.media_duration||0)}get _volume(){return Number(this._attr.volume_level||0)}get _liked(){return!!this._attr.liked}get _peers(){var s,i;if(!((s=this.hass)!=null&&s.states))return[];let e=[];for(let[o,n]of Object.entries(this.hass.states)){if(!o.startsWith("media_player."))continue;let l=(i=this.hass.entities)==null?void 0:i[o];!l||l.platform!==Ht||e.push({entityId:o,state:n,available:n.state!=="unavailable"})}return e}_isMusicFlowEntity(e){var s,i,o;return((o=(i=(s=this.hass)==null?void 0:s.entities)==null?void 0:i[e])==null?void 0:o.platform)===Ht}_peerLabel(e){var s;return((s=e.state.attributes)==null?void 0:s.friendly_name)||e.entityId}_peerMeta(e){var a;let s=e.state.attributes||{},i=(a=s.queue_size)!=null?a:0,o=s.queue_position,n=s.play_mode&&s.queue_size>0&&o!=null&&o>=0,l=s.media_title;return n&&l?`${i} \u9996 \xB7 ${l}`:n?`${i} \u9996 \xB7 \u64AD\u653E\u4E2D`:i>0?`${i} \u9996 \xB7 \u7A7A\u95F2`:"\u7A7A\u95F2"}_fmt(e){if(!isFinite(e)||e<0)return"0:00";let s=Math.floor(e/60),i=Math.floor(e%60);return`${s}:${String(i).padStart(2,"0")}`}_service(e,s,i={}){this.hass.callService(e,s,i,{entity_id:this._activeEntity})}_togglePlay(){this._service("media_player",this._playing?"media_pause":"media_play")}_togglePower(){this._service("media_player",this._on?"turn_off":"turn_on")}_toggleLike(){this._service("musicflow","like_track")}_toggleShuffle(){this._service("musicflow","set_play_mode",{play_mode:this._attr.shuffle?"order":"shuffle"})}_cycleRepeat(){let e=this._attr.play_mode,s=e==="one"?"order":e==="all"?"one":"all";this._service("musicflow","set_play_mode",{play_mode:s})}_setVolume(e){this._service("media_player","volume_set",{volume_level:Number(e.target.value)})}_toggleMute(){this._service("media_player","volume_mute",{is_volume_muted:!this._attr.is_volume_muted})}_seekStart(e){this._seeking=!0,this._seekPos=Number(e.target.value)}_seekInput(e){this._seekPos=Number(e.target.value)}_seekEnd(e){this._service("media_player","media_seek",{seek_position:Number(e.target.value)}),this._seekPos=null,this._seeking=!1}_switchPeer(e){if(!e||e===this._activeEntity){this._showPlayerPicker=!1;return}this._showPlayerPicker=!1,this._activeEntity=e,this.requestUpdate()}_openMediaBrowser(){this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:this._activeEntity},bubbles:!0,composed:!0}))}render(){var v,A;if(!this.hass||!this._entity)return $`<ha-card class="card"><div class="empty">未找到实体 ${((v=this.config)==null?void 0:v.entity)||""}</div></ha-card>`;let e=this._attr,s=this._position,i=this._duration,o=e.media_title||(this._on?"\u672A\u5728\u64AD\u653E":"\u5DF2\u5173\u95ED"),n=e.media_artist||"",a=this.config.show_artwork?e.entity_picture:null,c=e.play_mode||"order",h=c!=="order",d=this._peers,_=this._peerLabel({entityId:this._activeEntity,state:this._entity});return $`
      <ha-card class="card">
        <!-- 顶部:cast 图标 + 设备名 + 播放器切换器 -->
        <div class="top">
          <span class="icon-badge">${u("cast",18)}</span>
          <span class="device-name" title="${_}">${_}</span>
          <span class="picker-wrap">
            <button
              class="picker-toggle ${(A=d.find(m=>m.entityId===this._activeEntity))!=null&&A.available?"is-current":""}"
              @click=${m=>{m.stopPropagation(),this._showPlayerPicker=!this._showPlayerPicker}}
              title="切换播放器"
            >
              ${u("swap_horiz",14)}
              <span>切换</span>
            </button>
            ${this._showPlayerPicker?$`
              <div class="picker" @click=${m=>m.stopPropagation()}>
                ${d.length===0?$`<div class="picker-item-meta">没有 MusicFlow 播放器</div>`:d.map(m=>$`
                      <div
                        class="picker-item ${Lt({active:m.entityId===this._activeEntity,offline:!m.available})}"
                        @click=${()=>this._switchPeer(m.entityId)}
                      >
                        <span class="picker-item-icon">${u("cast",18)}</span>
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

        <!-- 标题 / 艺术家 -->
        <div class="title-block">
          <div class="title">${o}</div>
          <div class="secondary">${n}</div>
        </div>

        <!-- 增强按钮行:❤喜欢 / 📋 浏览媒体库 -->
        <div class="actions">
          <button
            class="action ${this._liked?"on":""}"
            title="喜欢 / 取消喜欢"
            @click=${this._toggleLike}
          >${u(this._liked?"heart":"heart_outline",22)}</button>
          <button
            class="action"
            title="浏览媒体库(打开 HA 原生媒体浏览)"
            @click=${this._openMediaBrowser}
          >${u("queue_music",22)}</button>
        </div>

        <!-- 控制行:电源 ⏮ ⏯ ⏭ 🔀 🔁 -->
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
          <button class="action ${e.shuffle?"on":""}" title="随机" @click=${this._toggleShuffle}>
            ${u("shuffle",20)}
          </button>
          <button class="action ${h?"on":""}" title="循环:${c}" @click=${this._cycleRepeat}>
            ${u(c==="one"?"repeat_one":"repeat",20)}
          </button>
        </div>

        <!-- 大封面(右列满铺) -->
        <div class="art">
          ${a?$`<img src="${a}" alt="" />`:u("music",!1,64)}
        </div>

        <!-- 底部:进度条 + 音量同行 -->
        <div class="bottom">
          <div class="progress-wrap">
            <span class="time">${this._fmt(s)}</span>
            <input
              type="range"
              min="0"
              max=${i||100}
              step="1"
              value=${Math.min(s,i||100)}
              @pointerdown=${this._seekStart}
              @input=${this._seekInput}
              @change=${this._seekEnd}
              ?disabled=${!i}
            />
            <span class="time">${this._fmt(i)}</span>
          </div>
          <div class="volume-wrap">
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
        </div>
      </ha-card>
    `}};R(B,"styles",W`
    :host {
      display: block;
      font-family: var(--primary-font-family, inherit);
      color: var(--primary-text-color);
    }
    /* Layout matches the HA native media_player card:
       two columns - controls/title on the left, full-bleed artwork on the right */
    .card {
      background: var(--ha-card-background, var(--card-background-color, #fff));
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, none);
      padding: 12px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto auto auto auto;
      column-gap: 12px;
      row-gap: 8px;
      align-items: start;
    }
    .left {
      grid-column: 1;
      display: contents;
    }
    .top {
      grid-column: 1;
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
    .picker-wrap {
      position: relative;
      flex-shrink: 0;
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

    /* Title block */
    .title-block {
      grid-column: 1;
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

    /* Enhancement buttons row (favorite, browse) */
    .actions {
      grid-column: 1;
      display: flex;
      gap: 4px;
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

    /* Transport controls - power at the LEFT (before prev), then prev/play/next */
    .controls {
      grid-column: 1;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 4px;
    }
    .controls .action {
      padding: 8px;
    }

    /* Bottom row: progress + volume together (per request "播放进度跟着音量控件动") */
    .bottom {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .progress-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .progress-wrap input[type="range"] {
      flex: 1;
      accent-color: var(--primary-color);
      min-width: 0;
    }
    .time {
      font-size: 11px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }
    .volume-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .volume-wrap input[type="range"] {
      width: 72px;
      accent-color: var(--primary-color);
    }
    .mute-toggle.on { color: var(--primary-color); }

    /* Full-bleed artwork (right column, spans all rows) */
    .art {
      grid-column: 2;
      grid-row: 1 / 6;
      min-height: 220px;
      border-radius: 10px;
      background: var(--secondary-background-color, #eee);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--disabled-text-color);
      overflow: hidden;
    }
    .art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  `);customElements.define("musicflow-player-card",B);var Kt=[{name:"entity",required:!0,selector:{entity:{domain:"media_player"}}},{name:"show_artwork",selector:{boolean:{}},default:!0}],q=class extends y{setConfig(t){this.config=t}render(){return!this.hass||!this.config?p:$`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${Kt}
        .computeLabel=${t=>{var e;return(e=t.label)!=null?e:t.name}}
        @value-changed=${this._onChange}
      ></ha-form>
    `}_onChange(t){this.dispatchEvent(new CustomEvent("config-changed",{detail:{value:t.detail.value},bubbles:!0,composed:!0}))}};R(q,"properties",{hass:{type:Object},config:{type:Object}});customElements.define("musicflow-player-card-editor",q);window.customCards=window.customCards||[];window.customCards.push({type:"musicflow-player-card",name:"MusicFlow Player",description:"MusicFlow media player card - an enhanced version of the HA native media_player card. Favorite, browse media library (opens HA native browser), switch between MusicFlow players. Requires MusicFlow integration 1.2.6+.",preview:!0});
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
