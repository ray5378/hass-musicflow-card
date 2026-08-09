var Nt=Object.defineProperty;var Rt=(r,t,e)=>t in r?Nt(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var D=(r,t,e)=>Rt(r,typeof t!="symbol"?t+"":t,e);var I=globalThis,j=I.ShadowRoot&&(I.ShadyCSS===void 0||I.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,W=Symbol(),ct=new WeakMap,O=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==W)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(j&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=ct.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&ct.set(e,t))}return t}toString(){return this.cssText}},lt=r=>new O(typeof r=="string"?r:r+"",void 0,W),K=(r,...t)=>{let e=r.length===1?r[0]:t.reduce((s,i,o)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[o+1],r[0]);return new O(e,r,W)},ht=(r,t)=>{if(j)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),i=I.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,r.appendChild(s)}},Y=j?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return lt(e)})(r):r;var{is:Dt,defineProperty:It,getOwnPropertyDescriptor:jt,getOwnPropertyNames:Bt,getOwnPropertySymbols:zt,getPrototypeOf:Ft}=Object,E=globalThis,pt=E.trustedTypes,Zt=pt?pt.emptyScript:"",G=E.reactiveElementPolyfillSupport,L=(r,t)=>r,J={toAttribute(r,t){switch(t){case Boolean:r=r?Zt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},ft=(r,t)=>!Dt(r,t),dt={attribute:!0,type:String,converter:J,reflect:!1,useDefault:!1,hasChanged:ft},ut,_t;(ut=Symbol.metadata)!=null||(Symbol.metadata=Symbol("metadata")),(_t=E.litPropertyMetadata)!=null||(E.litPropertyMetadata=new WeakMap);var g=class extends HTMLElement{static addInitializer(t){var e;this._$Ei(),((e=this.l)!=null?e:this.l=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=dt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&It(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){var n;let{get:i,set:o}=(n=jt(this.prototype,t))!=null?n:{get(){return this[e]},set(c){this[e]=c}};return{get:i,set(c){let a=i==null?void 0:i.call(this);o==null||o.call(this,c),this.requestUpdate(t,a,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){var e;return(e=this.elementProperties.get(t))!=null?e:dt}static _$Ei(){if(this.hasOwnProperty(L("elementProperties")))return;let t=Ft(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(L("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(L("properties"))){let e=this.properties,s=[...Bt(e),...zt(e)];for(let i of s)this.createProperty(i,e[i])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let i of s)e.unshift(Y(i))}else t!==void 0&&e.push(Y(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(e=>e(this))}addController(t){var e,s;((e=this._$EO)!=null?e:this._$EO=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&((s=t.hostConnected)==null||s.call(t))}removeController(t){var e;(e=this._$EO)==null||e.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){var e;let t=(e=this.shadowRoot)!=null?e:this.attachShadow(this.constructor.shadowRootOptions);return ht(t,this.constructor.elementStyles),t}connectedCallback(){var t,e;(t=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(s=>{var i;return(i=s.hostConnected)==null?void 0:i.call(s)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$EO)==null||t.forEach(e=>{var s;return(s=e.hostDisconnected)==null?void 0:s.call(e)})}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){var o;let s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){let n=(((o=s.converter)==null?void 0:o.toAttribute)!==void 0?s.converter:J).toAttribute(e,s.type);this._$Em=t,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,e){var o,n,c;let s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){let a=s.getPropertyOptions(i),l=typeof a.converter=="function"?{fromAttribute:a.converter}:((o=a.converter)==null?void 0:o.fromAttribute)!==void 0?a.converter:J;this._$Em=i;let h=l.fromAttribute(e,a.type);this[i]=(c=h!=null?h:(n=this._$Ej)==null?void 0:n.get(i))!=null?c:h,this._$Em=null}}requestUpdate(t,e,s,i=!1,o){var n,c;if(t!==void 0){let a=this.constructor;if(i===!1&&(o=this[t]),s!=null||(s=a.getPropertyOptions(t)),!(((n=s.hasChanged)!=null?n:ft)(o,e)||s.useDefault&&s.reflect&&o===((c=this._$Ej)==null?void 0:c.get(t))&&!this.hasAttribute(a._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:o},n){var c,a,l;s&&!((c=this._$Ej)!=null?c:this._$Ej=new Map).has(t)&&(this._$Ej.set(t,(a=n!=null?n:e)!=null?a:this[t]),o!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&((l=this._$Eq)!=null?l:this._$Eq=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var s,i;if(!this.isUpdatePending)return;if(!this.hasUpdated){if((s=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[n,c]of this._$Ep)this[n]=c;this._$Ep=void 0}let o=this.constructor.elementProperties;if(o.size>0)for(let[n,c]of o){let{wrapped:a}=c,l=this[n];a!==!0||this._$AL.has(n)||l===void 0||this.C(n,void 0,c,l)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),(i=this._$EO)==null||i.forEach(o=>{var n;return(n=o.hostUpdate)==null?void 0:n.call(o)}),this.update(e)):this._$EM()}catch(o){throw t=!1,this._$EM(),o}t&&this._$AE(e)}willUpdate(t){}_$AE(t){var e;(e=this._$EO)==null||e.forEach(s=>{var i;return(i=s.hostUpdated)==null?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(e=>this._$ET(e,this[e]))),this._$EM()}updated(t){}firstUpdated(t){}},mt;g.elementStyles=[],g.shadowRootOptions={mode:"open"},g[L("elementProperties")]=new Map,g[L("finalized")]=new Map,G==null||G({ReactiveElement:g}),((mt=E.reactiveElementVersions)!=null?mt:E.reactiveElementVersions=[]).push("2.1.2");var H=globalThis,$t=r=>r,B=H.trustedTypes,vt=B?B.createPolicy("lit-html",{createHTML:r=>r}):void 0,St="$lit$",w=`lit$${Math.random().toFixed(9).slice(2)}$`,xt="?"+w,qt=`<${xt}>`,C=document,U=()=>C.createComment(""),V=r=>r===null||typeof r!="object"&&typeof r!="function",ot=Array.isArray,Wt=r=>ot(r)||typeof(r==null?void 0:r[Symbol.iterator])=="function",X=`[ 	
\f\r]`,T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,yt=/-->/g,gt=/>/g,S=RegExp(`>|${X}(?:([^\\s"'>=/]+)(${X}*=${X}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),At=/'/g,bt=/"/g,Ct=/^(?:script|style|textarea|title)$/i,nt=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),m=nt(1),ie=nt(2),re=nt(3),A=Symbol.for("lit-noChange"),_=Symbol.for("lit-nothing"),Et=new WeakMap,x=C.createTreeWalker(C,129);function Pt(r,t){if(!ot(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return vt!==void 0?vt.createHTML(t):t}var Kt=(r,t)=>{let e=r.length-1,s=[],i,o=t===2?"<svg>":t===3?"<math>":"",n=T;for(let c=0;c<e;c++){let a=r[c],l,h,p=-1,v=0;for(;v<a.length&&(n.lastIndex=v,h=n.exec(a),h!==null);)v=n.lastIndex,n===T?h[1]==="!--"?n=yt:h[1]!==void 0?n=gt:h[2]!==void 0?(Ct.test(h[2])&&(i=RegExp("</"+h[2],"g")),n=S):h[3]!==void 0&&(n=S):n===S?h[0]===">"?(n=i!=null?i:T,p=-1):h[1]===void 0?p=-2:(p=n.lastIndex-h[2].length,l=h[1],n=h[3]===void 0?S:h[3]==='"'?bt:At):n===bt||n===At?n=S:n===yt||n===gt?n=T:(n=S,i=void 0);let y=n===S&&r[c+1].startsWith("/>")?" ":"";o+=n===T?a+qt:p>=0?(s.push(l),a.slice(0,p)+St+a.slice(p)+w+y):a+w+(p===-2?c:y)}return[Pt(r,o+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},N=class r{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let o=0,n=0,c=t.length-1,a=this.parts,[l,h]=Kt(t,e);if(this.el=r.createElement(l,s),x.currentNode=this.el.content,e===2||e===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(i=x.nextNode())!==null&&a.length<c;){if(i.nodeType===1){if(i.hasAttributes())for(let p of i.getAttributeNames())if(p.endsWith(St)){let v=h[n++],y=i.getAttribute(p).split(w),f=/([.?@])?(.*)/.exec(v);a.push({type:1,index:o,name:f[2],strings:y,ctor:f[1]==="."?et:f[1]==="?"?st:f[1]==="@"?it:k}),i.removeAttribute(p)}else p.startsWith(w)&&(a.push({type:6,index:o}),i.removeAttribute(p));if(Ct.test(i.tagName)){let p=i.textContent.split(w),v=p.length-1;if(v>0){i.textContent=B?B.emptyScript:"";for(let y=0;y<v;y++)i.append(p[y],U()),x.nextNode(),a.push({type:2,index:++o});i.append(p[v],U())}}}else if(i.nodeType===8)if(i.data===xt)a.push({type:2,index:o});else{let p=-1;for(;(p=i.data.indexOf(w,p+1))!==-1;)a.push({type:7,index:o}),p+=w.length-1}o++}}static createElement(t,e){let s=C.createElement("template");return s.innerHTML=t,s}};function M(r,t,e=r,s){var n,c,a;if(t===A)return t;let i=s!==void 0?(n=e._$Co)==null?void 0:n[s]:e._$Cl,o=V(t)?void 0:t._$litDirective$;return(i==null?void 0:i.constructor)!==o&&((c=i==null?void 0:i._$AO)==null||c.call(i,!1),o===void 0?i=void 0:(i=new o(r),i._$AT(r,e,s)),s!==void 0?((a=e._$Co)!=null?a:e._$Co=[])[s]=i:e._$Cl=i),i!==void 0&&(t=M(r,i._$AS(r,t.values),i,s)),t}var tt=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var l;let{el:{content:e},parts:s}=this._$AD,i=((l=t==null?void 0:t.creationScope)!=null?l:C).importNode(e,!0);x.currentNode=i;let o=x.nextNode(),n=0,c=0,a=s[0];for(;a!==void 0;){if(n===a.index){let h;a.type===2?h=new R(o,o.nextSibling,this,t):a.type===1?h=new a.ctor(o,a.name,a.strings,this,t):a.type===6&&(h=new rt(o,this,t)),this._$AV.push(h),a=s[++c]}n!==(a==null?void 0:a.index)&&(o=x.nextNode(),n++)}return x.currentNode=C,i}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},R=class r{get _$AU(){var t,e;return(e=(t=this._$AM)==null?void 0:t._$AU)!=null?e:this._$Cv}constructor(t,e,s,i){var o;this.type=2,this._$AH=_,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=(o=i==null?void 0:i.isConnected)!=null?o:!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=M(this,t,e),V(t)?t===_||t==null||t===""?(this._$AH!==_&&this._$AR(),this._$AH=_):t!==this._$AH&&t!==A&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Wt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==_&&V(this._$AH)?this._$AA.nextSibling.data=t:this.T(C.createTextNode(t)),this._$AH=t}$(t){var o;let{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=N.createElement(Pt(s.h,s.h[0]),this.options)),s);if(((o=this._$AH)==null?void 0:o._$AD)===i)this._$AH.p(e);else{let n=new tt(i,this),c=n.u(this.options);n.p(e),this.T(c),this._$AH=n}}_$AC(t){let e=Et.get(t.strings);return e===void 0&&Et.set(t.strings,e=new N(t)),e}k(t){ot(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let o of t)i===e.length?e.push(s=new r(this.O(U()),this.O(U()),this,this.options)):s=e[i],s._$AI(o),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){var s;for((s=this._$AP)==null?void 0:s.call(this,!1,!0,e);t!==this._$AB;){let i=$t(t).nextSibling;$t(t).remove(),t=i}}setConnected(t){var e;this._$AM===void 0&&(this._$Cv=t,(e=this._$AP)==null||e.call(this,t))}},k=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,o){this.type=1,this._$AH=_,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=_}_$AI(t,e=this,s,i){let o=this.strings,n=!1;if(o===void 0)t=M(this,t,e,0),n=!V(t)||t!==this._$AH&&t!==A,n&&(this._$AH=t);else{let c=t,a,l;for(t=o[0],a=0;a<o.length-1;a++)l=M(this,c[s+a],e,a),l===A&&(l=this._$AH[a]),n||(n=!V(l)||l!==this._$AH[a]),l===_?t=_:t!==_&&(t+=(l!=null?l:"")+o[a+1]),this._$AH[a]=l}n&&!i&&this.j(t)}j(t){t===_?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t!=null?t:"")}},et=class extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===_?void 0:t}},st=class extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==_)}},it=class extends k{constructor(t,e,s,i,o){super(t,e,s,i,o),this.type=5}_$AI(t,e=this){var n;if((t=(n=M(this,t,e,0))!=null?n:_)===A)return;let s=this._$AH,i=t===_&&s!==_||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==_&&(s===_||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,s;typeof this._$AH=="function"?this._$AH.call((s=(e=this.options)==null?void 0:e.host)!=null?s:this.element,t):this._$AH.handleEvent(t)}},rt=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){M(this,t)}};var Q=H.litHtmlPolyfillSupport,wt;Q==null||Q(N,R),((wt=H.litHtmlVersions)!=null?wt:H.litHtmlVersions=[]).push("3.3.3");var Mt=(r,t,e)=>{var o,n;let s=(o=e==null?void 0:e.renderBefore)!=null?o:t,i=s._$litPart$;if(i===void 0){let c=(n=e==null?void 0:e.renderBefore)!=null?n:null;s._$litPart$=i=new R(t.insertBefore(U(),c),c,void 0,e!=null?e:{})}return i._$AI(r),i};var P=globalThis,b=class extends g{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e,s;let t=super.createRenderRoot();return(s=(e=this.renderOptions).renderBefore)!=null||(e.renderBefore=t.firstChild),t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Mt(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return A}},kt;b._$litElement$=!0,b.finalized=!0,(kt=P.litElementHydrateSupport)==null||kt.call(P,{LitElement:b});var at=P.litElementPolyfillSupport;at==null||at({LitElement:b});var Ot;((Ot=P.litElementVersions)!=null?Ot:P.litElementVersions=[]).push("4.2.2");var Lt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Tt=r=>(...t)=>({_$litDirective$:r,values:t}),z=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,s){this._$Ct=t,this._$AM=e,this._$Ci=s}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var Ht=Tt(class extends z{constructor(r){var t;if(super(r),r.type!==Lt.ATTRIBUTE||r.name!=="class"||((t=r.strings)==null?void 0:t.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(r){return" "+Object.keys(r).filter(t=>r[t]).join(" ")+" "}update(r,[t]){var s,i;if(this.st===void 0){this.st=new Set,r.strings!==void 0&&(this.nt=new Set(r.strings.join(" ").split(/\s/).filter(o=>o!=="")));for(let o in t)t[o]&&!((s=this.nt)!=null&&s.has(o))&&this.st.add(o);return this.render(t)}let e=r.element.classList;for(let o of this.st)o in t||(e.remove(o),this.st.delete(o));for(let o in t){let n=!!t[o];n===this.st.has(o)||(i=this.nt)!=null&&i.has(o)||(n?(e.add(o),this.st.add(o)):(e.remove(o),this.st.delete(o)))}return A}});var Yt={play:"M8,5.14V19.14L19,12.14L8,5.14Z",pause:"M14,19H18V5H14M6,19H10V5H6V19Z",play_pause:"M3,5V19L11,12M13,19H16V5H13M18,5V19H21V5",skip_previous:"M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z",skip_next:"M16,18H18V6H16M6,18L14.5,12L6,6V18Z",power_standby:"M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19C8.14,19 5,15.88 5,12C5,9.91 5.95,7.91 7.58,6.58L6.17,5.17C2.38,8.39 1.92,14.07 5.14,17.86C8.36,21.64 14.04,22.1 17.83,18.88C19.85,17.17 21,14.65 21,12C21,9.37 19.84,6.87 17.83,5.17Z",power_off:"M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12A9,9 0 0,0 12,3M12,19A7,7 0 0,1 5,12A7,7 0 0,1 12,5A7,7 0 0,1 19,12A7,7 0 0,1 12,19Z",power_on:"M11,3H13V21H11V3Z",volume_high:"M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z",volume_off:"M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z",volume_minus:"M3,9H7L12,4V20L7,15H3V9M14,11H22V13H14V11Z",volume_plus:"M3,9H7L12,4V20L7,15H3V9M14,11H17V8H19V11H22V13H19V16H17V13H14V11Z",headphones:"M12,1C7,1 3,5 3,10V17A3,3 0 0,0 6,20H9V12H5V10A7,7 0 0,1 12,3A7,7 0 0,1 19,10V12H15V20H18A3,3 0 0,0 21,17V10C21,5 16.97,1 12,1Z",check:"M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",cast:"M1,10V12A9,9 0 0,1 10,21H12C12,14.92 7.07,10 1,10M1,14V16A5,5 0 0,1 6,21H8A7,7 0 0,0 1,14M1,18V21H4A3,3 0 0,0 1,18M21,3H3C1.89,3 1,3.89 1,5V8H3V5H21V19H14V21H21A2,2 0 0,0 23,19V5C23,3.89 22.1,3 21,3Z",stop:"M18,18H6V6H18V18Z"},$=(r,t=22)=>m`
  <svg width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="${Yt[r]}" fill="currentColor" />
  </svg>
`,Ut="musicflow",d={PAUSE:1,SEEK:2,VOLUME_SET:4,VOLUME_MUTE:8,PREVIOUS_TRACK:16,SKIP:32,NEXT_TRACK:64,TURN_OFF:128,TURN_ON:256,PLAY_MEDIA:512,VOLUME_STEP:1024,SELECT_SOURCE:2048,STOP:4096,CLEAR_PLAYLIST:8192,PLAY:16384,SHUFFLE_SET:32768,REPEAT_SET:65536,GROUPING:131072,MEDIA_ENQUEUE:524288,MEDIA_ANNOUNCE:1048576,BROWSE_MEDIA:2097152,SEARCH_MEDIA:4194304},u=(r,t)=>{var e;return!!(((e=r==null?void 0:r.attributes)==null?void 0:e.supported_features)&t)},F=r=>{let t=r==null?void 0:r.state;return t==="playing"||t==="paused"||t==="on"},Vt="unavailable";function Gt(r,t,e=!1){let s;return function(...i){let o=this,n=()=>{s=void 0,e||r.apply(o,i)},c=e&&!s;clearTimeout(s),s=setTimeout(n,t),c&&r.apply(o,i)}}var Z=class extends b{constructor(){super();D(this,"_closePickerOnOutsideClick",e=>{if(!this._showPlayerPicker)return;(e.composedPath?e.composedPath():[]).includes(this)||(this._showPlayerPicker=!1)});this._activeEntity="",this._showPlayerPicker=!1,this._narrow=!1,this._veryNarrow=!1}static get properties(){return{hass:{type:Object},config:{type:Object},_activeEntity:{type:String},_showPlayerPicker:{type:Boolean},_narrow:{type:Boolean},_veryNarrow:{type:Boolean}}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._closePickerOnOutsideClick,!0),this._attachObserver()}disconnectedCallback(){var e;super.disconnectedCallback(),document.removeEventListener("click",this._closePickerOnOutsideClick,!0),(e=this._resizeObserver)==null||e.unobserve(this)}setConfig(e){if(!e||!e.entity)throw new Error("\u8BF7\u914D\u7F6E MusicFlow \u64AD\u653E\u5668\u5B9E\u4F53 (entity)");this.config={...e},(!this._activeEntity||!this._isMusicFlowEntity(e.entity))&&(this._activeEntity=e.entity)}get _stateObj(){var e,s;return(s=(e=this.hass)==null?void 0:e.states)==null?void 0:s[this._activeEntity]}get _attr(){var e;return((e=this._stateObj)==null?void 0:e.attributes)||{}}get _state(){var e;return(e=this._stateObj)==null?void 0:e.state}get _peers(){var s,i;if(!((s=this.hass)!=null&&s.states))return[];let e=[];for(let[o,n]of Object.entries(this.hass.states)){if(!o.startsWith("media_player."))continue;let c=(i=this.hass.entities)==null?void 0:i[o];!c||c.platform!==Ut||e.push({entityId:o,state:n,available:n.state!=="unavailable"})}return e}_isMusicFlowEntity(e){var s,i,o;return((o=(i=(s=this.hass)==null?void 0:s.entities)==null?void 0:i[e])==null?void 0:o.platform)===Ut}_peerLabel(e){var s;return((s=e.state.attributes)==null?void 0:s.friendly_name)||e.entityId}_peerMeta(e){var a;let s=e.state.attributes||{},i=(a=s.queue_size)!=null?a:0,o=s.queue_position,n=s.play_mode&&s.queue_size>0&&o!=null&&o>=0,c=s.media_title;return n&&c?`${i} \u9996 \xB7 ${c}`:n?`${i} \u9996 \xB7 \u64AD\u653E\u4E2D`:i>0?`${i} \u9996 \xB7 \u7A7A\u95F2`:"\u7A7A\u95F2"}_mediaDescription(){let e=this._attr,s=e.media_title,i=e.media_artist||"",o=e.media_album_name||"",n=[];return i&&n.push(i),o&&n.push(o),s?`${s}${n.length?` \xB7 ${n.join(" \xB7 ")}`:""}`:""}_computeControlButton(){let e=this._state;return e==="on"?{icon:"play_pause",action:"media_play_pause"}:e!=="playing"?{icon:"play",action:"media_play"}:u(this._stateObj,d.PAUSE)?{icon:"pause",action:"media_pause"}:{icon:"stop",action:"media_stop"}}_fmtState(){let e=this._state;return{playing:"\u64AD\u653E\u4E2D",paused:"\u5DF2\u6682\u505C",idle:"\u7A7A\u95F2",off:"\u5DF2\u5173\u95ED",unavailable:"\u4E0D\u53EF\u7528",on:"\u5DF2\u5F00\u542F"}[e]||e||""}_label(e){return{media_play:"\u64AD\u653E",media_pause:"\u6682\u505C",media_stop:"\u505C\u6B62",media_play_pause:"\u64AD\u653E/\u6682\u505C"}[e]||e}_service(e,s,i={}){this.hass.callService(e,s,i,{entity_id:this._activeEntity})}_turnOn(){this._service("media_player","turn_on")}_turnOff(){this._service("media_player","turn_off")}_playPauseStop(){let e=this._state!=="playing"?"media_play":u(this._stateObj,d.PAUSE)?"media_pause":"media_stop";this._service("media_player",e)}_play(){this._service("media_player","media_play")}_pause(){this._service("media_player","media_pause")}_stop(){this._service("media_player","media_stop")}_previousTrack(){this._service("media_player","media_previous_track")}_nextTrack(){this._service("media_player","media_next_track")}_toggleMute(){this._service("media_player","volume_mute",{is_volume_muted:!this._attr.is_volume_muted})}_volumeDown(){this._service("media_player","volume_down")}_volumeUp(){this._service("media_player","volume_up")}_selectedVolumeChanged(e){this._service("media_player","volume_set",{volume_level:Number(e.target.value)})}_togglePlayerPicker(e){e.stopPropagation(),this._showPlayerPicker=!this._showPlayerPicker}_switchPeer(e){if(!e||e===this._activeEntity){this._showPlayerPicker=!1;return}this._showPlayerPicker=!1,this._activeEntity=e,this.requestUpdate()}_attachObserver(){this._resizeObserver||(this._resizeObserver=new ResizeObserver(Gt(()=>this._measureCard(),250,!1))),this._resizeObserver.observe(this)}_measureCard(){this.isConnected&&(this._narrow=(this.clientWidth||0)<300,this._veryNarrow=(this.clientWidth||0)<225)}render(){var v,y;if(!this.hass||!this._stateObj)return m`<hui-warning>未找到实体 ${((v=this.config)==null?void 0:v.entity)||""}</hui-warning>`;let e=this._stateObj,s=this._state,i=e.attributes.assumed_state===!0,o=this._computeControlButton(),n=this._attr,c=this._peers,a=this.hass.formatEntityName?this.hass.formatEntityName(e,(y=this.config)==null?void 0:y.name):n.friendly_name||this._activeEntity,l=m`
      ${!this._narrow&&(s==="playing"||i)&&u(e,d.PREVIOUS_TRACK)?m`<button class="action" title="上一首" @click=${this._previousTrack}>${$("skip_previous",24)}</button>`:""}
      ${!i&&(s==="playing"&&(u(e,d.PAUSE)||u(e,d.STOP))||(s==="paused"||s==="idle")&&u(e,d.PLAY)||s==="on"&&(u(e,d.PLAY)||u(e,d.PAUSE)))?m`<button class="action" title=${this._label(o.action)} @click=${this._playPauseStop}>${$(o.icon,30)}</button>`:""}
      ${i&&u(e,d.PLAY)?m`<button class="action" title="播放" @click=${this._play}>${$("play",24)}</button>`:""}
      ${i&&u(e,d.PAUSE)?m`<button class="action" title="暂停" @click=${this._pause}>${$("pause",24)}</button>`:""}
      ${i&&u(e,d.STOP)&&!u(e,d.VOLUME_SET)?m`<button class="action" title="停止" @click=${this._stop}>${$("stop",24)}</button>`:""}
      ${(s==="playing"||i&&!u(e,d.VOLUME_SET))&&u(e,d.NEXT_TRACK)?m`<button class="action" title="下一首" @click=${this._nextTrack}>${$("skip_next",24)}</button>`:""}
    `,h=(u(e,d.VOLUME_STEP)||u(e,d.VOLUME_SET))&&F(e),p=this._mediaDescription()||this._fmtState();return m`
      <div class="row" style="position:relative">
        <!-- 左上角 DLNA 图标:点击打开 MusicFlow 播放器切换器(唯一改动点) -->
        <span class="badge-wrap" @click=${this._togglePlayerPicker} title="切换播放器">
          <state-badge .stateObj=${e}></state-badge>
        </span>

        <div class="info" .title=${a}>
          ${a}
          <div class="secondary">${p}</div>
        </div>

        <div class="controls">
          ${u(e,d.TURN_ON)&&(!F(e)||i)&&s!==Vt?m`<button class="action" title="开启" @click=${this._turnOn}>${$(i?"power_on":"power_standby",22)}</button>`:""}
          ${!u(e,d.VOLUME_SET)&&!u(e,d.VOLUME_STEP)&&(F(e)||i||!u(e,d.TURN_ON)||s===Vt)?l:""}
          ${u(e,d.TURN_OFF)&&(F(e)||i)?m`<button class="action" title="关闭" @click=${this._turnOff}>${$(i?"power_off":"power_standby",22)}</button>`:""}
        </div>

        <!-- 播放器切换器下拉(图标点击弹出) -->
        ${this._showPlayerPicker?m`
          <div class="picker" @click=${f=>f.stopPropagation()}>
            <div class="picker-title">切换播放器</div>
            ${c.length===0?m`<div class="picker-item-meta" style="padding:6px 8px">没有 MusicFlow 播放器</div>`:c.map(f=>m`
                  <div class="picker-item ${Ht({active:f.entityId===this._activeEntity,offline:!f.available})}"
                       @click=${()=>this._switchPeer(f.entityId)}>
                    <span class="picker-item-icon">${$("headphones",18)}</span>
                    <div class="picker-item-info">
                      <div class="picker-item-name">${this._peerLabel(f)}</div>
                      <div class="picker-item-meta">${this._peerMeta(f)}</div>
                    </div>
                    ${f.entityId===this._activeEntity?$("check",18):_}
                  </div>`)}
          </div>
        `:_}
      </div>

      <!-- 音量(官方第二行) -->
      ${h?m`
        <div class="flex">
          <div class="volume">
            ${u(e,d.VOLUME_MUTE)?m`<button class="action" title="静音" @click=${this._toggleMute}>${$(n.is_volume_muted?"volume_off":"volume_high",20)}</button>`:""}
            ${!this._veryNarrow&&u(e,d.VOLUME_SET)?m`<input type="range" min="0" max="1" step="0.01" value=${Number(n.volume_level||0)} @change=${this._selectedVolumeChanged} />`:!this._veryNarrow&&u(e,d.VOLUME_STEP)?m`<button class="action" title="音量-" @click=${this._volumeDown}>${$("volume_minus",20)}</button>
                       <button class="action" title="音量+" @click=${this._volumeUp}>${$("volume_plus",20)}</button>`:""}
          </div>
          <div class="controls">${l}</div>
        </div>
      `:""}
    `}};D(Z,"styles",K`
    :host {
      display: block;
    }
    .row {
      display: flex;
      align-items: center;
      flex-direction: row;
      width: 100%;
      outline: none;
    }
    .badge-wrap {
      flex: 0 0 40px;
      display: flex;
      align-items: center;
      cursor: pointer;
      border-radius: 50%;
    }
    .badge-wrap:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .info {
      padding-left: 16px;
      padding-right: 8px;
      padding-inline-start: 16px;
      padding-inline-end: 8px;
      flex: 1 1 30%;
      min-width: 0;
    }
    .info,
    .info > * {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .name {
      color: var(--primary-text-color);
    }
    .secondary {
      color: var(--secondary-text-color);
    }
    .flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 4px;
    }
    .volume {
      display: flex;
      align-items: center;
      flex-grow: 2;
      flex-shrink: 2;
    }
    .controls {
      white-space: nowrap;
      direction: ltr;
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
      vertical-align: middle;
    }
    .action:hover {
      color: var(--primary-color);
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .action:disabled {
      opacity: 0.35;
      cursor: default;
    }
    .volume input[type="range"] {
      flex-grow: 2;
      flex-shrink: 2;
      width: 100%;
      min-width: 0;
      accent-color: var(--primary-color);
    }

    /* Player switcher dropdown (shown when the badge is tapped) */
    .picker-wrap { position: relative; }
    .picker {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
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
    .picker-title {
      font-size: 11px;
      color: var(--secondary-text-color);
      padding: 4px 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
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
  `);customElements.define("musicflow-player-card",Z);var Jt=[{name:"entity",required:!0,selector:{entity:{domain:"media_player"}}}],q=class extends b{setConfig(t){this.config=t}render(){return!this.hass||!this.config?_:m`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${Jt}
        .computeLabel=${t=>{var e;return(e=t.label)!=null?e:t.name}}
        @value-changed=${this._onChange}
      ></ha-form>
    `}_onChange(t){this.dispatchEvent(new CustomEvent("config-changed",{detail:{value:t.detail.value},bubbles:!0,composed:!0}))}};D(q,"properties",{hass:{type:Object},config:{type:Object}});customElements.define("musicflow-player-card-editor",q);window.customCards=window.customCards||[];window.customCards.push({type:"musicflow-player-card",name:"MusicFlow Player",description:"Official HA media_player controls with one MusicFlow enhancement: tap the DLNA icon to switch between MusicFlow players. Requires MusicFlow integration 1.2.6+.",preview:!0});
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
