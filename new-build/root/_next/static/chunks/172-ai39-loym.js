(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,4543,e=>{e.v({"perfect-pair-popup":"WCrfCq_perfect-pair-popup","side-bet-mobile-popup-amount":"WCrfCq_side-bet-mobile-popup-amount","side-bet-mobile-popup-container":"WCrfCq_side-bet-mobile-popup-container","side-bet-mobile-popup-item":"WCrfCq_side-bet-mobile-popup-item","side-bet-mobile-popup-values":"WCrfCq_side-bet-mobile-popup-values","side-bet-mobile-popup-win-name":"WCrfCq_side-bet-mobile-popup-win-name","twenty-one-popup":"WCrfCq_twenty-one-popup"})},761619,e=>{"use strict";var a=e.i(380447),t=e.i(28729),l=e.i(121930),n=e.i(871320),s=e.i(802580),r=e.i(688808),i=e.i(113951),d=e.i(702123),c=e.i(441543),o=e.i(932867),u=e.i(999161),p=e.i(580663),h=e.i(142763),f=e.i(946197),m=e.i(505353),b=e.i(386547);let y=(0,u.forwardRef)((e,t)=>{let{isMobile:l,specialBlackjackDisplay:n}=e,s=(0,u.useRef)();return(0,u.useImperativeHandle)(t,()=>({playAnimation:()=>{s.current&&s.current.isActive()||(console.log("playAnimation"),s.current&&s.current.kill(),s.current=f.U.timeline({paused:!1}),s.current.to(`.${h.default["masked-texture-container"]}`,{duration:3,maskImage:`linear-gradient(
          45deg,
          rgba(0, 0, 0, 0.1) 95%,
          rgba(0, 0, 0, 0.2) 100%,
          rgba(0, 0, 0, 0.2) 105%,
          rgba(0, 0, 0, 0.1) 110%
        )`,maskSize:"200% 100%",maskPosition:"100% 0",ease:"power1.inOut",yoyo:!0,repeat:1,from:`linear-gradient(
          80deg,
          rgba(0, 0, 0, 0.1) -10%,
          rgba(0, 0, 0, 0.2) -5%,
          rgba(0, 0, 0, 0.2) -2%,
          rgba(0, 0, 0, 0.1) -0%
        )`}))}})),(0,a.jsx)(a.Fragment,{children:(0,a.jsx)("div",{className:(0,b.c)(h.default["background-container"],l&&h.default["mobile-display"],n&&h.default["blackjack-effect"]),children:(0,a.jsx)("div",{className:h.default["table-container"]})})})});y.displayName="BackgroundDisplay";var g=e.i(562028),k=e.i(591953),v=e.i(326276);let H={coloured_pair:"Coloured Pair",flush:"Flush",mixed_pair:"Mixed Pair",perfect_pair:"Perfect Pair",straight:"Straight",straight_flush:"Straight Flush",suited_trips:"Suited Trips",three_of_a_kind:"Three of a Kind"},A="main-bet",S={CAD:{MAX_AMOUNT:1e3,MIN_AMOUNT:.1},USD:{MAX_AMOUNT:1e3,MIN_AMOUNT:.1}};var w=e.i(919244),C=e.i(278033),j=e.i(971376);e.i(59015);var x=e.i(679284),D=e.i(850435),T=e.i(101104),P=e.i(998165),N=e.i(392276),_=e.i(639670);let R=e=>({active:!1,activeGame:!1,betAmount:null,errors:{active:!1,text:""},result:null,type:e}),B=()=>({perfectPair:R("perfect_pair"),twentyOne:R("21_plus_3")}),I=(0,_.g)(B()),O={active:!1,text:""},K=(0,_.g)(O),E=(0,_.g)(e=>e(I).perfectPair,(e,a,t)=>{let l=e(I).perfectPair,n="function"==typeof t?t(l):t;a(I,e=>({...e,perfectPair:n}))}),M=(0,_.g)(e=>e(I).twentyOne,(e,a,t)=>{let l=e(I).twentyOne,n="function"==typeof t?t(l):t;a(I,e=>({...e,twentyOne:n}))}),F={"21_plus_3":"twentyOne",perfect_pair:"perfectPair"},U=(e,a,t)=>{let l=F[a];return{...e,[l]:t(e[l])}},W=e=>"21+3"===e?"21_plus_3":e,G=e=>({multiplier:e.multiplier??"0",payout:e.payout??"0",sub_type:e.sub_type,type:W(e.type)}),L={"21_plus_3":"21+3",perfect_pair:"Perfect Pair"},Q="side-bet-perfect-pair-popup";var $=e.i(420422),q=e.i(185457),V=e.i(385993);let X=()=>(0,a.jsx)(m.f,{src:"/originals/blackjack/double.svg"}),J=()=>(0,a.jsx)(m.f,{src:"/originals/blackjack/hit.svg"}),z=()=>(0,a.jsx)(m.f,{src:"/originals/blackjack/insurance.svg"}),Y=()=>(0,a.jsx)(m.f,{src:"/originals/blackjack/notice.svg"}),Z=()=>(0,a.jsx)(m.f,{src:"/originals/blackjack/split.svg"}),ee=()=>(0,a.jsx)(m.f,{src:"/originals/blackjack/stand.svg"}),ea=e=>{let{dispatchAction:t,isMobile:l,lockActionButtons:n=!0,publicGameState:s}=e,r=(0,T.s)(),i=(0,u.useMemo)(()=>s?.playerHands?.[s?.currentHandIndex]?.availableActions,[s?.playerHands,s?.currentHandIndex]),d=(0,u.useMemo)(()=>(0,a.jsx)("div",{className:h.default["insurance-container"],children:(0,a.jsxs)("div",{className:h.default["insurance-inner"],children:[(0,a.jsxs)("div",{className:h.default["insurance-heading"],children:[(0,a.jsxs)("div",{className:h.default["insurance-icon-container"],children:[(0,a.jsx)(z,{}),(0,a.jsx)("span",{children:r("blackjack_insurance_heading")})]}),(0,a.jsxs)("div",{className:h.default["insurance-bet-amount"],children:[(0,a.jsx)("span",{children:r("blackjack_game_total")}),(0,a.jsx)(q.F,{amount:(0,V.f)(s?.betAmount).div(2).toNumber(),currencyCode:s?.currency,raw:!0})]})]}),(0,a.jsxs)("div",{className:h.default["insurance-buttons-container"],children:[(0,a.jsx)($.K,{className:"min-w-[123px] flex-1",onClick:()=>t({insurance:!0}),variant:"default",children:r("blackjack_game_yes")},"insurance-yes"),(0,a.jsx)($.K,{className:"min-w-[123px] flex-1",onClick:()=>t({insurance:!1}),variant:"default",children:r("blackjack_game_no")},"insurance-no")]}),(0,a.jsxs)("div",{className:h.default.description,children:[(0,a.jsx)(Y,{}),(0,a.jsx)("p",{children:r("blackjack_insurance_description")})]})]})}),[s?.betAmount,s?.currency,r,t]);return(0,a.jsxs)("div",{className:(0,b.c)(h.default["blackjack-ui-container"],l&&h.default.mobile),children:[!!s?.insuranceOffered&&!n&&d,(0,a.jsx)("div",{className:h.default["action-buttons-container"],children:["double","hit","stand","split"].map(e=>{let l;return l=({double:X,hit:J,split:Z,stand:ee})[e],(0,a.jsxs)("button",{className:(0,b.c)(h.default["action-button"],h.default[e],i?.[e]&&!n&&h.default.active),onClick:()=>t({[e]:!0}),onKeyDown:e=>{e.preventDefault()},children:[(0,a.jsx)("div",{className:h.default["action-icon"],children:(0,a.jsx)(l,{})}),r(`blackjack_${e}`)]},e)})})]})};var et=e.i(747280),el=e.i(384807),en=e.i(171416),es=e.i(421136),er=e.i(373268),ei=e.i(802772),ed=e.i(272313),ec=e.i(888428),eo=e.i(832910),eu=e.i(662590),ep=e.i(282780),eh=e.i(217280);let ef={selectedChipAmount:null,selectedTarget:null},em=(0,_.g)(ef);function eb(){let e=(0,D.y)(em),a=(0,D.F)(em),t=(0,u.useCallback)(e=>{a(a=>({...a,selectedChipAmount:e}))},[a]),l=(0,u.useCallback)(e=>{a(a=>({selectedChipAmount:a.selectedChipAmount===e?null:e,selectedTarget:a.selectedChipAmount===e?null:a.selectedTarget}))},[a]),n=(0,u.useCallback)(e=>{a(a=>({...a,selectedTarget:e}))},[a]),s=(0,u.useCallback)(()=>{a(ef)},[a]);return(0,eh.f)({onReset:s}),{chipMode:e,chipModeAtom:em,clearChipMode:s,isChipModeActive:null!==e.selectedChipAmount,selectedChipAmount:e.selectedChipAmount,selectedTarget:e.selectedTarget,setChipModeTarget:n,setSelectedChipAmount:t,toggleSelectedChipAmount:l}}function ey(e){let{disabled:a=!1,maxAmount:t,selectedChipAmount:l,setBetAmount:n,setChipModeTarget:s,target:r}=e;return(0,u.useCallback)(()=>{a||(s(r),null!==l&&n(e=>{let a=(0,V.f)(e||0),n=a.plus((0,V.f)(l));if("number"!=typeof t||!Number.isFinite(t))return n.toNumber();let s=(0,V.f)(t);return a.gte(s)?a.toNumber():n.gt(s)?s.toNumber():n.toNumber()}))},[a,t,l,n,s,r])}let eg={"21_plus_3":M,perfect_pair:E};function ek(e){let[a,t]=(0,D.q)(eg[e]),l=(0,u.useCallback)(e=>{t(a=>({...a,active:e}))},[t]),n=(0,u.useCallback)(()=>{t(e=>({...e,active:!e.active}))},[t]),s=(0,u.useCallback)(e=>{t(a=>({...a,betAmount:"function"==typeof e?e(a.betAmount):e}))},[t]),r=(0,u.useCallback)(e=>{t(a=>({...a,errors:e}))},[t]),i=(0,u.useCallback)(e=>{t(a=>({...a,result:e?{multiplier:e.multiplier??"0",payout:e.payout??"0",sub_type:e.sub_type??null,type:a.type}:null}))},[t]),d=(0,u.useCallback)(()=>{t(e=>({...e,result:null}))},[t]),c=(0,u.useCallback)(()=>{t({active:!1,activeGame:!1,betAmount:null,errors:{active:!1,text:""},result:null,type:e})},[t,e]);return{clearResults:d,resetBetAmountOnly:(0,u.useCallback)(()=>{t(e=>({...e,betAmount:null}))},[t]),resetSideBet:c,setActive:l,setBetAmount:s,setErrors:r,setResults:i,sideBetData:a,toggleActive:n}}let ev=e=>{if("number"==typeof e)return Number.isFinite(e)?e:0;if("string"==typeof e){let a=Number(e);return Number.isFinite(a)?a:0}return 0},eH={MAX_AMOUNT:8e3,MIN_AMOUNT:.1},eA=(0,u.memo)(function(e){let{betLimits:t,label:l,optionalCurrencyCode:n,resultCurrencyCode:s}=e,{rawBalance:r}=(0,eo.P)(),{walletSetting:i}=(0,ec.f)(),{activeRate:d}=(0,ed.S)(),{currencies:c}=(0,eu.f)(),{isGcActive:o}=(0,x.f)(),u=(0,T.s)(),{isChipModeActive:p,selectedChipAmount:h,setChipModeTarget:f}=eb(),{resetBetAmountOnly:m,setActive:y,setBetAmount:g,setErrors:k,sideBetData:v}=ek(l),{active:A,activeGame:S,betAmount:w,errors:C,result:D,type:P}=v,N=n||i,_=c?.[N]?.display?.decimals??d?.display?.decimals??2,R=Number(r??0),B=(0,j.C)(t?.[N]||t?.[i],"side-bet")||eH,I=(0,j.P)(B,{isGcActive:o})??B,O=ey({disabled:S,maxAmount:I.MAX_AMOUNT,selectedChipAmount:h,setBetAmount:g,setChipModeTarget:f,target:P}),K=L[P],E=ev(w),M=ev(I.MIN_AMOUNT),F=!!D,U=F&&D?.sub_type===null,W=!S&&E>0,G=D?.payout?Number(D?.payout):0;return(0,a.jsxs)("div",{className:(0,b.c)(ei.default["side-bet-container"],{[ei.default["active-chip-mode"]]:p,[ei.default["side-bet-container-active"]]:A,[ei.default["side-bet-container-locked"]]:S,[ei.default["side-bet-container-result-state"]]:F,[ei.default["side-bet-container-result-state-lost"]]:U,[ei.default["side-bet-container-result-state-win"]]:D?.sub_type}),children:[(0,a.jsx)("span",{className:ei.default["side-bet-label"],children:u(l)}),(0,a.jsxs)("div",{className:ei.default["side-bet-icon-background-container"],onClick:e=>{e.stopPropagation(),e.preventDefault(),S||(p||y(!A),O())},onKeyDown:e=>{e.preventDefault(),e.stopPropagation()},role:"button",children:[D?.sub_type&&(0,a.jsxs)("div",{className:ei.default["win-state-overlay-container"],children:[(0,a.jsxs)("span",{className:ei.default["win-multiplier"],children:[D?.multiplier,"x"]}),(0,a.jsx)("span",{className:(0,b.c)(ei.default["win-amount"],{[ei.default["win-amount-small"]]:G>999}),children:(0,a.jsx)(q.F,{amount:G,currencyCode:s,raw:!0})})]}),(0,a.jsx)("div",{className:ei.default["side-bet-icon-background"],children:(0,a.jsx)(er.f,{className:ei.default["side-bet-icon"]})}),(0,a.jsx)(es.f,{chipAmount:E,chipMinThreshold:M,showToggle:!1})]}),(0,a.jsx)("div",{className:ei.default["win-description-container"],children:D?.sub_type&&(0,a.jsx)("span",{className:ei.default["win-description"],children:H[D.sub_type]})}),(0,a.jsx)("div",{className:ei.default["side-bet-input-wrapper"],children:(0,a.jsx)("div",{className:ei.default["side-bet-input-content"],children:(0,a.jsxs)("div",{className:ei.default["side-bet-inner-wrapper"],children:[(0,a.jsx)("button",{className:(0,b.c)(ei.default["side-bet-inline-button"],ei.default["side-bet-inline-button-half"]),onClick:e=>{e.stopPropagation(),e.preventDefault(),(0,ep.c)(g,_)},onKeyDown:e=>{e.preventDefault(),e.stopPropagation()},children:(0,a.jsx)(et.f,{className:ei.default["half-icon"]})}),(0,a.jsx)(en.f,{betAmount:w,betLimits:B,currencyCodePlaceholder:!0,inputError:C,isUiDisabled:!A,label:K,optionalCurrencyCode:n,setBetAmount:e=>g(e),setInputError:k}),(0,a.jsx)("button",{className:(0,b.c)(ei.default["side-bet-inline-button"],ei.default["side-bet-inline-button-double"]),onClick:e=>{e.stopPropagation(),e.preventDefault(),E?(0,ep.V)(g,I.MAX_AMOUNT,R,_):g(I.MIN_AMOUNT)},onKeyDown:e=>{e.preventDefault(),e.stopPropagation()},children:(0,a.jsx)(el.f,{})})]})})}),(0,a.jsx)(es.f,{isResetButtonActive:W,onReset:m,showResetButton:!0,showToggle:!1})]})});eA.displayName="BjSideBet";var eS=e.i(226261),ew=e.i(582300);let eC=e=>{if("number"==typeof e)return Number.isFinite(e)?e:0;if("string"==typeof e){let a=Number(e);return Number.isFinite(a)?a:0}return 0},ej={MAX_AMOUNT:8e3,MIN_AMOUNT:.1},ex=(0,u.memo)(function(e){let{betLimits:t,label:l,optionalCurrencyCode:n,resultCurrencyCode:s}=e,r=(0,T.s)(),{walletSetting:i}=(0,ec.f)(),{isGcActive:d}=(0,x.f)(),{selectedChipAmount:c,selectedTarget:o,setChipModeTarget:u}=eb(),{resetBetAmountOnly:p,setBetAmount:h,setErrors:f,sideBetData:m}=ek(l),{activeGame:y,betAmount:g,errors:k,result:v,type:A}=m,S=n||i,w=(0,j.C)(t?.[S]||t?.[i],"side-bet")||ej,C=(0,j.P)(w,{isGcActive:d})??w,D=L[A],P=eC(g),N=!!v,_=N&&v?.sub_type===null,R=null!==c&&o===A,B=v?.payout?Number(v?.payout):0,I=!y&&P>0,O=ey({disabled:y,maxAmount:C.MAX_AMOUNT,selectedChipAmount:c,setBetAmount:h,setChipModeTarget:u,target:A});return(0,a.jsxs)("div",{className:(0,b.c)(ew.default["side-bet-mobile-container"],{[ew.default["side-bet-mobile-container-locked"]]:y,[ew.default["side-bet-mobile-container-result-state"]]:N,[ew.default["side-bet-mobile-container-result-state-lost"]]:_,[ew.default["side-bet-mobile-container-result-state-win"]]:v?.sub_type}),children:[(0,a.jsxs)("div",{className:ew.default["side-bet-mobile-container-label-container"],children:[(0,a.jsx)("label",{className:ew.default["side-bet-label"],children:r(l)}),v?.sub_type&&(0,a.jsx)("span",{className:ew.default["win-description"],children:H[v.sub_type]})]}),(0,a.jsxs)("div",{className:(0,b.c)(ew.default["side-bet-input-wrapper"],{[ew.default["side-bet-input-wrapper-chip-focus"]]:R}),children:[v?.sub_type&&(0,a.jsx)("div",{className:ew.default["win-display-container"],children:(0,a.jsxs)("div",{className:ew.default["win-display-content"],children:[(0,a.jsx)("span",{className:ew.default["win-amount"],children:(0,a.jsx)(q.F,{amount:B,currencyCode:s,raw:!0})}),(0,a.jsx)("span",{className:ew.default["win-multiplier-divider"],children:"·"}),(0,a.jsxs)("span",{className:ew.default["win-multiplier"],children:[v?.multiplier,"x"]})]})}),(0,a.jsx)(eS.f,{betAmount:g,betLimits:t,hideInlineButtons:!!v?.sub_type,inputError:k,isUiDisabled:y,label:D,optionalBetLimitKey:"side-bet",optionalCurrencyCode:n,setBetAmount:e=>h(e),setInputError:f}),(0,a.jsx)(es.f,{chipAmount:P,chipMinThreshold:eC(C.MIN_AMOUNT),isResetButtonActive:I,onClick:O,onReset:p,selectedChipAmount:c,showResetButton:!0,variant:"side-bet-mobile"})]})]})});ex.displayName="BjSideBetMobile";var eD=e.i(242086),eT=e.i(122168),eP=e.i(254010),eN=e.i(38916),e_=e.i(486148);let eR=(0,eD.u)("/originals/blackjack/chip.mp3"),eB=()=>{let e=(0,eT.f)(eR,{volume:.05}),{walletSetting:t}=(0,ec.f)(),{isGcActive:l}=(0,x.f)(),{selectedChipAmount:n,toggleSelectedChipAmount:s}=eb(),r=(0,D.F)(E),i=(0,D.F)(M),d=(0,eN.X)(t,{isGcActive:l});return(0,a.jsx)("div",{className:h.default["chip-display"],children:d.map((t,l)=>{let d=t.adjustedValue,c=d>999,o=(0,eN.p)(d);return(0,a.jsxs)("button",{onClick:()=>{e(),null===n&&d>0&&(r(e=>({...e,active:!0})),i(e=>({...e,active:!0}))),s(d)},className:(0,b.c)(h.default["chip-button"],{[h.default["chip-button-white"]]:"white"===t.name,[h.default["chip-button-active"]]:n===d}),children:[(0,a.jsxs)("div",{className:h.default["chip-content-container"],children:[(0,a.jsx)("span",{className:c?h.default["chip-value-compact"]:"",children:o}),(0,a.jsx)("div",{className:h.default["chip-image-container"],children:(0,a.jsx)(eP.f,{"aria-label":`${t.value} chip`,chipName:t.name,role:"img"})})]}),(0,a.jsx)("div",{className:h.default["chip-highlight-container"],children:(0,a.jsx)(e_.f,{})})]},t.name+"-"+l)})})},eI=e=>{if("number"==typeof e)return Number.isFinite(e)?e:0;if("string"==typeof e){let a=Number(e);return Number.isFinite(a)?a:0}return 0},eO=(0,u.memo)(function(e){let{startNewGame:t,dispatchAction:l,publicGameState:n,isLoading:s,inGame:r,isMobile:i,setDemoMode:d,demoMode:c,setBetAmount:o,betAmount:p,lockActionButtons:f,walletSetting:m,resetGameBoard:y,resetSideBets:H,onFreeplayLoadRef:P}=e,N=(0,u.useRef)(!1),_=(0,g.f)("freePlayControls"),R=(0,D.y)(v.t),B=(0,D.y)(v.B),I=(0,D.y)(K),O=(0,D.y)(E),F=(0,D.y)(M),U=!_?.displayed&&B,W=(0,D.y)(v.w),G=W&&Object.keys(W).length>0?W:S,{visualActiveFreeplay:L=null}=R||{},Q=!!O?.errors?.active||!!F?.errors?.active,$=(0,T.s)(),{selectedChipAmount:q,selectedTarget:V,setChipModeTarget:X}=eb(),[J,z]=(0,u.useState)({text:!1,fixedValue:null}),{isGcActive:Y}=(0,x.f)(),Z=(0,j.I)({isGcActive:Y,limits:W?.[m],optionalBetLimitKey:A}),ee=ey({selectedChipAmount:q,target:"main",setChipModeTarget:X,setBetAmount:o,maxAmount:Z?.MAX_AMOUNT,disabled:f||r}),et=eI(p),el=eI(Z?.MIN_AMOUNT)||1,en=!f&&!r&&et>0,er=(0,a.jsxs)("div",{className:(0,b.c)(h.default["bet-input-field-container"],null!==q&&"main"===V&&h.default["bet-input-field-container-chip-focus"],i&&h.default["mobile-display"]),children:[(0,a.jsx)(C.f,{labelDisplay:!1,setBetAmount:o,setDemoMode:d,betAmount:p,style:{marginBottom:"0px"},ignoreErrors:f||r,optionalBetLimitKey:A,setOutSideError:z,outsideErrorMessage:!r&&I?.text}),(0,a.jsx)(es.f,{selectedChipAmount:q,onClick:ee,variant:"main-bet",chipAmount:p,chipMinThreshold:el,showResetButton:!0,isResetButtonActive:en,onReset:()=>o(null)})]}),ei=(0,a.jsx)(ea,{dispatchAction:l,publicGameState:n,isLoading:s,lockActionButtons:f,isMobile:i});(0,u.useEffect)(()=>(_?.displayed?(o(null),d({text:!1,active:!1}),H(),N.current=!0,P.current||y(!0),P.current=!1):N.current&&(y(!0),N.current=!1),()=>{}),[_?.displayed,H]);let ed=(0,a.jsx)("div",{className:(0,b.c)(h.default["bet-btn-container"],(f||r)&&h.default["locked-btn"]),children:(0,a.jsx)(w.f,{placeBet:t,deActive:r||f||J?.text||I?.active||Q||_?.displayed&&!L||_?.displayed&&L&&L?.currency!==m,freeplay:_?.displayed,popupPosition:"top",text:_?.displayed?$("use_freeplay"):!s&&$(c?.text?"place_demo_bet":"place_bet"),style:{padding:"13px",height:"40px"}})}),ec="string"==typeof n?.currency?n.currency:void 0,eo=(0,a.jsx)(eA,{label:"perfect_pair",betLimits:G,optionalCurrencyCode:m,resultCurrencyCode:ec}),eu=(0,a.jsx)(eA,{label:"21_plus_3",betLimits:G,optionalCurrencyCode:m,resultCurrencyCode:ec}),ep="mobile-one"!==i&&"mobile-two"!==i;return(0,a.jsxs)("div",{className:(0,b.c)(h.default["bet-bar-content"],h.default[i],!ep&&h.default["active-desktop-side-bets"],"mobile-two"!==i&&"mobile-three"!==i&&"mobile-four"!==i&&_?.displayed&&h.default["blackjack-free-play-container"]),children:[ed,(0,a.jsxs)("div",{className:h.default["side-bets-row"],children:[U&&ep&&eo,(0,a.jsxs)("div",{className:h.default["bet-bar-inner-container"],children:[ei,(0,a.jsx)("div",{className:(0,b.c)(h.default["bet-input-container"],r&&h.default["in-game"],f&&h.default["in-game"]),children:_?.displayed?(0,a.jsx)(k.f,{oldIsMobile:i,type:"blackjack"}):(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(eB,{}),er]})}),U&&!ep&&(0,a.jsxs)("div",{className:(0,b.c)(h.default["mobile-side-bets-container"],("mobile-four"===i||"mobile-three"===i)&&h.default["vertical-side-bets"]),children:[(0,a.jsx)(ex,{label:"perfect_pair",betLimits:G,optionalCurrencyCode:m,resultCurrencyCode:ec}),(0,a.jsx)(ex,{label:"21_plus_3",betLimits:G,optionalCurrencyCode:m,resultCurrencyCode:ec})]})]}),U&&ep&&eu]})]})});var eK=e.i(137892);let eE=()=>(0,a.jsx)(m.f,{src:"/originals/blackjack/deck-slider.svg"});function eM(e){let{cardDeckRef:t,isMobile:l}=e,n=(0,u.useMemo)(()=>Array.from({length:4},(e,t)=>(0,a.jsx)(eK.f,{},t)),[]);return(0,a.jsxs)("div",{className:` ${h.default[l]} ${h.default["card-deck"]} `,id:"blackjack-card-deck",ref:t,children:[(0,a.jsx)("div",{className:h.default["inner-deck"],children:n}),(0,a.jsx)("div",{className:h.default["deck-slider"],children:(0,a.jsx)(eE,{})})]})}var eF=e.i(19042);let eU=()=>(0,a.jsx)(m.f,{src:"/originals/blackjack/ribbon.svg"}),eW=()=>(0,a.jsx)(m.f,{src:"/originals/blackjack/ribbon-bottom.svg"});function eG(e){let{isMobile:t,showLogo:l=!1}=e,n=(0,T.s)(),s=(0,g.f)("freePlayControls");return(0,a.jsxs)("div",{className:(0,b.c)(h.default["middle-display"],h.default[t],t&&h.default["mobile-display"]),children:[(0,a.jsx)("div",{className:h.default["logo-content"],children:(0,a.jsx)(eF.f,{})}),(0,a.jsxs)("div",{className:h.default["default-content"],children:[(0,a.jsxs)("div",{className:h.default["ribbon-container"],children:[(0,a.jsx)("div",{className:h.default["ribbon-inner"],children:(0,a.jsx)("span",{children:n("blackjack_payout")})}),(0,a.jsx)(eU,{})]}),!s?.displayed&&(0,a.jsxs)("div",{className:h.default["ribbon-container"],children:[(0,a.jsx)("div",{className:h.default["ribbon-inner"],children:(0,a.jsx)("span",{children:n("blackjack_insurance_payout")})}),(0,a.jsx)(eW,{})]})]})]})}var eL=e.i(740614),eQ=e.i(77625);let e$="blackjack-side-bets-visible";function eq(){let[e,t]=(0,D.q)(v.B),[l,n]=(0,D.q)(E),[s,r]=(0,D.q)(M),{clearChipMode:i}=eb(),d=(0,T.s)(),c=l.activeGame||s.activeGame;return(0,u.useEffect)(()=>{let e=eL.f.getLocalStorageValue(e$);null==e?t(!0):t(!!e)},[t]),(0,a.jsxs)("div",{className:ei.default["side-bet-footer-toggle-container"],children:[(0,a.jsx)("span",{children:d("side_bets")}),(0,a.jsx)("div",{className:`${ei.default["side-bet-footer-toggle-control"]} ${c?ei.default["side-bet-footer-toggle-control-locked"]:""}`,children:(0,a.jsx)(eQ.f,{checked:e,disabled:c,onCheckedChange:()=>{c||t(e=>{let a=!e;return a||(i(),n(e=>e.result?e:{...e,active:!1,betAmount:null,errors:{active:!1,text:""}}),r(e=>e.result?e:{...e,active:!1,betAmount:null,errors:{active:!1,text:""}})),eL.f.setLocalStorageValue(e$,a),a})}})})]})}var eV=e.i(4543);let eX=e=>{let a;return e?.result?.sub_type?{payout:Number.isFinite(a=Number(e.result.payout))?a:0,winName:H[e.result.sub_type]}:null};function eJ(e){let{perfectPairSideBet:t,resultCurrencyCode:l,twentyOneSideBet:n}=e,s=eX(t),r=eX(n);return(0,a.jsxs)("div",{className:eV.default["side-bet-mobile-popup-container"],children:[(0,a.jsxs)("div",{className:(0,b.c)(eV.default["side-bet-mobile-popup-item"],eV.default["perfect-pair-popup"]),id:"side-bet-perfect-pair-popup",children:[s?.winName&&(0,a.jsx)("span",{className:eV.default["side-bet-mobile-popup-win-name"],children:s.winName}),Number.isFinite(s?.payout)&&(0,a.jsx)("div",{className:eV.default["side-bet-mobile-popup-values"],children:(0,a.jsx)("span",{className:eV.default["side-bet-mobile-popup-amount"],children:(0,a.jsx)(q.F,{amount:s.payout,currencyCode:l,raw:!0})})})]}),(0,a.jsxs)("div",{className:(0,b.c)(eV.default["side-bet-mobile-popup-item"],eV.default["twenty-one-popup"]),id:"side-bet-twenty-one-popup",children:[r?.winName&&(0,a.jsx)("span",{className:eV.default["side-bet-mobile-popup-win-name"],children:r.winName}),Number.isFinite(r?.payout)&&(0,a.jsx)("div",{className:eV.default["side-bet-mobile-popup-values"],children:(0,a.jsx)("span",{className:eV.default["side-bet-mobile-popup-amount"],children:(0,a.jsx)(q.F,{amount:r.payout,currencyCode:l,raw:!0})})})]})]})}var ez=e.i(496158),eY=e.i(263088),eZ=e.i(466716),e0=e.i(571649),e1=e.i(58985),e2=e.i(168665),e8=e.i(581243);function e3(e){let{currentHandIndex:a,dealerHand:t,insuranceOffered:l,playerHands:n,results:s,status:r}=e,i={...t};i=t?.cards?t.isRevealed?{cards:t.cards.map(e=>(0,e8.x)(e)),isRevealed:!0}:{cards:[(0,e8.x)(t.cards[0]),(0,e8.x)(!1)],isRevealed:!1}:{cards:!1,isRevealed:!1};let d=n.map(e=>({availableActions:e.availableActions,cards:e.cards.map(e=>(0,e8.x)(e)),isBust:e?.isBust,isDoubled:e?.isDoubled,isStand:e?.isStand,result:e.result||null}));return{betAmount:e.betAmount,currency:e.currency,currentHandIndex:a,dealerHand:i,insuranceOffered:l,insuranceWon:e.insuranceWon,isSplit:e.isSplit,playerHands:d,results:s,status:r}}function e5(e){if(2!==e.length)return!1;let a=(0,e8.x)(e[0]),t=(0,e8.x)(e[1]);return a.value===t.value}function e9(e){let a=e.playerHands.findIndex((a,t)=>t>e.currentHandIndex&&!a.isStand&&!a.isBust);-1!==a?(e.currentHandIndex=a,e6(e)):e.playerHands.some(e=>!e.isBust)?(e.status="dealerTurn",e7(e)):(e.status="finished",e.dealerHand.isRevealed=!0)}function e7(e){e.dealerHand.isRevealed=!0;let a=(0,e8.B)(e.dealerHand.cards);for(;a<17;){let t=(0,e8.y)(e.deck);e.dealerHand.cards.push(t),a=(0,e8.B)(e.dealerHand.cards)}e.playerHands.forEach(e=>{if(e.isBust)e.result="lose";else{let t=(0,e8.B)(e.cards);a>21||t>a?e.result="win":t<a?e.result="lose":e.result="push"}}),e.status="finished"}function e6(e){let a=e.playerHands[e.currentHandIndex];if(a.isBust||a.isStand||!1===a.isActive)return}var e4=e.i(384209);let ae={...{basicSplit:{deck:["8h","2s","2s","Th","8h","3h"],description:`
**Scenario**: The player is dealt two eights and chooses to split them. Each split hand can be played normally.

**Tester Actions**:
- Click **"Split"** when prompted.
- Play each split hand separately with normal options (**Hit** or **Stand**).

**Card Reveals**:
- **Player's Initial Hand**: 8 of Hearts (\`8h\`), 8 of Diamonds (\`8d\`)
- **Dealer's Upcard**: 6 of Clubs (\`6c\`)
- **Dealer's Hole Card**: 10 of Hearts (\`Th\`)
- **Cards Dealt to Split Hands**:
  - First Hand: Queen of Spades (\`Qs\`) - Total 18
  - Second Hand: King of Clubs (\`Kc\`) - Total 18

**Expected Result**:
- Both split hands can be played normally.
- Each hand is settled separately against the dealer's hand.
- **Payout**:
  - Each winning hand pays 1:1.
  - Each hand is evaluated independently.
`,key:"basicSplit",title:"Basic Split with Two Eights"},bothBlackjack:{deck:["Ah","Ad","Kh","Ks"],description:`
**Scenario**: Both the player and the dealer are dealt blackjack.

**Tester Actions**:
- Observe the initial deal.

**Card Reveals**:
- **Player's Hand**: Ace of Hearts (\`Ah\`), King of Hearts (\`Kh\`) - Blackjack
- **Dealer's Upcard**: Ace of Diamonds (\`Ad\`)
- **Dealer's Hole Card**: King of Spades (\`Ks\`) - Dealer has blackjack

**Expected Result**:
- The game results in a **push** (tie).
- Player's bet is returned.
- **Payout**:
  - No win or loss.
`,key:"bothBlackjack",title:"Both Dealer and Player Draw Blackjack"},bothHitToBlackjack:{deck:["5h","4c","6d","3s","Kh","3h","Ad"],description:`
**Scenario**: Player hits to 21, then dealer hits multiple times to also reach 21.

**Tester Actions**:
- Click **"Hit"** when prompted
- Watch dealer draw multiple cards to reach 21

**Card Reveals**:
- **Player's Hand**:
  - Initial Cards: 5 of Hearts (\`5h\`), 6 of Diamonds (\`6d\`) - Total 11
  - Hit Card: King of Hearts (\`Kh\`) - Final Total 21
- **Dealer's Hand**:
  - Upcard: 4 of Clubs (\`4c\`)
  - Hole Card: 3 of Spades (\`3s\`) - Initial Total 7
  - Hit 1: 3 of Hearts (\`3h\`) - Total 10
  - Hit 2: Ace of Diamonds (\`Ad\`) - Total 21

**Expected Result**:
- Game results in a push (tie)
- Player's bet is returned
- **Payout**:
  - No win or loss
`,key:"bothHitToBlackjack",title:"Both Player and Dealer Hit to Blackjack"},dealerBlackjackAfterManyHits:{deck:["Qh","2d","8h","3c","2h","3s","Ad","Kc"],description:`
**Scenario**: The dealer starts with a low total and hits multiple times, eventually getting an Ace and Ten for 21.

**Tester Actions**:
- Play your hand normally.
- Watch dealer draw multiple cards to reach 21.

**Card Reveals**:
- **Player's Hand**: Queen of Hearts (\`Qh\`), 8 of Hearts (\`8h\`) - Total 18
- **Dealer's Upcard**: 2 of Diamonds (\`2d\`)
- **Dealer's Hole Card**: 3 of Clubs (\`3c\`) - Initial Total 5
- **Dealer's Hit Cards**:
  - Hit 1: 2 of Hearts (\`2h\`) - Total 7
  - Hit 2: 3 of Spades (\`3s\`) - Total 10
  - Hit 3: Ace of Diamonds (\`Ad\`) - Total 11
  - Hit 4: King of Clubs (\`Kc\`) - Final Total 21

**Expected Result**:
- Dealer must hit on totals below 17
- Dealer reaches exactly 21 after multiple hits
- Player loses their bet
`,key:"dealerBlackjackAfterManyHits",title:"Dealer Gets Blackjack After Multiple Hits"},dealerBlackjackPlayerHighTotal:{deck:["Th","Kd","Kh","Ad"],description:`
**Scenario**: The dealer's face-up card is a 10-value card. The dealer's hole card is an Ace, resulting in a blackjack.

**Tester Actions**:
- Play your hand normally (e.g., **Stand** on high totals).
- Observe the dealer revealing a blackjack.

**Card Reveals**:
- **Player's Hand**: 10 of Hearts (\`Th\`), King of Hearts (\`Kh\`) - Total 20
- **Dealer's Upcard**: King of Diamonds (\`Kd\`)
- **Dealer's Hole Card**: Ace of Diamonds (\`Ad\`) - Dealer has blackjack

**Expected Result**:
- Player loses the hand.
- **Payout**:
  - Player loses their bet.
  - No insurance is offered since the dealer's upcard is not an Ace.
`,key:"dealerBlackjackPlayerHighTotal",title:"Dealer Blackjack (10 First, Ace Second)"},dealerBlackjackWithSplitOption:{deck:["7h","Ks","7d","Ac"],description:`
**Scenario**: The dealer shows a 10-value card and has a hidden Ace for blackjack. Player has a pair of 7s.

**Tester Actions**:
- Observe that split would be available, but hand ends immediately due to dealer blackjack
- No actions should be available to player

**Card Reveals**:
- **Player's Hand**: 7 of Hearts (\`7h\`), 7 of Diamonds (\`7d\`) - Could split, but won't get the chance
- **Dealer's Upcard**: King of Spades (\`Ks\`)
- **Dealer's Hole Card**: Ace of Clubs (\`Ac\`) - Dealer has blackjack

**Expected Result**:
- Hand ends immediately upon dealer revealing blackjack
- Split option is never offered to player
- **Payout**:
  - Player loses their bet
  - No insurance offered (dealer's upcard is not an Ace)
`,key:"dealerBlackjackWithSplitOption",title:"Dealer Blackjack with Split Available (10 Up, Hidden Ace)"},dealerSoft17:{deck:["9h","Ad","7h","6c"],description:`
**Scenario**: The dealer has a soft 17 (Ace and 6) and stands.

**Tester Actions**:
- Play your hand normally (e.g., **Hit** or **Stand**).

**Card Reveals**:
- **Player's Hand**: 9 of Hearts (\`9h\`), 7 of Hearts (\`7h\`) - Total 16
- **Dealer's Upcard**: Ace of Diamonds (\`Ad\`)
- **Dealer's Hole Card**: 6 of Clubs (\`6c\`) - Dealer's Soft 17

**Expected Result**:
- Dealer stands on soft 17.
- Outcome is determined based on hand totals.
- **Payout**:
  - Depends on whether the player's final total beats the dealer's 17.
`,key:"dealerSoft17",title:"Dealer Stands on Soft 17"},doubleDownPlayerWins:{deck:["6h","6c","5d","Tc","Th","Ks"],description:`
**Scenario**: The player has a total of 11 and doubles down, receiving a 10-value card to win against dealer's bust.

**Tester Actions**:
- Click **"Double"** when prompted
- Observe dealer bust after hitting

**Card Reveals**:
- **Player's Hand**:
  - Initial Cards: 6 of Hearts (\`6h\`), 5 of Diamonds (\`5d\`) - Total 11
  - Double Down Card: 10 of Hearts (\`Th\`) - Final Total 21
- **Dealer's Upcard**: 6 of Clubs (\`6c\`)
- **Dealer's Hole Card**: 10 of Clubs (\`Tc\`) - Total 16
- **Dealer's Hit Card**: King of Spades (\`Ks\`) - Busts with 26

**Expected Result**:
- Player wins with doubled bet
- **Payout**:
  - Player wins 2x their original bet (doubled bet pays 1:1)
`,key:"doubleDownPlayerWins",title:"Player Wins with Double Down"},doubleDownWin:{deck:["5h","9c","6h","7d","Kh","Qd"],description:`
**Scenario**: The player has a total of 11 and chooses to double down, resulting in a winning hand.

**Tester Actions**:
- Click **"Double"** when prompted.
- Observe the additional card dealt.
- Note that no further actions are available for this hand.

**Card Reveals**:
- **Player's Hand**:
  - Initial Cards: 5 of Hearts (\`5h\`), 6 of Hearts (\`6h\`) - Total 11
  - Double Down Card: King of Hearts (\`Kh\`) - Final Total 21
- **Dealer's Upcard**: 9 of Clubs (\`9c\`)
- **Dealer's Hole Card**: 7 of Diamonds (\`7d\`) - Dealer's Total 16
- **Dealer's Hit Card**: Queen of Diamonds (\`Qd\`) - Dealer Busts with 26

**Expected Result**:
- Player wins with doubled bet
- **Payout**:
  - Player wins 2x their original bet (doubled bet pays 1:1)
`,key:"doubleDownWin",title:"Winning with Double Down"},doubleDownWinTwoHands:{deck:["9h","5d","9s","9c","2h","3h"],description:`
**Scenario**: The player splits a pair and doubles down on both hands, winning both.

**Tester Actions**:
- Click **"Split"** when prompted.
- On each split hand, choose **"Double"** when available.

**Card Reveals**:
- **Player's Initial Hand**: 9 of Hearts (\`9h\`), 9 of Spades (\`9s\`) - Can split
- **Dealer's Upcard**: 5 of Diamonds (\`5d\`)
- **Dealer's Hole Card**: 9 of Clubs (\`9c\`)
- **First Split Hand**:
  - Double Down Card: 2 of Hearts (\`2h\`) - Total 11
- **Second Split Hand**:
  - Double Down Card: 3 of Hearts (\`3h\`) - Total 12
- **Dealer's Action Cards**:
  - Dealer stands with a total less than the player's hands.

**Expected Result**:
- Both hands win.
- **Payout**:
  - Player wins double bet on both hands.
`,key:"doubleDownWinTwoHands",title:"Winning with Two Doubles"},insuranceDealerBlackjackPlayerNoBlackjack:{deck:["Th","Ad","9h","Kh"],description:`
**Scenario**: The dealer's face-up card is an Ace. The dealer has a blackjack.

**Tester Actions**:
- Decide whether to take **Insurance** when offered.
  - For testing winning with insurance, **take insurance**.
  - For testing losing with insurance, **do not take insurance**.
- Observe the dealer revealing a blackjack.

**Card Reveals**:
- **Player's Hand**: 10 of Hearts (\`Th\`), 9 of Hearts (\`9h\`) - Total 19
- **Dealer's Upcard**: Ace of Diamonds (\`Ad\`)
- **Dealer's Hole Card**: King of Hearts (\`Kh\`) - Dealer has blackjack

**Expected Result**:
- If **insurance is taken**:
  - Player wins the insurance bet (pays 2:1).
  - Player loses the original bet.
  - **Net Result**: Player breaks even.
- If **insurance is not taken**:
  - Player loses the original bet.
  - **Payout**:
    - Insurance bet is not paid.
    - Player loses their bet.
`,key:"insuranceDealerBlackjackPlayerNoBlackjack",title:"Dealer Blackjack (Ace First, 10 Second)"},insuranceDealerHasBlackjack:{deck:["9h","Ad","7h","Kh"],description:`
**Scenario**: The dealer's upcard is an Ace, and the dealer has a blackjack. The player takes insurance.

**Tester Actions**:
- Choose to **take insurance** when offered.
- Observe the dealer revealing a blackjack.

**Card Reveals**:
- **Player's Hand**: 9 of Hearts (\`9h\`), 7 of Hearts (\`7h\`) - Total 16
- **Dealer's Upcard**: Ace of Diamonds (\`Ad\`)
- **Dealer's Hole Card**: King of Hearts (\`Kh\`) - Dealer has blackjack

**Expected Result**:
- Player wins the insurance bet (pays 2:1).
- Player loses the original bet.
- **Net Result**: Player breaks even.
- **Payout**:
  - Insurance bet wins: Player receives 2:1 payout on insurance amount.
  - Original bet lost.
`,key:"insuranceDealerHasBlackjack",title:"Winning with Insurance"},insuranceDealerNoBlackjack:{deck:["9h","Ad","7h","9c","5h"],description:`
**Scenario**: The dealer's upcard is an Ace, but the dealer does not have blackjack. The player takes insurance.

**Tester Actions**:
- Choose to **take insurance** when offered.
- Play your hand (e.g., **Hit** or **Stand**).

**Card Reveals**:
- **Player's Hand**: 9 of Hearts (\`9h\`), 7 of Hearts (\`7h\`) - Total 16
- **Dealer's Upcard**: Ace of Diamonds (\`Ad\`)
- **Dealer's Hole Card**: 9 of Clubs (\`9c\`) - Dealer does not have blackjack

**Expected Result**:
- Player loses the insurance bet.
- The game continues with the original bet.
- **Payout**:
  - Insurance bet lost.
  - Outcome of original bet depends on the rest of the hand.
`,key:"insuranceDealerNoBlackjack",title:"Losing with Insurance"},insuranceWithSplitOption:{deck:["8h","As","8d","9c","Kh","Qd"],description:`
**Scenario**: The dealer shows an Ace (insurance offered) and the player has a pair of 8s (split available).

**Tester Actions**:
- Choose whether to take **Insurance** when offered.
- After insurance decision, can choose to **Split** the 8s.
- Play each resulting hand normally.

**Card Reveals**:
- **Player's Hand**: 8 of Hearts (\`8h\`), 8 of Diamonds (\`8d\`) - Can split
- **Dealer's Upcard**: Ace of Spades (\`As\`) - Insurance offered
- **Dealer's Hole Card**: 9 of Clubs (\`9c\`) - No dealer blackjack
- **Split Hand Cards** (if split chosen):
  - First Hand: King of Hearts (\`Kh\`) - Total 18
  - Second Hand: Queen of Diamonds (\`Qd\`) - Total 18

**Expected Result**:
- Insurance is offered first, before split decision.
- If insurance taken, it loses (2:1 against).
- Split option remains available after insurance decision.
- **Payout**:
  - Insurance bet lost (if taken).
  - Each split hand (if chosen) evaluated separately.
`,key:"insuranceWithSplitOption",title:"Insurance Offered with Splittable Hand"},multipleSplits:{deck:["8h","5d","8s","9c","8d","3h"],description:`
**Scenario**: The player keeps receiving pairs and attempts to split multiple times. According to house rules, the player can only split once.

**Tester Actions**:
- Click **"Split"** when first prompted.
- Observe that the **"Split"** option is not available again due to house rules.
- Play each resulting hand according to your strategy (**Hit** or **Stand**).

**Card Reveals**:
- **Player's Initial Hand**: 8 of Hearts (\`8h\`), 8 of Spades (\`8s\`)
- **Dealer's Upcard**: 5 of Diamonds (\`5d\`)
- **Dealer's Hole Card**: 9 of Clubs (\`9c\`)
- **Cards Dealt to Split Hands**:
  - **First Hand**:
    - Next Card: 8 of Diamonds (\`8d\`) - Another 8
    - Since house rules only allow one split, cannot split again.
    - Player action: **Hit** or **Stand**.
  - **Second Hand**:
    - Next Card: 3 of Hearts (\`3h\`)
    - Player action: **Hit** or **Stand**.

**Expected Result**:
- Only one split is allowed due to house rules.
- The player plays each hand separately.
- The game proceeds to the dealer's turn after all hands are played.
- **Payout**:
  - Each hand's outcome is settled individually based on standard payouts.
`,key:"multipleSplits",title:"Repeating Splits for the Player"},noSplit:{deck:["7h","5d","8s","9c"],description:`
**Scenario**: The player has two different cards and cannot split.

**Tester Actions**:
- Observe that the **"Split"** option is not available.
- Choose to **Hit** or **Stand**.

**Card Reveals**:
- **Player's Hand**: 7 of Hearts (\`7h\`), 8 of Spades (\`8s\`) - Total 15
- **Dealer's Upcard**: 5 of Diamonds (\`5d\`)
- **Dealer's Hole Card**: 9 of Clubs (\`9c\`)

**Expected Result**:
- Player cannot split.
- Must decide to **Hit** or **Stand**.
- **Payout**:
  - Depends on the outcome of the hand.
`,key:"noSplit",title:"Player Cannot Split Different Cards"},playerBlackjack:{deck:["Ah","5d","Kh","9c"],description:`
**Scenario**: The player is dealt a blackjack, and the dealer does not have blackjack.

**Tester Actions**:
- Observe the initial deal.

**Card Reveals**:
- **Player's Hand**: Ace of Hearts (\`Ah\`), King of Hearts (\`Kh\`) - Blackjack
- **Dealer's Upcard**: 5 of Diamonds (\`5d\`)
- **Dealer's Hole Card**: 9 of Clubs (\`9c\`)

**Expected Result**:
- The player wins immediately.
- **Payout**:
  - Blackjack pays 3:2.
  - If the bet was $100, the player wins $150.
`,key:"playerBlackjack",title:"Player Draws Blackjack Only"},secindSplitHandIs21:{deck:["Th","3h","Ts","6c","Jh","Ah","5c","3d"],description:`
**Scenario**: Player splits a pair of eights and receives an Ace in one hand, demonstrating that multiple hits are allowed (unlike split Aces).

**Tester Actions**:
- Click **"Split"** when prompted
- On the Ace hand, verify that **Hit** remains available
- Hit multiple times to test soft/hard total transitions

**Card Reveals**:
- **Player's Initial Hand**: 8 of Hearts (\`8h\`), 8 of Spades (\`8s\`)
- **Dealer's Upcard**: 6 of Diamonds (\`6d\`)
- **Dealer's Hole Card**: 10 of Clubs (\`Tc\`)
- **First Split Hand** (Ace hand):
  - Initial: Ace of Hearts (\`Ah\`) - Soft Total 19
  - Hit 1: 5 of Clubs (\`5c\`) - Still Soft Total 14
  - Hit 2: 3 of Diamonds (\`3d\`) - Hard Total 17
- **Second Split Hand**:
  - Initial: 10 of Hearts (\`Th\`) - Total 18

**Expected Result**:
- First split hand should:
  - Show soft totals when appropriate
  - Allow multiple hits (unlike split Aces)
  - Convert to hard total when over 21
- Second split hand plays normally
- **Payout**:
  - Each hand evaluated separately against dealer
`,key:"secindSplitHandIs21",title:"Second Split Hand is 21"},splitAces:{deck:["Ah","5d","As","9c","Kh","Qh","7d"],description:`
**Scenario**: The player is dealt two Aces and chooses to split them. After splitting, each Ace receives one card, and no further actions are allowed.

**Tester Actions**:
- Click **"Split"** when prompted.
- Observe that each split hand receives one card.
- Note that no further actions (**Hit**, **Stand**) are available for split Aces.

**Card Reveals**:
- **Player's Initial Hand**: Ace of Hearts (\`Ah\`), Ace of Spades (\`As\`)
- **Dealer's Upcard**: 5 of Diamonds (\`5d\`)
- **Dealer's Hole Card**: 9 of Clubs (\`9c\`)
- **Cards Dealt to Split Hands**:
  - First Hand: King of Hearts (\`Kh\`) - Total 21
  - Second Hand: Queen of Hearts (\`Qh\`) - Total 21

**Expected Result**:
- Both split hands automatically stand.
- The dealer plays their hand.
- **Payout**:
  - Each winning hand pays 1:1.
  - Since both hands have 21 and the dealer's final hand is less than 21, both hands win.
`,key:"splitAces",title:"Player Splits Aces"},splitAcesLose:{deck:["Ah","5d","As","9c","4h","4s","7d"],description:`
**Scenario**: The player is dealt two Aces and chooses to split them. After splitting, each Ace receives one card, and no further actions are allowed.

**Tester Actions**:
- Click **"Split"** when prompted.
- Observe that each split hand receives one card.
- Note that no further actions (**Hit**, **Stand**) are available for split Aces.

**Card Reveals**:
- **Player's Initial Hand**: Ace of Hearts (\`Ah\`), Ace of Spades (\`As\`)
- **Dealer's Upcard**: 5 of Diamonds (\`5d\`)
- **Dealer's Hole Card**: 9 of Clubs (\`9c\`)
- **Cards Dealt to Split Hands**:
  - First Hand: King of Hearts (\`Kh\`) - Total 21
  - Second Hand: Queen of Hearts (\`Qh\`) - Total 21

**Expected Result**:
- Both split hands automatically stand.
- The dealer plays their hand.
- **Payout**:
  - Each winning hand pays 1:1.
  - Since both hands have 21 and the dealer's final hand is less than 21, both hands win.
`,key:"splitAcesLose",title:"Player Splits and lose"},splitAndDoubleWin:{deck:["8h","6c","8d","Tc","3c","2h","Qs","Kh","7s"],description:`
**Scenario**: Player splits a pair of 8s, then doubles down on both hands and wins.

**Tester Actions**:
1. Click **"Split"** when prompted
2. Click **"Double"** on first hand
3. Click **"Double"** on second hand
4. Watch dealer play out their hand

**Card Reveals**:
- **Player's Initial Hand**: Two 8s of Hearts and Diamonds (\`8h\`, \`8d\`)
- **After Split**:
  - **Hand 1**: 8 of Hearts (\`8h\`) + 3 of Clubs (\`3c\`) + Double: Queen of Spades (\`Qs\`) = 21
  - **Hand 2**: 8 of Diamonds (\`8d\`) + 2 of Hearts (\`2h\`) + Double: King of Hearts (\`Kh\`) = 20
- **Dealer's Hand**:
  - Upcard: 6 of Clubs (\`6c\`)
  - Hole Card: 10 of Clubs (\`Tc\`) = 16
  - Hit Card: 7 of Spades (\`7s\`) = Busts with 23

**Expected Result**:
- Both hands win
- **Payouts**:
  - Hand 1: Wins 2x original bet (doubled bet pays 1:1)
  - Hand 2: Wins 2x original bet (doubled bet pays 1:1)
`,key:"splitAndDoubleWin",title:"Split and Double Win"},splitAndHitTwoAces:{deck:["Th","Ah","Ts","6c","Ah","Ah","5c","3d"],description:`
**Scenario**: Player splits a pair of eights and receives an Ace in one hand, demonstrating that multiple hits are allowed (unlike split Aces).

**Tester Actions**:
- Click **"Split"** when prompted
- On the Ace hand, verify that **Hit** remains available
- Hit multiple times to test soft/hard total transitions

**Card Reveals**:
- **Player's Initial Hand**: 8 of Hearts (\`8h\`), 8 of Spades (\`8s\`)
- **Dealer's Upcard**: 6 of Diamonds (\`6d\`)
- **Dealer's Hole Card**: 10 of Clubs (\`Tc\`)
- **First Split Hand** (Ace hand):
  - Initial: Ace of Hearts (\`Ah\`) - Soft Total 19
  - Hit 1: 5 of Clubs (\`5c\`) - Still Soft Total 14
  - Hit 2: 3 of Diamonds (\`3d\`) - Hard Total 17
- **Second Split Hand**:
  - Initial: 10 of Hearts (\`Th\`) - Total 18

**Expected Result**:
- First split hand should:
  - Show soft totals when appropriate
  - Allow multiple hits (unlike split Aces)
  - Convert to hard total when over 21
- Second split hand plays normally
- **Payout**:
  - Each hand evaluated separately against dealer
`,key:"SplitAndHitTwoAces",title:"Split Hand and Hit Two Aces"},splitHandAndGet21FirstHand:{deck:["Th","6d","Ts","Tc","Ah","Th","5c","3d"],description:`
**Scenario**: Player splits a pair of eights and receives an Ace in one hand, demonstrating that multiple hits are allowed (unlike split Aces).

**Tester Actions**:
- Click **"Split"** when prompted
- On the Ace hand, verify that **Hit** remains available
- Hit multiple times to test soft/hard total transitions

**Card Reveals**:
- **Player's Initial Hand**: 8 of Hearts (\`8h\`), 8 of Spades (\`8s\`)
- **Dealer's Upcard**: 6 of Diamonds (\`6d\`)
- **Dealer's Hole Card**: 10 of Clubs (\`Tc\`)
- **First Split Hand** (Ace hand):
  - Initial: Ace of Hearts (\`Ah\`) - Soft Total 19
  - Hit 1: 5 of Clubs (\`5c\`) - Still Soft Total 14
  - Hit 2: 3 of Diamonds (\`3d\`) - Hard Total 17
- **Second Split Hand**:
  - Initial: 10 of Hearts (\`Th\`) - Total 18

**Expected Result**:
- First split hand should:
  - Show soft totals when appropriate
  - Allow multiple hits (unlike split Aces)
  - Convert to hard total when over 21
- Second split hand plays normally
- **Payout**:
  - Each hand evaluated separately against dealer
`,key:"splitHandAndGet21FirstHand",title:"Split Hand and get a 21 with first hand"},splitToAce:{deck:["8h","6d","8s","Tc","Ah","Th"],description:`
**Scenario**: Player splits a pair of eights and receives an Ace in the first split hand.

**Tester Actions**:
- Click **"Split"** when prompted
- Play each split hand normally
- Note the soft total calculation for the Ace hand

**Card Reveals**:
- **Player's Initial Hand**: 8 of Hearts (\`8h\`), 8 of Spades (\`8s\`)
- **Dealer's Upcard**: 6 of Diamonds (\`6d\`)
- **Dealer's Hole Card**: 10 of Clubs (\`Tc\`)
- **First Split Hand**:
  - Initial: Ace of Hearts (\`Ah\`) - Soft Total 19
- **Second Split Hand**:
  - Initial: 10 of Hearts (\`Th\`) - Total 18

**Expected Result**:
- First split hand should show soft total of 19
- Second split hand shows hard total of 18
- Both hands can be played normally
- **Payout**:
  - Each hand evaluated separately against dealer
`,key:"splitToAce",title:"Split Hand Receives an Ace"},splitWinLoseDealer19:{deck:["8h","3c","8d","2h","Ks","7h","9d","4c","5d","5s"],description:`
**Scenario**: Player splits a pair and gets one strong hand (18) and one bust. Dealer builds to 19 with multiple small cards.

**Tester Actions**:
- Click **"Split"** when prompted
- **Stand** on first hand (18)
- **Hit** on second hand until bust
- Watch dealer accumulate small cards to win

**Card Reveals**:
- **Player's Initial Hand**: 8 of Hearts (\`8h\`), 8 of Diamonds (\`8d\`)
- **Dealer's Upcard**: 3 of Clubs (\`3c\`)
- **Dealer's Hole Card**: 2 of Hearts (\`2h\`) - Initial Total 5
- **First Split Hand**:
  - Initial: King of Spades (\`Ks\`) - Total 18
- **Second Split Hand**:
  - Initial: 7 of Hearts (\`7h\`) - Total 15
  - Hit: 9 of Diamonds (\`9d\`) - Busts with 24
- **Dealer's Hit Cards**:
  - Hit 1: 4 of Clubs (\`4c\`) - Total 9
  - Hit 2: 5 of Diamonds (\`5d\`) - Total 14
  - Hit 3: 5 of Spades (\`5s\`) - Final Total 19

**Expected Result**:
- First hand loses to dealer's 19
- Second hand busts (automatic loss)
- **Payout**:
  - Both hands lose their bets
`,key:"splitWinLoseDealer19",title:"Split Hand: One Win, One Bust, Dealer Wins with Small Cards"},splitWithManySmallCards:{deck:["3h","6d","3s","Tc","2h","2d","3c","2s","4h","4d","3d","2c","4s"],description:`
**Scenario**: Player splits a pair of threes and receives many small cards, allowing for multiple hits.

**Tester Actions**:
- Click **"Split"** when prompted
- **Hit** multiple times on each hand to accumulate cards

**Card Reveals**:
- **Player's Initial Hand**: 3 of Hearts (\`3h\`), 3 of Spades (\`3s\`)
- **Dealer's Upcard**: 6 of Diamonds (\`6d\`)
- **Dealer's Hole Card**: 10 of Clubs (\`Tc\`)
- **First Split Hand Cards**:
  - Initial: 2 of Hearts (\`2h\`) - Total 5
  - Hit 1: 2 of Diamonds (\`2d\`) - Total 7
  - Hit 2: 3 of Clubs (\`3c\`) - Total 10
  - Hit 3: 2 of Spades (\`2s\`) - Total 12
  - Hit 4: 4 of Hearts (\`4h\`) - Total 16
- **Second Split Hand Cards**:
  - Initial: 4 of Diamonds (\`4d\`) - Total 7
  - Hit 1: 3 of Diamonds (\`3d\`) - Total 10
  - Hit 2: 2 of Clubs (\`2c\`) - Total 12
  - Hit 3: 4 of Spades (\`4s\`) - Total 16

**Expected Result**:
- Multiple cards displayed in each split hand
- Container should adjust width to accommodate all cards
- Cards should remain properly spaced and visible
`,key:"splitWithManySmallCards",title:"Split Low Cards with Multiple Hits"}},sideBet4sPerfectPair:{deck:["4s","9d","4s","7c","2h","Kc","5d","8h"]},sideBet4sPerfectPairDealerAceUpNoBj:{deck:["4s","Ad","4s","7c","2h","Kc","5d","8h"]},sideBet4sPerfectPairDealerBjWithInsurance:{deck:["4s","Ad","4s","Kc","2h","5d","8h","Qs"]},sideBet4sPerfectPairDealerBjWithoutInsurance:{deck:["4s","Kd","4s","Ad","2h","7c","5d","8h"]},sideBet7hSuitedTrips:{deck:["7h","7h","7h","2c","5d","9s","Kc","3d"]},sideBet9sThreeOfAKind:{deck:["9c","9d","9h","2s","5c","7d","Ks","4h"]},sideBet456Straight:{deck:["4s","5d","6c","9h","2c","Kd","8h","Qs"]},sideBet567HeartsStraightFlush:{deck:["5h","6h","7h","2c","9d","Ks","4c","8d"]},sideBetDiamondsFlush:{deck:["2d","9d","Kd","7c","3h","8s","5c","Qh"]},sideBetDiamondsFlushDealerAceUpNoBj:{deck:["2d","Ad","Kd","7c","3h","8s","5c","Qh"]},sideBetDiamondsFlushDealerBjWithInsurance:{deck:["2d","Ad","Kd","Td","3h","8s","5c","Qh"]},sideBetDiamondsFlushDealerBjWithoutInsurance:{deck:["2d","Td","Kd","Ad","3h","8s","5c","Qh"]},sideBetKingsColouredPair:{deck:["Kh","9s","Kd","7c","2h","5d","8c","Qs"]},sideBetKingsColouredPairDealerAceUpNoBj:{deck:["Kh","Ad","Kd","7c","2h","5d","8c","Qs"]},sideBetKingsColouredPairDealerBjWithInsurance:{deck:["Kh","Ad","Kd","Tc","2h","5s","8d","Qc"]},sideBetKingsColouredPairDealerBjWithoutInsurance:{deck:["Kh","Qs","Kd","As","2h","5d","8c","7s"]},sideBetQueensMixedPair:{deck:["Qc","9d","Qh","7s","2c","5d","8h","Ks"]},sideBetQueensMixedPairDealerBjWithInsurance:{deck:["Qc","Ad","Qh","Td","2c","5s","8h","Ks"]},sideBetQueensMixedPairDealerBjWithoutInsurance:{deck:["Qc","Jd","Qh","Ad","2c","5s","8h","Ks"]}},aa={currentHandIndex:0,currentTurn:0,dealerHand:{cards:!1,isRevealed:!1},deck:[],insuranceOffered:!1,insuranceTaken:!1,insuranceWon:!1,isSplit:!1,playerHands:[{availableActions:{double:!1,hit:!1,split:!1,stand:!1},cards:[],handId:0,isActive:!1,isBust:!1,isDoubled:!1,isStand:!1,isWin:!1,result:null}],status:"notStarted"},at=function(){let e=!(arguments.length>0)||void 0===arguments[0]||arguments[0],a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,t=arguments.length>2&&void 0!==arguments[2]&&arguments[2],l=arguments.length>3&&void 0!==arguments[3]?arguments[3]:()=>{},n=arguments.length>4&&void 0!==arguments[4]?arguments[4]:()=>{},s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:()=>null,r=arguments.length>6&&void 0!==arguments[6]?arguments[6]:()=>{},i=arguments.length>7&&void 0!==arguments[7]?arguments[7]:()=>{},d=arguments.length>8&&void 0!==arguments[8]?arguments[8]:()=>{},o=arguments.length>9&&void 0!==arguments[9]?arguments[9]:{game_action_id:null,game_history_id:null},p=arguments.length>10&&void 0!==arguments[10]?arguments[10]:()=>{},h=arguments.length>11&&void 0!==arguments[11]?arguments[11]:()=>{},f=arguments.length>12&&void 0!==arguments[12]?arguments[12]:()=>{},m=arguments.length>13&&void 0!==arguments[13]?arguments[13]:()=>{},b=arguments.length>14&&void 0!==arguments[14]?arguments[14]:()=>{},y=arguments.length>15&&void 0!==arguments[15]?arguments[15]:()=>{},g=arguments.length>16&&void 0!==arguments[16]?arguments[16]:()=>{},k=arguments.length>17&&void 0!==arguments[17]?arguments[17]:()=>{},v=(0,e1.f)("freePlayControls"),{displayed:H=null}=v?.value||{},A=(0,u.useRef)([]),[S,w]=(0,u.useState)(),[C,j]=(0,u.useState)({}),[x,D]=(0,u.useState)(!1),[T,P]=(0,u.useState)(!1),{balanceMutate:_,userBalanceType:R}=(0,eo.P)(),{walletSetting:B}=(0,ec.f)(),{setDynamicBalanceActive:I,setUserActiveBalance:O}=(0,N.f)(),K=(0,e0.f)(),E=(0,u.useRef)(null),{clearChipMode:M}=eb(),F=(0,u.useRef)(null),U=(0,u.useCallback)(()=>{F.current&&(f(F.current),F.current=null)},[f]),W=(0,u.useCallback)(()=>{e||(E.current||(K.beginSession(),E.current=K.acquireSessionLock()),I(!0),_())},[K,_,e,I]),G=()=>({...h?.()?.content?.activeFreeplay??null}),L=e=>{let{gameState:a,onLoad:t=!1}=e;j(a),r({gameState:a,onLoad:t}),a.game_history_id&&a.game_action_id&&(o.current={game_action_id:a.game_action_id,game_history_id:a.game_history_id})},Q=(0,u.useRef)(!1),$=(0,u.useRef)(!1),q=(0,u.useCallback)(async()=>{if(!Q.current)if(M(),Q.current=!0,l(),F.current=null,d(),y({enabled:!1}),e?.active&&!H){P(!0),D(!0),i(!0),w(aa),$.current=!0,await new Promise(e=>setTimeout(e,100)),a?A.current=ae[a].deck.concat((0,e4.e)()):A.current=(0,e4.e)();let e=[],t=[];e.push((0,e8.y)(A.current)),t.push((0,e8.y)(A.current)),e.push((0,e8.y)(A.current)),t.push((0,e8.y)(A.current));let l={availableActions:{double:!0,hit:!0,split:!1,stand:!0},cards:e,handId:0,isActive:!0,isBust:!1,isDoubled:!1,isStand:!1,isWin:!1},n={betAmount:0,currency:"USD",currentHandIndex:0,currentTurn:0,dealerHand:{cards:t,isRevealed:!1},deck:A.current,insuranceOffered:!1,insuranceTaken:!1,insuranceWon:!1,playerHands:[l],status:"playerTurn"},s=21===(0,e8.B)(e),r=21===(0,e8.B)(t);s?s&&!r?(l.result="win",n.dealerHand.isRevealed=!0,l.isWin=!0,n.status="finished"):s&&r&&(n.dealerHand.isRevealed=!0,n.status="finished",l.result="push",l.isActive=!1):(e5(e)&&(l.availableActions.split=!0),r&&10===(0,e8.x)(t[0]).value&&(l.result="lose",n.status="finished",n.dealerHand.isRevealed=!0,l.availableActions={}),"A"===(0,e8.x)(t[0]).rank&&(n.insuranceOffered=!0)),w(n),L({gameState:e3(n)}),"finished"===n.status&&P(!1),setTimeout(()=>{D(!1)},500),Q.current=!1}else try{E.current||(K.beginSession(),E.current=K.acquireSessionLock()),P(!0),D(!0),i(!0);let e="api/v1/original-games/blackjack/play",l=s(),r=Object.values(l||{}).reduce((e,a)=>(0,V.f)(e).plus((0,V.f)(a||0)).toNumber(),0),d=(0,V.f)(t||0).plus((0,V.f)(r)).toNumber(),o=(0,e2.J)(e2.I.Blackjack,{instant:!!eL.f.getLocalStorageValue("instantPlay")}),u={animation_duration_ms:o,balance_type:R,bet_amount:String(t),currency:B,...l?{side_bets:l}:{},...a?{test_deck_key:a}:{}};if(H){e="/api/v1/original-games/blackjack/freeplay";let t=G();F.current=t;let l=t?.freeplay_id;u={animation_duration_ms:o,freeplay_id:l,...a?{test_deck_key:a}:{}},y({enabled:!1}),p()}let h=await c.S.post(e,u,{baseURL:"https://originals.rainbet.com"});h?.data?.error?(I(!1),P(!1),(0,ez.f)({code:h?.data?.error,type:eZ.a.ERROR}),H&&(y({enabled:!0}),U()),i(!1),D(!1),n(),E.current?.release?.(),E.current=null):(I(!0),O(e=>(0,V.f)(e).minus((0,V.f)(d)).toNumber()),h?.data?.gameState&&(h?.data?.gameState?.status!=="finished"&&_().then(()=>{I(!1)}),L({gameState:h?.data?.gameState})),D(!1),F.current=null,H&&(g(),k()),h?.data?.gameState?.status==="finished"&&(P(!1),K.endSession(),E.current?.release?.(),E.current=null,H&&m())),Q.current=!1}catch(e){E.current?.release?.(),E.current=null,D(!1),P(!1),i(!1),n(),Q.current=!1,(0,ez.f)({code:e?.response?.data?.error||e?.message,type:eZ.a.ERROR}),H&&(y({enabled:!0}),U(),e?.response?.data?.error===eY.D.GAME.FREEPLAY_NO_RESULTS&&b(!0).catch(e=>{console.error("Error refreshing freeplays",e)}))}},[e,t,B,R,_,i,O,H,G,d,a,m,p,I,y,U,b,g,k,l,n,s,M]),X=(0,u.useRef)(!1);return{applyRestoredSessionBalanceLock:W,dispatchAction:(0,u.useCallback)(async a=>{if(!X.current)if(X.current=!0,$.current&&e?.active&&!H)if(function(e,a){let t=Object.keys(a)[0];if(console.log("action",t),e.insuranceOffered)if("insurance"===t)return!0;else return console.log("Invalid action, insurance must be accepted or declined first"),!1;let l=e.playerHands[e.currentHandIndex];return"finished"===e.status?(console.log("Game is finished, no actions are valid"),!1):l.availableActions&&l.availableActions.hasOwnProperty(t)&&!0===l.availableActions[t]}(S,a)){i(!0),D(!0);let e={...S};!function(e,a){var t,l,n,s;let r=Object.keys(a)[0];if(0===e.currentTurn&&e.insuranceOffered&&"insurance"===r){return t=e,l=a,t.insuranceOffered=!1,!0===l.insurance&&(t.insuranceTaken=!0),21===(0,e8.B)(t.dealerHand.cards)&&(t.dealerHand.isRevealed=!0,t.playerHands.forEach(e=>{e.result="lose",e.isActive=!1,e.availableActions={}}),t.status="finished",t.insuranceTaken&&(t.insuranceWon=!0)),t.currentTurn+=1}switch(console.log("actionName",r),r){case"split":return function(e){let a=e.playerHands[e.currentHandIndex];if(e5(a.cards)){e.isSplit=!0;let t=(0,e8.x)(a.cards[0]),l=(0,e8.x)(a.cards[1]),n="A"===t.rank&&"A"===l.rank,s={double:!0,hit:!0,split:!1,stand:!0},r={availableActions:{...s},cards:[a.cards[0]],handId:a.handId,isActive:!0,isBust:!1,isDoubled:!1,isStand:!1,result:null},i={availableActions:{...s},cards:[a.cards[1]],handId:e.playerHands.length,isActive:!1,isBust:!1,isDoubled:!1,isStand:!1,result:null};if(r.cards.push((0,e8.y)(e.deck)),i.cards.push((0,e8.y)(e.deck)),n){let a={double:!1,hit:!1,split:!1,stand:!1};r.isStand=!0,r.isActive=!1,r.availableActions=a,i.isStand=!0,i.isActive=!1,i.availableActions=a,e.playerHands[e.currentHandIndex]=r,e.playerHands.push(i),e7(e)}else e.playerHands[e.currentHandIndex]=r,e.playerHands.push(i),21===(0,e8.B)(e.playerHands[0].cards)&&(e.playerHands[0].availableActions={},e.playerHands[0].isStand=!0,e.currentHandIndex=1),console.log("split newHand2",i),21===(0,e8.B)(e.playerHands[1].cards)&&(e.playerHands[1].availableActions={},e.playerHands[1].isStand=!0),e.playerHands[1].isStand&&e.playerHands[0].isStand&&e9(e),console.log("Split Calc Hand One",(0,e8.B)(e.playerHands[0].cards)),console.log("Split Calc Hand Two",(0,e8.B)(e.playerHands[1].cards)),console.log("Split Calc Game State",e),console.log("Split Calc Game State After Advance",e);e.currentTurn+=1}else console.error("Split action is not valid at this time.")}(e);case"double":let i=e.playerHands[e.currentHandIndex];if(console.log("hand",i),2!==i.cards.length||i.isDoubled)console.error("Double action is not valid at this time.");else{i.isDoubled=!0;let a=(0,e8.y)(e.deck);i.cards.push(a),(0,e8.B)(i.cards)>21&&(i.isBust=!0,i.result="lose"),i.isActive=!1,i.availableActions={},e9(e),e.currentTurn+=1}return;case"stand":let d;return(d=(n=e).playerHands[n.currentHandIndex]).isStand=!0,d.isActive=!1,d.availableActions={},e9(n),n.currentTurn+=1;case"hit":let c,o,u;return s=e,console.log("hit"),c=s.playerHands[s.currentHandIndex],o=(0,e8.y)(s.deck),c.cards.push(o),(u=(0,e8.B)(c.cards))>21?(c.isBust=!0,c.isActive=!1,c.availableActions={},c.result="lose",e9(s)):21===u?(c.isActive=!1,c.availableActions={},e9(s)):(c.availableActions={double:!1,hit:!0,split:!1,stand:!0},e6(s)),s.currentTurn+=1;default:return}}(e,a),w({...e}),L({gameState:e3(e)}),setTimeout(()=>{D(!1),"finished"===e.status&&(P(!1),$.current=!1,y({enabled:!0}))},50),X.current=!1}else console.log(`Action "${a}" is not valid at this time.`),X.current=!1,$.current=!1;else{D(!0),i(!0);try{E.current||(K.beginSession(),E.current=K.acquireSessionLock());let e=Object.keys(a)[0],l=0;("double"===e||"split"===e)&&(l=t),"insurance"===e&&a?.[e]&&(l=(0,V.f)(t).times(.5).toNumber());let n=await c.S.post(`api/v1/original-games/blackjack/${o.current.game_history_id}/${o.current.game_action_id}/action`,{action_name:a,animation_duration_ms:(0,e2.J)(e2.I.Blackjack,{instant:!!eL.f.getLocalStorageValue("instantPlay")})},{baseURL:"https://originals.rainbet.com"});if(n?.data?.error)(0,ez.f)({code:n?.data?.error,type:eZ.a.ERROR}),D(!1),i(!1),I(!1),O(e=>(0,V.f)(e).plus((0,V.f)(l)).toNumber()),X.current=!1,n?.data?.error===eY.D.GAME.NO_ACTIVE_GAME&&(console.log(eY.D.GAME.NO_ACTIVE_GAME),d(),L({gameState:aa}),P(!1));else{I(!0),O(e=>(0,V.f)(e).minus((0,V.f)(l)).toNumber()),L({gameState:n?.data?.gameState}),n?.data?.gameState?.used_freeplay_id&&n?.data?.gameState?.is_freeplay===!0&&p({freeplayId:n?.data?.gameState?.used_freeplay_id}),n?.data?.gameState?.status==="finished"&&(P(!1),K.endSession(),E.current?.release?.(),E.current=null,H&&m()),D(!1);let a="double"===e||"split"===e||"insurance"===e;a&&n?.data?.gameState?.status!=="finished"&&(console.log("debug Mutating Balance"),_().then(()=>{I(!1)})),H&&a&&(g(),k()),X.current=!1}console.log("Response",n)}catch(e){i(!1),X.current=!1,(0,ez.f)({code:e?.response?.data?.error||eY.D.GENERAL.NETWORK,type:eZ.a.ERROR}),console.error("Error starting game",e)}}},[e,S,_,i,t,O,H,o,d,f,I,y,m,p,g,k]),inGame:T,isLoading:x,publicGameState:C,setInGame:P,setIsLoading:D,setPublicGameState:L,startNewGame:q,tempInDemoMode:$,walletSetting:B}};var al=e.i(411291);function an(e){let a=[];try{let t=e?.handRef?.current;if(!t||"u"<typeof document)return a;t.querySelectorAll('[data-bj="card"]').forEach(e=>{let t=e.getAttribute("data-card-key")||"",l=e.style&&e.style.transform||"",n=!1;if(l&&l.includes("translate")){let e=l.match(/translate3d\(([^)]+)\)/);if(e){let a=e[1].split(",").map(e=>e.trim()),t=a[0]||"0",l=a[1]||"0";n=!(t.startsWith("0")&&l.startsWith("0"))}else{let e=l.match(/translate\(([^)]+)\)/);if(e){let a=e[1].split(",").map(e=>e.trim()),t=a[0]||"0",l=a[1]||"0";n=!(t.startsWith("0")&&l.startsWith("0"))}}}a.push({hasInlineTranslate:n,key:t})})}catch(e){console.warn("parseCardKeysAndInlineTranslate error:",e)}return a}function as(e,a){if(e.length!==a.length)return!1;for(let t=0;t<e.length;t++)if(e[t]!==a[t])return!1;return!0}var ar=e.i(94150);let ai=(0,o.default)(()=>e.A(173745),{loadableGenerated:{modules:[9496]}}),ad=(0,o.default)(()=>e.A(20777),{loadableGenerated:{modules:[640640]}});e.s(["default",0,function(){(0,t.f)();let[e,o]=(0,u.useState)(!1),[m,g]=(0,u.useState)({text:!1,active:!1}),[k,H]=(0,u.useState)(),{clearChipMode:A}=eb(),{cycleFreeplay:S,setActiveFreeplay:w,getFreeplayContentRef:C,addBackFreeplay:j,refreshFreeplays:x,onGameCompletedCycleFreeplay:_,mutateAllFreeplays:R,mutate:E}=(0,l.f)(),{isLoggedIn:M}=(0,d.f)(),F=(0,n.f)("freePlayControls"),L=(0,n.f)("freePlayButton"),$=(0,u.useRef)(!1),q=(0,i.f)({}),X=(0,i.f)({breakPointOne:950,breakPointTwo:768,breakPointThree:500,breakPointFour:400}),J=(0,u.useRef)(!1),z="mobile-one"!==q&&"mobile-two"!==q,Y=function(e,a){let t=(0,D.y)(I),l=(0,D.F)(I),n=(0,D.F)(v.B),s=(0,D.F)(K),{balance:r,balanceMutate:i,setDynamicBalanceActive:d}=(0,N.f)(),c=(0,T.s)(),o=(0,u.useRef)(!1),p=(0,u.useRef)(0),h=(0,u.useRef)(!1),m=(0,u.useRef)(null),b=(0,u.useRef)(null),y=(0,u.useRef)(null),g=(0,u.useRef)(!1),{perfectPair:k,twentyOne:H}=t,A=(0,u.useCallback)(function(e,t){let l=arguments.length>2&&void 0!==arguments[2]&&arguments[2];if(a)return;let n=(0,P.O)(l),s=!!e?.sub_type,r=!!t?.sub_type;(s||r)&&(g.current||(b.current&&(b.current.kill(),b.current=null),y.current&&(cancelAnimationFrame(y.current),y.current=null),g.current=!0,y.current=requestAnimationFrame(()=>{let e=[],a=document.getElementById(Q),t=document.getElementById("side-bet-twenty-one-popup");if(s&&a instanceof HTMLDivElement&&e.push(a),r&&t instanceof HTMLDivElement&&e.push(t),0===e.length){g.current=!1,y.current=null;return}f.e.set(e,{clearProps:"x,autoAlpha"});let l=f.e.timeline({onComplete:()=>{f.e.set(e,{clearProps:"x,autoAlpha"}),g.current=!1,b.current=null}});b.current=l,y.current=null,l.to(e,{autoAlpha:1,duration:P.V/1e3,ease:"power2.out",x:"0%"}).to({},{duration:n/1e3}).to(e,{autoAlpha:1,duration:P.V/1e3,ease:"power2.in",x:(e,a)=>a.id===Q?"-101%":"101%"})})))},[a]);(0,u.useEffect)(()=>{let a=Number(e||0)>0,t=Number(k.betAmount||0)>0||Number(H.betAmount||0)>0;Number(e||0)+Number(k.betAmount||0)+Number(H.betAmount||0)>Number(r||0)?s({active:!0,text:c("insufficient_balance")}):!a&&t?s({active:!0,text:c("side_bets_require_main_bet")}):s(O)},[r,c,e,k.betAmount,s,H.betAmount]),(0,u.useEffect)(()=>()=>{y.current&&cancelAnimationFrame(y.current),b.current&&(b.current.kill(),b.current=null),m.current&&clearTimeout(m.current),s(O),l(B())},[s,l]);let S=(0,u.useCallback)(()=>{l(e=>({perfectPair:{...e.perfectPair,active:!1},twentyOne:{...e.twentyOne,active:!1}}))},[l]),w=(0,u.useCallback)((e,a)=>{l(t=>U(t,e,t=>({...t,result:a?{multiplier:a.multiplier??"0",payout:a.payout??"0",sub_type:a.sub_type??null,type:e}:null})))},[l]),C=(0,u.useCallback)(e=>{l(a=>U(a,e,e=>({...e,result:null})))},[l]),j=(0,u.useCallback)(e=>{let a=e?.side_bets_result??[],t=a.find(e=>"perfect_pair"===W(e.type)),s=a.find(e=>"21_plus_3"===W(e.type));a.length>0&&n(e=>e||!0),l(e=>({perfectPair:{...e.perfectPair,active:!1,activeGame:!0,betAmount:t?t.amount:null,errors:{active:!1,text:""},result:null},twentyOne:{...e.twentyOne,active:!1,activeGame:!0,betAmount:s?s.amount:null,errors:{active:!1,text:""},result:null}})),o.current=!1,h.current=!1},[l,n]),x=(0,u.useCallback)(function(e){let a=arguments.length>1&&void 0!==arguments[1]&&arguments[1];if(p.current+=1,o.current)return;let t=e??[];t.length>0&&n(e=>e||!0);let s=t.find(e=>"perfect_pair"===W(e.type)),r=t.find(e=>"21_plus_3"===W(e.type)),c=s?G(s):null,u=r?G(r):null;l(e=>({perfectPair:{...e.perfectPair,active:!1,betAmount:s?s.amount:null,result:c},twentyOne:{...e.twentyOne,active:!1,betAmount:r?r.amount:null,result:u}})),A(c,u,a),o.current=!0;let f=t.some(e=>!!e?.sub_type);h.current=f,f&&(d(!0),i().finally(()=>{d(!1)}))},[l,n,i,d,A]),_=(0,u.useCallback)(()=>{m.current&&(clearTimeout(m.current),m.current=null),o.current=!1,p.current=0,h.current=!1,l(e=>({perfectPair:{...e.perfectPair,active:!1,activeGame:!0,errors:{active:!1,text:""},result:null},twentyOne:{...e.twentyOne,active:!1,activeGame:!0,errors:{active:!1,text:""},result:null}}))},[l]),R=(0,u.useCallback)(()=>{m.current&&(clearTimeout(m.current),m.current=null),o.current=!1,p.current=0,h.current=!1,l(e=>({perfectPair:{...e.perfectPair,active:!1,activeGame:!1},twentyOne:{...e.twentyOne,active:!1,activeGame:!1}}))},[l]),E=(0,u.useCallback)(function(){let e=arguments.length>0&&void 0!==arguments[0]&&arguments[0],a=p.current,t=h.current,n=()=>{l(e=>({perfectPair:{...e.perfectPair,active:e.perfectPair.errors.active,activeGame:!1,result:null},twentyOne:{...e.twentyOne,active:e.twentyOne.errors.active,activeGame:!1,result:null}})),m.current=null};if(m.current&&(clearTimeout(m.current),m.current=null),o.current=!1,p.current=0,h.current=!1,1===a&&t){m.current=setTimeout(n,e?1e3:2500);return}n()},[l]),M=(0,u.useCallback)(()=>{m.current&&(clearTimeout(m.current),m.current=null),o.current=!1,p.current=0,h.current=!1,l(B())},[l]);return{clearSideBetResult:C,getSideBetsForApi:(0,u.useCallback)(()=>[k,H].filter(e=>Number(e.betAmount||0)>0).map(e=>({amount:String(e.betAmount),type:e.type})),[k,H]),getSideBetsStartPayload:(0,u.useCallback)(()=>{let e={};return Number(k.betAmount||0)>0&&(e.perfect_pair=String(k.betAmount)),Number(H.betAmount||0)>0&&(e["21_plus_3"]=String(H.betAmount)),Object.keys(e).length>0?e:null},[k.betAmount,H.betAmount]),loadGameInitializer:j,onGameCompletedSidebet:E,onStartGameSideBets:_,onStartGameSideBetsFailed:R,perfectPairSideBet:k,resetSideBets:M,setAllSideBetsInactive:S,setSideBetResults:w,setSideBetsFromGameState:x,sideBetsState:t,twentyOneSideBet:H}}(k,z),Z=(0,u.useRef)(),ee=(0,u.useRef)(),ea=(0,u.useRef)({game_history_id:null,game_action_id:null}),{dealerRef:et,playerHands:el,dealerHand:en,playerHandsRefs:es,setLockActionButtons:er,lockActionButtons:ei,setGameplayPublicGameState:ed,totalSideCards:ec,backgroundDisplayRef:eo,specialBlackjackDisplay:eu,cardAnimationTimline:ep,resetGameBoard:eh}=function(e){let a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:()=>{},t=arguments.length>2&&void 0!==arguments[2]?arguments[2]:()=>{},{balanceMutate:l,setDynamicBalanceActive:n}=(0,N.f)(),s=(0,u.useRef)(!1),[r,i]=(0,u.useState)(null),[d,c]=(0,u.useState)([]),[o,p]=(0,u.useState)(null),[h,m]=(0,u.useState)(!1),[b,y]=(0,u.useState)(0),[g,k]=(0,u.useState)(!1),v=(0,u.useRef)(f.e.timeline({paused:!0})),H=(0,u.useRef)(null),A=(0,u.useRef)([(0,u.createRef)(),(0,u.createRef)()]),S=(0,u.useRef)(null),w=(0,u.useRef)(!1),C=(0,u.useRef)(!0),j=(0,u.useRef)(!1),x=(0,u.useRef)(!1),D=(0,u.useRef)(null),T=(0,u.useRef)(!1),P=(0,u.useRef)({0:{cards:[]},1:{cards:[]}}),_=(0,u.useRef)({cards:[]});(0,u.useEffect)(()=>()=>{v.current.kill(),(0,al.C)()},[]);let R=(0,u.useRef)(null),B=(0,u.useRef)(null),I=async function(){let e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];T.current?console.log("Game already clearing"):(T.current=!0,R.current=new Promise(e=>{B.current=e}),v.current.clear(),k(!1),A.current.forEach(e=>{e.current?.hideResult()}),H.current?.hideResult(),!(e||s.current)&&function(){let{distance:e=100,duration:a=.2,stagger:t=.05}=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},l=v.current;l.clear();let n="clear-start";l.addLabel(n,0);let s=!1;try{let r=document.querySelectorAll("#dealer-hand-0 .blackjack-card");r.length>0&&(l.to(r,{duration:a,ease:"power2.inOut",opacity:0,stagger:t,y:`-=${e}px`},n),s=!0),document.querySelectorAll('[id^="player-hand-"]').forEach(r=>{let i=r.querySelectorAll(".blackjack-card");i.length>0&&(l.to(i,{duration:a,ease:"power2.inOut",opacity:0,stagger:t,y:`+=${e}px`},n),s=!0)})}catch(e){console.warn("scheduleClearAllCardsOnTimeline failed",e)}return s}({duration:.1})&&(await new Promise(e=>{v.current.eventCallback("onComplete",e),v.current.play(0)}),v.current.clear()),console.log("[blackjack] resetGameBoard"),C.current=!0,c([]),p(null),A.current=[(0,u.createRef)(),(0,u.createRef)()],S.current=null,j.current=!1,w.current=!1,P.current={0:{cards:[]},1:{cards:[]}},_.current={cards:[]},x.current=!1,y(0),i(null),await (0,al.R)(),await G(10),console.log("[blackjack] cleared hand render history"),T.current=!1,B.current())},O=async()=>{T.current&&R.current&&(console.log("waitForGameClear"),await R.current)};async function K(e){let{gameState:a,onLoad:t=!1}=e;if(t||await O(),console.log("Cleared the waiting"),v.current.clear(),s.current=!!eL.f.getLocalStorageValue("instantPlay"),i(a),!t&&(_.current?.cards?.length>0||P.current?.[0]?.cards?.length>0||P.current?.[1]?.cards?.length>0)&&function(e){let{dealerCardsRef:a,gameState:t,playersCardsRefs:l}=e;try{let e=t?.dealerHand||{cards:[]},n=t?.playerHands||[],s=a?.current?.cards||[],r=l?.current?.[0]?.cards||[];if(s.length>0&&(e.cards?.length||0)>0){let a=s[0]?.code||"",t=e.cards?.[0]?.code||"";if(a&&t&&a!==t)return console.warn("[diff card] PreSanity dealer first code mismatch",{newCode:t,oldCode:a}),!0}if(1===n.length){let e=n[0]?.cards||[];if(e.length>2&&r.length>=2){let a=e[0]?.code||"",t=e[1]?.code||"",l=r[0]?.code||"",n=r[1]?.code||"";if(a!==l||t!==n)return console.warn("[diff card] PreSanity player first two mismatch (single-hand)",{prev:[l,n],server:[a,t]}),!0}}if(n.length>1)for(let e=0;e<n.length;e++){let a=n[e]?.cards||[],t=l?.current?.[e]?.cards||[];if(a.length>2&&t.length>=2){let l=a[0]?.code||"",n=a[1]?.code||"",s=t[0]?.code||"",r=t[1]?.code||"";if(l!==s||n!==r)return console.warn("[diff card] PreSanity player first two mismatch (split)",{handIndex:e,prev:[s,r],server:[l,n]}),!0}}}catch(e){console.warn("[diff card] PreSanity check error",e)}return!1}({dealerCardsRef:_,gameState:a,playersCardsRefs:P}))return void await M(a);if(!x.current&&(x.current=!0,1)){let e;if((1!==(e=a?.playerHands||[]).length||2!==(e[0]?.cards||[]).length)&&!t){console.log("Not truly brand new game"),await M(a);return}console.log("Brand New Game");let l=a?.playerHands?.length||0,n=(0,al.g)(l,!0);console.log("[blackjack] Brand New Game",a?.playerHands),c(a?.playerHands),p(a?.dealerHand),await n.wait()}if(a?.isSplit&&!w.current){w.current=!0;let e=(0,al.g)(2);c(a?.playerHands),await e.wait(),console.log("gameplay: rendering Gate sync for split hand"),F(a,t)}else{let{dealerNewCards:e,playerUpdates:l,shouldForceResultsDisplay:n}=U(a);if(n)return void await M(a);W(l,e,a,t)}}async function E(e){try{if(!e)return;let a=e?.playerHands?.length||0,t=(0,al.g)(a,!0);c(e?.playerHands),p(e?.dealerHand),await t.wait(),H.current?.addCardsInstantlyReset&&await H.current.addCardsInstantlyReset([...e?.dealerHand?.cards||[]]);let l=e?.playerHands||[];l.forEach(async(e,a)=>{let t=A.current?.[a]?.current;t?.addCardsInstantlyReset&&await t.addCardsInstantlyReset([...e?.cards||[]])}),P.current={0:{cards:l[0]?.cards||[]},1:{cards:l[1]?.cards||[]}},_.current={cards:e?.dealerHand?.cards||[]};let n=0;l.forEach(e=>{n+=(e?.cards||[]).length}),y(n)}catch(e){console.warn("resyncDisplayInstant error",e)}}async function M(r){try{s.current&&await G(100),function(e){let{dealerRef:a,gameState:t,playerHandsRefs:l}=e;if("u"<typeof document||!t)return;let n=[],s=an(a?.current),r=s.map(e=>e.key),i=function(e){let a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,t=!!e?.isRevealed;return(e?.cards||[]).map((e,l)=>{let n=(t||1!==l)&&e?.code||"facedown";return`${a}-${l}-${n}`})}(t.dealerHand,0);if(!as(r,i)){let e={displayed:r,expected:i};console.warn("[Sanity] Dealer mismatch",e),n.push({detail:e,scope:"dealer"})}let d=s.filter(e=>e.hasInlineTranslate);if(d.length>0){let e={offPosition:d};console.warn("[Sanity] Dealer off-position",e),n.push({detail:e,scope:"dealer-position"})}if((t.playerHands||[]).forEach((e,a)=>{let t=an(l?.current?.[a]?.current),s=t.map(e=>e.key),r=(e?.cards||[]).map((e,t)=>{let l=e?.code||"facedown";return`${a}-${t}-${l}`});if(!as(s,r)){let e={displayed:s,expected:r};console.warn(`[Sanity] Player hand ${a} mismatch`,e),n.push({detail:e,scope:`player-${a}`})}let i=t.filter(e=>e.hasInlineTranslate);if(i.length>0){let e={offPosition:i};console.warn(`[Sanity] Player hand ${a} off-position`,e),n.push({detail:e,scope:`player-${a}-position`})}}),n.length>0)throw Error("BlackjackSanityCheckFailed")}({dealerRef:H,gameState:r,playerHandsRefs:A})}catch(e){console.warn("Sanity check failed (setResultsDisplay), resetting:",e),E(r)}if(a(r?.side_bets_result||[],s.current),"finished"===r.status){D.current?.playAnimation();let a=250*!s.current,i=!1,d=!1;2!==r.playerHands[0].cards.length||2!==r.dealerHand.cards.length||"push"===r.playerHands[0].result||r?.isSplit||(i=(0,ar.I)(r.playerHands[0].cards)?.high===21,d=(0,ar.I)(r.dealerHand.cards)?.high===21),setTimeout(()=>{var c,o;r.playerHands.forEach((e,a)=>{e.result&&(console.log("Result ref ",a,A.current[a]?.current,e.result),A.current[a]?.current?.setResultsDisplay(e.result,i))}),r.playerHands.forEach((e,a)=>{console.log("update hand check",e);let t=!1;e?.isStand&&e?.result==="win"&&(t="win"),e?.isStand&&e?.result==="push"&&(t="tie"),A.current[a]?.current&&t&&A.current[a]?.current?.setTotalMessageDisplay(t)}),c=r,o=d,console.log("debug push dealer",c.playerHands[0].result),"push"===c.playerHands[0].result?1===c.playerHands.length&&(H.current?.setResultsDisplay("push"),H.current?.setTotalMessageDisplay("tie")):o&&H.current?.setResultsDisplay("blackjack",!0),i&&k(!0),setTimeout(()=>{m(!1),e({enabled:!0}),t(s.current),console.log("Trigger unlock delay",a)},200),l().then(()=>{n(!1)})},a)}else m(!1)}async function F(e){let a=arguments.length>1&&void 0!==arguments[1]&&arguments[1],t=A.current[0]?.current,l=A.current[1]?.current;if(a&&s.current||t.removeCardAtIndex(1),t=A.current[0]?.current,l=A.current[1]?.current,s.current||a)await t.addCardsInstantlyReset([...e.playerHands[0].cards]),await l.addCardsInstantlyReset([...e.playerHands[1].cards]);else{let a=e.playerHands[0].cards[1],n=e.playerHands[1]?.cards;l.setupSplitHandInstantly(n[0]);let s="split-0",r="split-1";v.current.addLabel(s,0),v.current.addLabel(r,.25),await t.drawCard({newCard:a,newCardIndex:1,position:s}),await l.drawCard({newCard:n[1],newCardIndex:1,position:r}),await new Promise(e=>{v.current.eventCallback("onComplete",e),v.current.play()}),v.current.clear()}P.current[0].cards=e.playerHands[0].cards,P.current[1].cards=e.playerHands[1].cards;let{dealerNewCards:n,playerUpdates:r,shouldForceResultsDisplay:i}=U(e);(console.log("gameplay: deal new cards",n,r),console.log("gameplay: gameState",e),i)?await M(e):W(r,n,e,a)}function U(e){let a,t,{shouldForceResultsDisplay:l,updates:n}=(a=[],t=!1,(e.playerHands||[]).forEach((e,l)=>{let n=P.current[l].cards||[],s=n.length;for(let a=0;a<s;a++){let s=n[a]?.code||"",r=e.cards?.[a]?.code||"";if(s!==r){console.warn("[diff card] Code mismatch",{handIndex:l,idx:a,newCode:r,oldCode:s}),t=!0;break}}if(!t){if((e.cards?.length||0)>s){let n=e.cards.slice(s);s>=2&&n.length>1&&(console.warn("[diff card] Multiple new cards for single hand",{addedCount:n.length,handIndex:l,oldCount:s}),t=!0),a.push({handIndex:l,newCards:n,oldCount:s})}P.current[l].cards=e.cards||[]}}),t||console.log("[diff card] Synced player trackers",{hand0Count:(P.current?.[0]?.cards||[]).length,hand1Count:(P.current?.[1]?.cards||[]).length}),{shouldForceResultsDisplay:t,updates:a}),{newCards:s,shouldForceResultsDisplay:r}=function(e){let a=e.dealerHand||{cards:[],isRevealed:!1},t=_.current.cards||[],l=!1,n=t.length,s=a.cards?.length||0,r=Math.min(n,s);for(let e=0;e<r;e++){let n=t[e]?.code||"",s=a.cards?.[e]?.code||"";if(n!==s){if(""===n&&""!==s){console.log("[diff card] Ignoring dealer flip code change",{idx:e,newCode:s,oldCode:n});continue}console.warn("[diff card] Dealer code mismatch (not a flip)",{idx:e,newCode:s,oldCode:n}),l=!0;break}}let i=[];return s>n&&(i=a.cards.slice(n)),_.current.cards=a.cards||[],l||console.log("[diff card] Synced dealer tracker",{dealerCount:_.current.cards.length}),{newCards:i,shouldForceResultsDisplay:l}}(e),i=!!(l||r);return console.log("[diff card] Summary",{dealerNewCardsCount:s.length,playerUpdatesCount:n.length,shouldForceResultsDisplay:i}),{dealerNewCards:s,playerUpdates:n,shouldForceResultsDisplay:i}}async function W(e,a,t,l){let n=e.flatMap(e=>e.newCards.map(a=>({card:a,handIndex:e.handIndex,isDealer:!1}))),r=a.map(e=>({card:e,isDealer:!0})),i=[...n,...r];"finished"!==t.status||l||(j.current=!0,i=[...n,{isDealerFlip:!0},...r]),l&&(C.current=!1),C.current&&!l&&(C.current=!1,console.log("Initial Deal",i),i=[n[0],r[0],n[1],r[1]],"finished"===t.status&&(i=[...i,{isDealerFlip:!0}])),t.playerHands.forEach((e,a)=>{console.log("hand check",e);let t=!1;e?.isDoubled&&(t="double"),e?.isStand&&(t="stand"),A.current[a]?.current&&t&&A.current[a]?.current?.setTotalMessageDisplay(t)});let d=0;if(t.playerHands.forEach(e=>{d+=e.cards.length}),y(d),s.current||l){let e=[],a={};for(let t of i)t?.isDealer?e.push(t.card):(a[t?.handIndex]||(a[t?.handIndex]=[]),a[t?.handIndex].push(t.card));for(let[t,l]of(e.length>0&&await H.current?.addCardsInstantly(e),Object.entries(a)))await A.current[t]?.current?.addCardsInstantly(l);"finished"===t.status&&await H.current?.flipDealerCardInstant(t.dealerHand.cards[1]),M(t)}else{let e=0,a=0;for(let l of i){let n=`deal-${a}`;if(v.current.addLabel(n,e),l?.isDealer)await H.current?.drawCard({newCard:l.card,position:n});else if(l?.isDealerFlip){let e=`${n}`;i.length>1&&(e=`${e}+=0.25`),H.current?.flipDealerCard(t.dealerHand.cards[1],!1,e)}else await A.current[l?.handIndex]?.current?.drawCard({newCard:l?.card,position:n});a+=1,e+=.25}console.log("Deal Actions",i),i.length>0&&(await new Promise(e=>{v.current.eventCallback("onComplete",e),v.current.play()}),v.current.clear()),console.log("gameplay: setResultsDisplay"),M(t)}}function G(e){return new Promise(a=>setTimeout(a,e))}return{backgroundDisplayRef:D,cardAnimationTimline:v,dealerHand:o,dealerRef:H,localGameState:r,lockActionButtons:h,playerHands:d,playerHands:d,playerHandsRefs:A,playerHandTwo:S,resetGameBoard:I,setGameplayPublicGameState:K,setLockActionButtons:m,specialBlackjackDisplay:g,totalSideCards:b}}(L,Y.setSideBetsFromGameState,Y.onGameCompletedSidebet),{applyRestoredSessionBalanceLock:ef,startNewGame:em,dispatchAction:ey,publicGameState:eg,isLoading:ek,inGame:ev,setInGame:eH,setPublicGameState:eA,tempInDemoMode:eS,walletSetting:ew}=at(m,e,k,Y.onStartGameSideBets,Y.onStartGameSideBetsFailed,Y.getSideBetsStartPayload,ed,er,eh,ea,S,C,j,_,x,L,R,E),[eC,ej]=(0,u.useState)(!1);return(0,u.useEffect)(()=>{M&&e();async function e(){try{let a=await c.S.get("/api/v1/original-games/blackjack/active-session",{baseURL:"https://originals.rainbet.com"});if(a?.data?.gameState){var e;let t,l,n,s,r,i;Y.loadGameInitializer(a.data.gameState);let d=(e=a.data.gameState,t=(0,V.f)(e?.betAmount||0),n=(l=Array.isArray(e?.playerHands)?e.playerHands:[]).length>0?l.length:1,s=l.reduce((e,a)=>e+ +!!a?.isDoubled,0),r=.5*!!e?.insuranceTaken,(i=(0,V.f)(n).plus(s).plus(r)).eq(0)?0:Number(t.div(i)));if(H(d),eH(!0),eA({gameState:a.data.gameState,onLoad:!0}),g({text:!1,active:!1}),eS.current=!1,ea.current={game_history_id:a.data.gameState.game_history_id,game_action_id:a.data.gameState.game_action_id},"finished"!==a.data.gameState.status&&ef(),L({enabled:!1}),a?.data?.gameState?.is_freeplay){$.current=!0;let e={freeplay_id:null,value:d,currency:a?.data?.gameState?.currency};F({displayed:!0,enabled:!1}),w({freeplayKey:null,load:e}),J.current=!0}}}catch(e){console.log("Error checking active games",e)}}},[M]),(0,u.useEffect)(()=>()=>{A()},[A]),(0,a.jsx)(a.Fragment,{children:(0,a.jsx)(s.f,{isMobile:X,isBlackjack:!0,blackjackFooterToggle:(0,a.jsx)(eq,{}),children:(0,a.jsx)("div",{className:(0,b.c)(h.default["blackjack-game-container"],h.default[q]),children:(0,a.jsxs)("div",{className:h.default["blackjack-game-display"],ref:Z,children:[(0,a.jsx)(r.f,{maxPayout:2e5,instructionsKey:"blackjack_instructions"}),(0,a.jsxs)("div",{id:"blackjack-game-display",className:` ${h.default["blackjack-game-display-inner"]} ${p.f?.variable}`,children:[!z&&(0,a.jsx)(eJ,{perfectPairSideBet:Y.perfectPairSideBet,twentyOneSideBet:Y.twentyOneSideBet,resultCurrencyCode:"string"==typeof eg?.currency?eg.currency:ew}),(0,a.jsx)(y,{isMobile:X,ref:eo,specialBlackjackDisplay:eu}),(0,a.jsx)(eM,{cardDeckRef:ee,isMobile:X}),(0,a.jsx)(ad,{publicGameState:eg,gameDisplayRef:Z,cardDeckRef:ee,isMobile:X,instantPlay:eC,dealerRef:et,dealerHand:en,cardAnimationTimline:ep}),(0,a.jsx)(eG,{isMobile:X,showLogo:eu}),(0,a.jsx)(ai,{publicGameState:eg,isMobile:X,gameDisplayRef:Z,cardDeckRef:ee,instantPlay:eC,playerHandsRefs:es,playerHands:el,totalSideCards:ec,cardAnimationTimline:ep})]}),(0,a.jsx)(eO,{startNewGame:em,dispatchAction:ey,publicGameState:eg,testDeck:e,isLoading:ek,inGame:ev,demoMode:m,setDemoMode:g,betAmount:k,setBetAmount:H,lockActionButtons:ei,isMobile:q,walletSetting:ew,resetGameBoard:eh,resetSideBets:Y.resetSideBets,onFreeplayLoadRef:J})]})})})})}],761619)},135352,function(e){e.n(e.i(761619))}]);

//# sourceMappingURL=0y-0fkec4vh3u.js.map