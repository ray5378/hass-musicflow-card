var zt=Object.defineProperty;var Ht=(r,t,e)=>t in r?zt(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var rt=(r,t,e)=>Ht(r,typeof t!="symbol"?t+"":t,e);var R=globalThis,L=R.ShadowRoot&&(R.ShadyCSS===void 0||R.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,D=Symbol(),ot=new WeakMap,C=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==D)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(L&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=ot.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&ot.set(e,t))}return t}toString(){return this.cssText}},nt=r=>new C(typeof r=="string"?r:r+"",void 0,D),B=(r,...t)=>{let e=r.length===1?r[0]:t.reduce((s,i,o)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[o+1],r[0]);return new C(e,r,D)},at=(r,t)=>{if(L)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),i=R.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,r.appendChild(s)}},W=L?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return nt(e)})(r):r;var{is:Nt,defineProperty:Ut,getOwnPropertyDescriptor:Ot,getOwnPropertyNames:Rt,getOwnPropertySymbols:Lt,getPrototypeOf:It}=Object,$=globalThis,lt=$.trustedTypes,Vt=lt?lt.emptyScript:"",q=$.reactiveElementPolyfillSupport,M=(r,t)=>r,F={toAttribute(r,t){switch(t){case Boolean:r=r?Vt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},ut=(r,t)=>!Nt(r,t),ct={attribute:!0,type:String,converter:F,reflect:!1,useDefault:!1,hasChanged:ut},ht,dt;(ht=Symbol.metadata)!=null||(Symbol.metadata=Symbol("metadata")),(dt=$.litPropertyMetadata)!=null||($.litPropertyMetadata=new WeakMap);var m=class extends HTMLElement{static addInitializer(t){var e;this._$Ei(),((e=this.l)!=null?e:this.l=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=ct){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&Ut(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){var n;let{get:i,set:o}=(n=Ot(this.prototype,t))!=null?n:{get(){return this[e]},set(l){this[e]=l}};return{get:i,set(l){let a=i==null?void 0:i.call(this);o==null||o.call(this,l),this.requestUpdate(t,a,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){var e;return(e=this.elementProperties.get(t))!=null?e:ct}static _$Ei(){if(this.hasOwnProperty(M("elementProperties")))return;let t=It(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(M("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(M("properties"))){let e=this.properties,s=[...Rt(e),...Lt(e)];for(let i of s)this.createProperty(i,e[i])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let i of s)e.unshift(W(i))}else t!==void 0&&e.push(W(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(e=>e(this))}addController(t){var e,s;((e=this._$EO)!=null?e:this._$EO=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&((s=t.hostConnected)==null||s.call(t))}removeController(t){var e;(e=this._$EO)==null||e.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){var e;let t=(e=this.shadowRoot)!=null?e:this.attachShadow(this.constructor.shadowRootOptions);return at(t,this.constructor.elementStyles),t}connectedCallback(){var t,e;(t=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(s=>{var i;return(i=s.hostConnected)==null?void 0:i.call(s)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$EO)==null||t.forEach(e=>{var s;return(s=e.hostDisconnected)==null?void 0:s.call(e)})}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){var o;let s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){let n=(((o=s.converter)==null?void 0:o.toAttribute)!==void 0?s.converter:F).toAttribute(e,s.type);this._$Em=t,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,e){var o,n,l;let s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){let a=s.getPropertyOptions(i),c=typeof a.converter=="function"?{fromAttribute:a.converter}:((o=a.converter)==null?void 0:o.fromAttribute)!==void 0?a.converter:F;this._$Em=i;let h=c.fromAttribute(e,a.type);this[i]=(l=h!=null?h:(n=this._$Ej)==null?void 0:n.get(i))!=null?l:h,this._$Em=null}}requestUpdate(t,e,s,i=!1,o){var n,l;if(t!==void 0){let a=this.constructor;if(i===!1&&(o=this[t]),s!=null||(s=a.getPropertyOptions(t)),!(((n=s.hasChanged)!=null?n:ut)(o,e)||s.useDefault&&s.reflect&&o===((l=this._$Ej)==null?void 0:l.get(t))&&!this.hasAttribute(a._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:o},n){var l,a,c;s&&!((l=this._$Ej)!=null?l:this._$Ej=new Map).has(t)&&(this._$Ej.set(t,(a=n!=null?n:e)!=null?a:this[t]),o!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&((c=this._$Eq)!=null?c:this._$Eq=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var s,i;if(!this.isUpdatePending)return;if(!this.hasUpdated){if((s=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[n,l]of this._$Ep)this[n]=l;this._$Ep=void 0}let o=this.constructor.elementProperties;if(o.size>0)for(let[n,l]of o){let{wrapped:a}=l,c=this[n];a!==!0||this._$AL.has(n)||c===void 0||this.C(n,void 0,l,c)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),(i=this._$EO)==null||i.forEach(o=>{var n;return(n=o.hostUpdate)==null?void 0:n.call(o)}),this.update(e)):this._$EM()}catch(o){throw t=!1,this._$EM(),o}t&&this._$AE(e)}willUpdate(t){}_$AE(t){var e;(e=this._$EO)==null||e.forEach(s=>{var i;return(i=s.hostUpdated)==null?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(e=>this._$ET(e,this[e]))),this._$EM()}updated(t){}firstUpdated(t){}},pt;m.elementStyles=[],m.shadowRootOptions={mode:"open"},m[M("elementProperties")]=new Map,m[M("finalized")]=new Map,q==null||q({ReactiveElement:m}),((pt=$.reactiveElementVersions)!=null?pt:$.reactiveElementVersions=[]).push("2.1.2");var T=globalThis,_t=r=>r,I=T.trustedTypes,ft=I?I.createPolicy("lit-html",{createHTML:r=>r}):void 0,At="$lit$",g=`lit$${Math.random().toFixed(9).slice(2)}$`,xt="?"+g,jt=`<${xt}>`,w=document,z=()=>w.createComment(""),H=r=>r===null||typeof r!="object"&&typeof r!="function",tt=Array.isArray,Dt=r=>tt(r)||typeof(r==null?void 0:r[Symbol.iterator])=="function",K=`[ 	
\f\r]`,P=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,mt=/-->/g,vt=/>/g,A=RegExp(`>|${K}(?:([^\\s"'>=/]+)(${K}*=${K}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),yt=/'/g,$t=/"/g,wt=/^(?:script|style|textarea|title)$/i,et=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),_=et(1),Qt=et(2),Xt=et(3),v=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),gt=new WeakMap,x=w.createTreeWalker(w,129);function Et(r,t){if(!tt(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return ft!==void 0?ft.createHTML(t):t}var Bt=(r,t)=>{let e=r.length-1,s=[],i,o=t===2?"<svg>":t===3?"<math>":"",n=P;for(let l=0;l<e;l++){let a=r[l],c,h,d=-1,f=0;for(;f<a.length&&(n.lastIndex=f,h=n.exec(a),h!==null);)f=n.lastIndex,n===P?h[1]==="!--"?n=mt:h[1]!==void 0?n=vt:h[2]!==void 0?(wt.test(h[2])&&(i=RegExp("</"+h[2],"g")),n=A):h[3]!==void 0&&(n=A):n===A?h[0]===">"?(n=i!=null?i:P,d=-1):h[1]===void 0?d=-2:(d=n.lastIndex-h[2].length,c=h[1],n=h[3]===void 0?A:h[3]==='"'?$t:yt):n===$t||n===yt?n=A:n===mt||n===vt?n=P:(n=A,i=void 0);let y=n===A&&r[l+1].startsWith("/>")?" ":"";o+=n===P?a+jt:d>=0?(s.push(c),a.slice(0,d)+At+a.slice(d)+g+y):a+g+(d===-2?l:y)}return[Et(r,o+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},N=class r{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let o=0,n=0,l=t.length-1,a=this.parts,[c,h]=Bt(t,e);if(this.el=r.createElement(c,s),x.currentNode=this.el.content,e===2||e===3){let d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(i=x.nextNode())!==null&&a.length<l;){if(i.nodeType===1){if(i.hasAttributes())for(let d of i.getAttributeNames())if(d.endsWith(At)){let f=h[n++],y=i.getAttribute(d).split(g),O=/([.?@])?(.*)/.exec(f);a.push({type:1,index:o,name:O[2],strings:y,ctor:O[1]==="."?Z:O[1]==="?"?G:O[1]==="@"?Q:k}),i.removeAttribute(d)}else d.startsWith(g)&&(a.push({type:6,index:o}),i.removeAttribute(d));if(wt.test(i.tagName)){let d=i.textContent.split(g),f=d.length-1;if(f>0){i.textContent=I?I.emptyScript:"";for(let y=0;y<f;y++)i.append(d[y],z()),x.nextNode(),a.push({type:2,index:++o});i.append(d[f],z())}}}else if(i.nodeType===8)if(i.data===xt)a.push({type:2,index:o});else{let d=-1;for(;(d=i.data.indexOf(g,d+1))!==-1;)a.push({type:7,index:o}),d+=g.length-1}o++}}static createElement(t,e){let s=w.createElement("template");return s.innerHTML=t,s}};function S(r,t,e=r,s){var n,l,a;if(t===v)return t;let i=s!==void 0?(n=e._$Co)==null?void 0:n[s]:e._$Cl,o=H(t)?void 0:t._$litDirective$;return(i==null?void 0:i.constructor)!==o&&((l=i==null?void 0:i._$AO)==null||l.call(i,!1),o===void 0?i=void 0:(i=new o(r),i._$AT(r,e,s)),s!==void 0?((a=e._$Co)!=null?a:e._$Co=[])[s]=i:e._$Cl=i),i!==void 0&&(t=S(r,i._$AS(r,t.values),i,s)),t}var Y=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var c;let{el:{content:e},parts:s}=this._$AD,i=((c=t==null?void 0:t.creationScope)!=null?c:w).importNode(e,!0);x.currentNode=i;let o=x.nextNode(),n=0,l=0,a=s[0];for(;a!==void 0;){if(n===a.index){let h;a.type===2?h=new U(o,o.nextSibling,this,t):a.type===1?h=new a.ctor(o,a.name,a.strings,this,t):a.type===6&&(h=new X(o,this,t)),this._$AV.push(h),a=s[++l]}n!==(a==null?void 0:a.index)&&(o=x.nextNode(),n++)}return x.currentNode=w,i}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},U=class r{get _$AU(){var t,e;return(e=(t=this._$AM)==null?void 0:t._$AU)!=null?e:this._$Cv}constructor(t,e,s,i){var o;this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=(o=i==null?void 0:i.isConnected)!=null?o:!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=S(this,t,e),H(t)?t===p||t==null||t===""?(this._$AH!==p&&this._$AR(),this._$AH=p):t!==this._$AH&&t!==v&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Dt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==p&&H(this._$AH)?this._$AA.nextSibling.data=t:this.T(w.createTextNode(t)),this._$AH=t}$(t){var o;let{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=N.createElement(Et(s.h,s.h[0]),this.options)),s);if(((o=this._$AH)==null?void 0:o._$AD)===i)this._$AH.p(e);else{let n=new Y(i,this),l=n.u(this.options);n.p(e),this.T(l),this._$AH=n}}_$AC(t){let e=gt.get(t.strings);return e===void 0&&gt.set(t.strings,e=new N(t)),e}k(t){tt(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let o of t)i===e.length?e.push(s=new r(this.O(z()),this.O(z()),this,this.options)):s=e[i],s._$AI(o),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){var s;for((s=this._$AP)==null?void 0:s.call(this,!1,!0,e);t!==this._$AB;){let i=_t(t).nextSibling;_t(t).remove(),t=i}}setConnected(t){var e;this._$AM===void 0&&(this._$Cv=t,(e=this._$AP)==null||e.call(this,t))}},k=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,o){this.type=1,this._$AH=p,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=p}_$AI(t,e=this,s,i){let o=this.strings,n=!1;if(o===void 0)t=S(this,t,e,0),n=!H(t)||t!==this._$AH&&t!==v,n&&(this._$AH=t);else{let l=t,a,c;for(t=o[0],a=0;a<o.length-1;a++)c=S(this,l[s+a],e,a),c===v&&(c=this._$AH[a]),n||(n=!H(c)||c!==this._$AH[a]),c===p?t=p:t!==p&&(t+=(c!=null?c:"")+o[a+1]),this._$AH[a]=c}n&&!i&&this.j(t)}j(t){t===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t!=null?t:"")}},Z=class extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===p?void 0:t}},G=class extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==p)}},Q=class extends k{constructor(t,e,s,i,o){super(t,e,s,i,o),this.type=5}_$AI(t,e=this){var n;if((t=(n=S(this,t,e,0))!=null?n:p)===v)return;let s=this._$AH,i=t===p&&s!==p||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==p&&(s===p||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,s;typeof this._$AH=="function"?this._$AH.call((s=(e=this.options)==null?void 0:e.host)!=null?s:this.element,t):this._$AH.handleEvent(t)}},X=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){S(this,t)}};var J=T.litHtmlPolyfillSupport,bt;J==null||J(N,U),((bt=T.litHtmlVersions)!=null?bt:T.litHtmlVersions=[]).push("3.3.3");var St=(r,t,e)=>{var o,n;let s=(o=e==null?void 0:e.renderBefore)!=null?o:t,i=s._$litPart$;if(i===void 0){let l=(n=e==null?void 0:e.renderBefore)!=null?n:null;s._$litPart$=i=new U(t.insertBefore(z(),l),l,void 0,e!=null?e:{})}return i._$AI(r),i};var E=globalThis,b=class extends m{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e,s;let t=super.createRenderRoot();return(s=(e=this.renderOptions).renderBefore)!=null||(e.renderBefore=t.firstChild),t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=St(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return v}},kt;b._$litElement$=!0,b.finalized=!0,(kt=E.litElementHydrateSupport)==null||kt.call(E,{LitElement:b});var st=E.litElementPolyfillSupport;st==null||st({LitElement:b});var Ct;((Ct=E.litElementVersions)!=null?Ct:E.litElementVersions=[]).push("4.2.2");var Mt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Pt=r=>(...t)=>({_$litDirective$:r,values:t}),V=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,s){this._$Ct=t,this._$AM=e,this._$Ci=s}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var Tt=Pt(class extends V{constructor(r){var t;if(super(r),r.type!==Mt.ATTRIBUTE||r.name!=="class"||((t=r.strings)==null?void 0:t.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(r){return" "+Object.keys(r).filter(t=>r[t]).join(" ")+" "}update(r,[t]){var s,i;if(this.st===void 0){this.st=new Set,r.strings!==void 0&&(this.nt=new Set(r.strings.join(" ").split(/\s/).filter(o=>o!=="")));for(let o in t)t[o]&&!((s=this.nt)!=null&&s.has(o))&&this.st.add(o);return this.render(t)}let e=r.element.classList;for(let o of this.st)o in t||(e.remove(o),this.st.delete(o));for(let o in t){let n=!!t[o];n===this.st.has(o)||(i=this.nt)!=null&&i.has(o)||(n?(e.add(o),this.st.add(o)):(e.remove(o),this.st.delete(o)))}return v}});var Wt={play:"M8 5v14l11-7z",pause:"M6 19h4V5H6v14zm8-14v14h4V5h-4z",stop:"M6 6h12v12H6z",next:"M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",prev:"M18 18L9.5 12 18 6v12zM6 6v12h2V6H6z",heart:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",heart_outline:"M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",shuffle:"M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",repeat:"M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",repeat_one:"M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z",volume:"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",volume_off:"M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",music:"M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",list_add:"M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z",switch_audio:"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"},u=(r,t=!1,e=22)=>_`
  <svg width="${e}" height="${e}" viewBox="0 0 24 24" style="display:block">
    <path d="${Wt[r]}" fill="currentColor" />
  </svg>
`,it=["off","all","one"],qt={off:"\u987A\u5E8F",all:"\u5217\u8868\u5FAA\u73AF",one:"\u5355\u66F2\u5FAA\u73AF"},Ft={off:"repeat",all:"repeat",one:"repeat_one"},j=class extends b{static get properties(){return{hass:{type:Object},config:{type:Object},_playlists:{type:Array},_lyrics:{type:Array},_lyricIndex:{type:Number},_seekPos:{type:Number},_seeking:{type:Boolean},_tick:{type:Number}}}constructor(){super(),this._playlists=null,this._lyrics=null,this._lyricIndex=-1,this._seekPos=null,this._seeking=!1,this._tick=0}setConfig(t){if(!t||!t.entity)throw new Error("\u8BF7\u914D\u7F6E MusicFlow \u64AD\u653E\u5668\u5B9E\u4F53 (entity)");this.config={show_artwork:!0,show_lyrics:!0,...t}}get _entity(){var t,e,s;return(s=(t=this.hass)==null?void 0:t.states)==null?void 0:s[(e=this.config)==null?void 0:e.entity]}get _attr(){var t;return((t=this._entity)==null?void 0:t.attributes)||{}}get _state(){var t;return(t=this._entity)==null?void 0:t.state}get _playing(){return this._state==="playing"}get _position(){return this._seeking&&this._seekPos!=null?this._seekPos:Number(this._attr.media_position||0)}get _duration(){return Number(this._attr.media_duration||0)}get _volume(){return Number(this._attr.volume_level||0)}get _repeat(){let t=this._attr.play_mode;return t==="one"?"one":t==="all"?"all":"off"}get _liked(){return!!this._attr.liked}get _songId(){return this._attr.song_id||null}connectedCallback(){super.connectedCallback(),this._ticker=setInterval(()=>this._tick++,1e3)}disconnectedCallback(){super.disconnectedCallback(),this._ticker&&clearInterval(this._ticker)}updated(t){var s,i,o;let e=t.get("hass");e&&((((o=(i=e==null?void 0:e.states)==null?void 0:i[(s=this.config)==null?void 0:s.entity])==null?void 0:o.attributes)||{}).song_id!==this._songId&&(this._loadLyrics(),this._lyricIndex=-1),this._updateLyricIndex())}_service(t,e,s={},i={}){this.hass.callService(t,e,s,{entity_id:this.config.entity,...i})}async _loadLyrics(){if(!this._songId){this._lyrics=null;return}try{let t=await this.hass.callWS({type:"musicflow/lyrics",entity_id:this.config.entity,song_id:this._songId});this._lyrics=t.lines||[]}catch{this._lyrics=[]}}async _loadPlaylists(){if(!this._playlists)try{let t=await this.hass.callWS({type:"musicflow/playlists",entity_id:this.config.entity});this._playlists=t.playlists||[]}catch{this._playlists=[]}}_togglePlay(){this._service("media_player",this._playing?"media_pause":"media_play")}_toggleLike(){this._service("musicflow","like_track")}_addToPlaylist(t){let e=t.target.value;e&&(this._service("musicflow","add_to_playlist",{playlist_id:e}),t.target.value="")}_selectSource(t){let e=t.target.value;e&&this._service("media_player","select_source",{source:e})}_cycleRepeat(){let t=it[(it.indexOf(this._repeat)+1)%it.length],e=t==="off"?"order":t;this._service("musicflow","set_play_mode",{play_mode:e})}_toggleShuffle(){this._service("musicflow","set_play_mode",{play_mode:this._attr.shuffle?"order":"shuffle"})}_toggleMute(){this._service("media_player","volume_mute",{is_volume_muted:!this._attr.is_volume_muted})}_setVolume(t){this._service("media_player","volume_set",{volume_level:Number(t.target.value)})}_seekStart(t){this._seeking=!0,this._seekPos=Number(t.target.value)}_seekInput(t){this._seekPos=Number(t.target.value)}_seekEnd(t){this._service("media_player","media_seek",{seek_position:Number(t.target.value)}),this._seekPos=null,this._seeking=!1}_updateLyricIndex(){let t=this._lyrics;if(!t||t.length===0){this._lyricIndex=-1;return}let e=this._position*1e3,s=-1;for(let i=0;i<t.length&&e>=t[i].start;i++)s=i;s!==this._lyricIndex&&(this._lyricIndex=s)}_fmt(t){if(!isFinite(t)||t<0)return"0:00";let e=Math.floor(t/60),s=Math.floor(t%60);return`${e}:${String(s).padStart(2,"0")}`}render(){var a;if(!this.hass||!this._entity)return _`<ha-card class="card"><div class="empty">未找到实体 ${(a=this.config)==null?void 0:a.entity}</div></ha-card>`;let t=this._attr,e=t.entity_picture,s=this._position,i=this._duration,o=i>0?Math.min(100,s/i*100):0,n=Ft[this._repeat],l=this._state!=="unavailable";return _`
      <ha-card class="card">
        <!-- 封面 + 元信息 -->
        <div class="top">
          <div class="art">
            ${this.config.show_artwork&&e?_`<img src="${e}" alt="" />`:u("music",!1,30)}
          </div>
          <div class="meta">
            <div class="title">${t.media_title||"\u672A\u5728\u64AD\u653E"}</div>
            <div class="artist">${t.media_artist||""}${t.media_album_name?` \xB7 ${t.media_album_name}`:""}</div>
            <div class="badge">${this._entity.entity_id}</div>
          </div>
          <!-- 心形喜欢 -->
          <button class="btn ${this._liked?"on":""}" title="喜欢 / 取消喜欢"
                  @click=${this._toggleLike} ?disabled=${!this._songId||!l}>
            ${u(this._liked?"heart":"heart_outline",this._liked,24)}
          </button>
        </div>

        <!-- 进度 -->
        <div class="progress">
          <input type="range" min="0" max=${i||100} step="1"
                 value=${Math.min(s,i||100)}
                 @pointerdown=${this._seekStart} @input=${this._seekInput}
                 @change=${this._seekEnd} ?disabled=${!l||!i} />
          <div class="time">
            <span>${this._fmt(s)}</span>
            <span>${this._fmt(i)}</span>
          </div>
        </div>

        <!-- 主控制 -->
        <div class="controls">
          <button class="btn" title="上一首" @click=${()=>this._service("media_player","media_previous_track")} ?disabled=${!l}>${u("prev")}</button>
          <button class="btn primary" title="${this._playing?"\u6682\u505C":"\u64AD\u653E"}" @click=${this._togglePlay} ?disabled=${!l}>
            ${u(this._playing?"pause":"play",!1,26)}
          </button>
          <button class="btn" title="下一首" @click=${()=>this._service("media_player","media_next_track")} ?disabled=${!l}>${u("next")}</button>
          <button class="btn" title="停止" @click=${()=>this._service("media_player","media_stop")} ?disabled=${!l}>${u("stop",!1,18)}</button>
          <button class="btn ${t.shuffle?"on":""}" title="随机播放" @click=${this._toggleShuffle} ?disabled=${!l}>${u("shuffle",!1,18)}</button>
          <button class="btn ${this._repeat!=="off"?"on":""}" title="${qt[this._repeat]}（点击切换）" @click=${this._cycleRepeat} ?disabled=${!l}>${u(n,!1,18)}</button>
        </div>

        <!-- 音量 + 静音 -->
        <div class="row">
          <label>${u(this._attr.is_volume_muted?"volume_off":"volume",!1,16)}</label>
          <input type="range" min="0" max="1" step="0.01" value=${this._volume}
                 @change=${this._setVolume} ?disabled=${!l} style="flex:1" />
          <button class="btn ${this._attr.is_volume_muted?"on":""}" title="静音" @click=${this._toggleMute} ?disabled=${!l}>${u("volume",!1,18)}</button>
        </div>

        <!-- 输出设备(切换播放器) + 添加到歌单 -->
        <div class="row">
          <label>${u("switch_audio",!1,16)} 输出</label>
          <select @change=${this._selectSource} ?disabled=${!l||!(t.source_list||[]).length}>
            ${(t.source_list||[]).map(c=>_`<option value=${c} ?selected=${c===t.source}>${c}</option>`)}
          </select>
        </div>
        <div class="row">
          <label>${u("list_add",!1,16)} 歌单</label>
          <select @focus=${this._loadPlaylists} @change=${this._addToPlaylist} ?disabled=${!this._songId}>
            <option value="">添加到歌单…</option>
            ${(this._playlists||[]).map(c=>_`<option value=${c.id}>${c.name}</option>`)}
          </select>
        </div>

        <!-- 歌词 -->
        ${this.config.show_lyrics?_`
              <div class="lyrics" id="lyrics">
                ${this._lyrics===null?_`<div class="empty">正在加载歌词…</div>`:this._lyrics.length===0?_`<div class="empty">暂无歌词</div>`:this._lyrics.map((c,h)=>_`
                          <div class="lyric ${Tt({active:h===this._lyricIndex})} ${c.value.trim()===""?"blank":""}"
                               data-idx=${h}>${c.value||"\u266A"}</div>
                        `)}
              </div>
            `:p}
      </ha-card>
    `}updated(){var s,i;if(!((s=this.config)!=null&&s.show_lyrics)||this._lyricIndex<0)return;let t=(i=this.shadowRoot)==null?void 0:i.getElementById("lyrics");if(!t)return;let e=t.querySelector(".lyric.active");if(e){let o=e.offsetTop-t.clientHeight/2+e.clientHeight/2;t.scrollTo({top:Math.max(0,o),behavior:"smooth"})}}};rt(j,"styles",B`
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
    }
    .top {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .art {
      width: 72px;
      height: 72px;
      border-radius: 8px;
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
    .meta {
      min-width: 0;
      flex: 1;
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .artist {
      font-size: 13px;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .progress {
      margin-top: 10px;
    }
    .time {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--secondary-text-color);
      margin-top: 2px;
    }
    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .btn {
      background: none;
      border: none;
      color: var(--secondary-text-color);
      cursor: pointer;
      padding: 6px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, background 0.15s;
    }
    .btn:hover {
      color: var(--primary-text-color);
      background: var(--secondary-background-color, rgba(0,0,0,0.06));
    }
    .btn.on {
      color: var(--primary-color);
    }
    .btn.primary {
      color: var(--text-primary-color, #fff);
      background: var(--primary-color);
      width: 44px;
      height: 44px;
    }
    .btn.primary:hover {
      background: var(--primary-color);
      filter: brightness(1.1);
      color: var(--text-primary-color, #fff);
    }
    .btn:disabled {
      opacity: 0.35;
      cursor: default;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }
    .row label {
      font-size: 12px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    select {
      flex: 1;
      min-width: 0;
      background: var(--input-background-color, var(--secondary-background-color));
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 13px;
    }
    input[type="range"] {
      width: 100%;
      accent-color: var(--primary-color);
      margin: 0;
    }
    .lyrics {
      margin-top: 12px;
      max-height: 240px;
      overflow-y: auto;
      border-top: 1px solid var(--divider-color, rgba(0,0,0,0.12));
      padding-top: 8px;
      scroll-behavior: smooth;
    }
    .lyric {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 14px;
      color: var(--secondary-text-color);
      transition: color 0.2s, background 0.2s;
    }
    .lyric.active {
      color: var(--primary-text-color);
      background: var(--primary-color);
      font-weight: 600;
    }
    .lyric.blank {
      opacity: 0.55;
      font-style: italic;
    }
    .empty {
      text-align: center;
      color: var(--disabled-text-color);
      font-size: 13px;
      padding: 14px 0;
    }
    .badge {
      font-size: 11px;
      color: var(--disabled-text-color);
    }
  `);customElements.define("musicflow-player-card",j);window.customCards=window.customCards||[];window.customCards.push({type:"musicflow-player-card",name:"MusicFlow Player",description:"Full MusicFlow player card. Requires MusicFlow integration 1.2.6+ and a MusicFlow media_player entity.",preview:!0});
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
