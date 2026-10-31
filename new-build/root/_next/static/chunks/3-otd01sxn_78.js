(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,4543,e=>{e.v({"perfect-pair-popup":"side-bet-mobile-popup-container-module-scss-module__WCrfCq__perfect-pair-popup","side-bet-mobile-popup-amount":"side-bet-mobile-popup-container-module-scss-module__WCrfCq__side-bet-mobile-popup-amount","side-bet-mobile-popup-container":"side-bet-mobile-popup-container-module-scss-module__WCrfCq__side-bet-mobile-popup-container","side-bet-mobile-popup-item":"side-bet-mobile-popup-container-module-scss-module__WCrfCq__side-bet-mobile-popup-item","side-bet-mobile-popup-values":"side-bet-mobile-popup-container-module-scss-module__WCrfCq__side-bet-mobile-popup-values","side-bet-mobile-popup-win-name":"side-bet-mobile-popup-container-module-scss-module__WCrfCq__side-bet-mobile-popup-win-name","twenty-one-popup":"side-bet-mobile-popup-container-module-scss-module__WCrfCq__twenty-one-popup"})},761619,e=>{"use strict";var a=e.i(380447),t=e.i(28729),l=e.i(121930),s=e.i(871320),n=e.i(802580),r=e.i(688808),i=e.i(113951),d=e.i(702123),o=e.i(441543),c=e.i(494882),u=e.i(999161),p=e.i(580663),h=e.i(142763),f=e.i(946197),m=e.i(505353),b=e.i(386547);let y=(0,u.forwardRef)((e,t)=>{let{isMobile:l,specialBlackjackDisplay:s}=e,n=(0,u.useRef)();return(0,u.useImperativeHandle)(t,()=>({playAnimation:()=>{n.current&&n.current.isActive()||(console.log("playAnimation"),n.current&&n.current.kill(),n.current=f.default.timeline({paused:!1}),n.current.to(`.${h.default["masked-texture-container"]}`,{duration:3,maskImage:`linear-gradient(
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
        )`}))}})),(0,a.jsx)(a.Fragment,{children:(0,a.jsx)("div",{className:(0,b.cn)(h.default["background-container"],l&&h.default["mobile-display"],s&&h.default["blackjack-effect"]),children:(0,a.jsx)("div",{className:h.default["table-container"]})})})});y.displayName="BackgroundDisplay";var g=e.i(562028),k=e.i(591953),v=e.i(326276);let A={coloured_pair:"Coloured Pair",flush:"Flush",mixed_pair:"Mixed Pair",perfect_pair:"Perfect Pair",straight:"Straight",straight_flush:"Straight Flush",suited_trips:"Suited Trips",three_of_a_kind:"Three of a Kind"},H="main-bet",S={CAD:{MAX_AMOUNT:1e3,MIN_AMOUNT:.1},USD:{MAX_AMOUNT:1e3,MIN_AMOUNT:.1}};var C=e.i(919244),w=e.i(278033),T=e.i(971376);e.i(59015);var D=e.i(679284),j=e.i(850435),x=e.i(101104),P=e.i(998165),_=e.i(392276),R=e.i(639670);let N=e=>({active:!1,activeGame:!1,betAmount:null,errors:{active:!1,text:""},result:null,type:e}),B=()=>({perfectPair:N("perfect_pair"),twentyOne:N("21_plus_3")}),I=(0,R.atom)(B()),O={active:!1,text:""},E=(0,R.atom)(O),K=(0,R.atom)(e=>e(I).perfectPair,(e,a,t)=>{let l=e(I).perfectPair,s="function"==typeof t?t(l):t;a(I,e=>({...e,perfectPair:s}))}),M=(0,R.atom)(e=>e(I).twentyOne,(e,a,t)=>{let l=e(I).twentyOne,s="function"==typeof t?t(l):t;a(I,e=>({...e,twentyOne:s}))}),F={"21_plus_3":"twentyOne",perfect_pair:"perfectPair"},U=(e,a,t)=>{let l=F[a];return{...e,[l]:t(e[l])}},W=e=>"21+3"===e?"21_plus_3":e,G=e=>({multiplier:e.multiplier??"0",payout:e.payout??"0",sub_type:e.sub_type,type:W(e.type)}),L={"21_plus_3":"21+3",perfect_pair:"Perfect Pair"},Q="side-bet-perfect-pair-popup";var V=e.i(420422),$=e.i(185457),q=e.i(385993);let X=()=>(0,a.jsx)(m.CdnSvg,{src:"/originals/blackjack/double.svg"}),z=()=>(0,a.jsx)(m.CdnSvg,{src:"/originals/blackjack/hit.svg"}),Y=()=>(0,a.jsx)(m.CdnSvg,{src:"/originals/blackjack/insurance.svg"}),J=()=>(0,a.jsx)(m.CdnSvg,{src:"/originals/blackjack/notice.svg"}),Z=()=>(0,a.jsx)(m.CdnSvg,{src:"/originals/blackjack/split.svg"}),ee=()=>(0,a.jsx)(m.CdnSvg,{src:"/originals/blackjack/stand.svg"}),ea=e=>{let{dispatchAction:t,isMobile:l,lockActionButtons:s=!0,publicGameState:n}=e,r=(0,x.useTranslate)(),i=(0,u.useMemo)(()=>n?.playerHands?.[n?.currentHandIndex]?.availableActions,[n?.playerHands,n?.currentHandIndex]),d=(0,u.useMemo)(()=>(0,a.jsx)("div",{className:h.default["insurance-container"],children:(0,a.jsxs)("div",{className:h.default["insurance-inner"],children:[(0,a.jsxs)("div",{className:h.default["insurance-heading"],children:[(0,a.jsxs)("div",{className:h.default["insurance-icon-container"],children:[(0,a.jsx)(Y,{}),(0,a.jsx)("span",{children:r("blackjack_insurance_heading")})]}),(0,a.jsxs)("div",{className:h.default["insurance-bet-amount"],children:[(0,a.jsx)("span",{children:r("blackjack_game_total")}),(0,a.jsx)($.ValueDisplay,{amount:(0,q.sBig)(n?.betAmount).div(2).toNumber(),currencyCode:n?.currency,raw:!0})]})]}),(0,a.jsxs)("div",{className:h.default["insurance-buttons-container"],children:[(0,a.jsx)(V.Button,{className:"min-w-[123px] flex-1",onClick:()=>t({insurance:!0}),variant:"default",children:r("blackjack_game_yes")},"insurance-yes"),(0,a.jsx)(V.Button,{className:"min-w-[123px] flex-1",onClick:()=>t({insurance:!1}),variant:"default",children:r("blackjack_game_no")},"insurance-no")]}),(0,a.jsxs)("div",{className:h.default.description,children:[(0,a.jsx)(J,{}),(0,a.jsx)("p",{children:r("blackjack_insurance_description")})]})]})}),[n?.betAmount,n?.currency,r,t]);return(0,a.jsxs)("div",{className:(0,b.cn)(h.default["blackjack-ui-container"],l&&h.default.mobile),children:[!!n?.insuranceOffered&&!s&&d,(0,a.jsx)("div",{className:h.default["action-buttons-container"],children:["double","hit","stand","split"].map(e=>{let l;return l=({double:X,hit:z,split:Z,stand:ee})[e],(0,a.jsxs)("button",{className:(0,b.cn)(h.default["action-button"],h.default[e],i?.[e]&&!s&&h.default.active),onClick:()=>t({[e]:!0}),onKeyDown:e=>{e.preventDefault()},children:[(0,a.jsx)("div",{className:h.default["action-icon"],children:(0,a.jsx)(l,{})}),r(`blackjack_${e}`)]},e)})})]})};var et=e.i(747280),el=e.i(384807),es=e.i(171416),en=e.i(421136),er=e.i(373268),ei=e.i(802772),ed=e.i(272313),eo=e.i(888428),ec=e.i(832910),eu=e.i(662590),ep=e.i(282780),eh=e.i(217280);let ef={selectedChipAmount:null,selectedTarget:null},em=(0,R.atom)(ef);function eb(){let e=(0,j.useAtomValue)(em),a=(0,j.useSetAtom)(em),t=(0,u.useCallback)(e=>{a(a=>({...a,selectedChipAmount:e}))},[a]),l=(0,u.useCallback)(e=>{a(a=>({selectedChipAmount:a.selectedChipAmount===e?null:e,selectedTarget:a.selectedChipAmount===e?null:a.selectedTarget}))},[a]),s=(0,u.useCallback)(e=>{a(a=>({...a,selectedTarget:e}))},[a]),n=(0,u.useCallback)(()=>{a(ef)},[a]);return(0,eh.useResetChipsOnCurrencyChange)({onReset:n}),{chipMode:e,chipModeAtom:em,clearChipMode:n,isChipModeActive:null!==e.selectedChipAmount,selectedChipAmount:e.selectedChipAmount,selectedTarget:e.selectedTarget,setChipModeTarget:s,setSelectedChipAmount:t,toggleSelectedChipAmount:l}}function ey(e){let{disabled:a=!1,maxAmount:t,selectedChipAmount:l,setBetAmount:s,setChipModeTarget:n,target:r}=e;return(0,u.useCallback)(()=>{a||(n(r),null!==l&&s(e=>{let a=(0,q.sBig)(e||0),s=a.plus((0,q.sBig)(l));if("number"!=typeof t||!Number.isFinite(t))return s.toNumber();let n=(0,q.sBig)(t);return a.gte(n)?a.toNumber():s.gt(n)?n.toNumber():s.toNumber()}))},[a,t,l,s,n,r])}let eg={"21_plus_3":M,perfect_pair:K};function ek(e){let[a,t]=(0,j.useAtom)(eg[e]),l=(0,u.useCallback)(e=>{t(a=>({...a,active:e}))},[t]),s=(0,u.useCallback)(()=>{t(e=>({...e,active:!e.active}))},[t]),n=(0,u.useCallback)(e=>{t(a=>({...a,betAmount:"function"==typeof e?e(a.betAmount):e}))},[t]),r=(0,u.useCallback)(e=>{t(a=>({...a,errors:e}))},[t]),i=(0,u.useCallback)(e=>{t(a=>({...a,result:e?{multiplier:e.multiplier??"0",payout:e.payout??"0",sub_type:e.sub_type??null,type:a.type}:null}))},[t]),d=(0,u.useCallback)(()=>{t(e=>({...e,result:null}))},[t]),o=(0,u.useCallback)(()=>{t({active:!1,activeGame:!1,betAmount:null,errors:{active:!1,text:""},result:null,type:e})},[t,e]);return{clearResults:d,resetBetAmountOnly:(0,u.useCallback)(()=>{t(e=>({...e,betAmount:null}))},[t]),resetSideBet:o,setActive:l,setBetAmount:n,setErrors:r,setResults:i,sideBetData:a,toggleActive:s}}let ev=e=>{if("number"==typeof e)return Number.isFinite(e)?e:0;if("string"==typeof e){let a=Number(e);return Number.isFinite(a)?a:0}return 0},eA={MAX_AMOUNT:8e3,MIN_AMOUNT:.1},eH=(0,u.memo)(function(e){let{betLimits:t,label:l,optionalCurrencyCode:s,resultCurrencyCode:n}=e,{rawBalance:r}=(0,ec.useWallet)(),{walletSetting:i}=(0,eo.useWalletSetting)(),{activeRate:d}=(0,ed.useActiveRate)(),{currencies:o}=(0,eu.useCurrencyRates)(),{isGcActive:c}=(0,D.useActiveBalanceType)(),u=(0,x.useTranslate)(),{isChipModeActive:p,selectedChipAmount:h,setChipModeTarget:f}=eb(),{resetBetAmountOnly:m,setActive:y,setBetAmount:g,setErrors:k,sideBetData:v}=ek(l),{active:H,activeGame:S,betAmount:C,errors:w,result:j,type:P}=v,_=s||i,R=o?.[_]?.display?.decimals??d?.display?.decimals??2,N=Number(r??0),B=(0,T.resolveLimitsForKey)(t?.[_]||t?.[i],"side-bet")||eA,I=(0,T.normalizeBetLimit)(B,{isGcActive:c})??B,O=ey({disabled:S,maxAmount:I.MAX_AMOUNT,selectedChipAmount:h,setBetAmount:g,setChipModeTarget:f,target:P}),E=L[P],K=ev(C),M=ev(I.MIN_AMOUNT),F=!!j,U=F&&j?.sub_type===null,W=!S&&K>0,G=j?.payout?Number(j?.payout):0;return(0,a.jsxs)("div",{className:(0,b.cn)(ei.default["side-bet-container"],{[ei.default["active-chip-mode"]]:p,[ei.default["side-bet-container-active"]]:H,[ei.default["side-bet-container-locked"]]:S,[ei.default["side-bet-container-result-state"]]:F,[ei.default["side-bet-container-result-state-lost"]]:U,[ei.default["side-bet-container-result-state-win"]]:j?.sub_type}),children:[(0,a.jsx)("span",{className:ei.default["side-bet-label"],children:u(l)}),(0,a.jsxs)("div",{className:ei.default["side-bet-icon-background-container"],onClick:e=>{e.stopPropagation(),e.preventDefault(),S||(p||y(!H),O())},onKeyDown:e=>{e.preventDefault(),e.stopPropagation()},role:"button",children:[j?.sub_type&&(0,a.jsxs)("div",{className:ei.default["win-state-overlay-container"],children:[(0,a.jsxs)("span",{className:ei.default["win-multiplier"],children:[j?.multiplier,"x"]}),(0,a.jsx)("span",{className:(0,b.cn)(ei.default["win-amount"],{[ei.default["win-amount-small"]]:G>999}),children:(0,a.jsx)($.ValueDisplay,{amount:G,currencyCode:n,raw:!0})})]}),(0,a.jsx)("div",{className:ei.default["side-bet-icon-background"],children:(0,a.jsx)(er.default,{className:ei.default["side-bet-icon"]})}),(0,a.jsx)(en.default,{chipAmount:K,chipMinThreshold:M,showToggle:!1})]}),(0,a.jsx)("div",{className:ei.default["win-description-container"],children:j?.sub_type&&(0,a.jsx)("span",{className:ei.default["win-description"],children:A[j.sub_type]})}),(0,a.jsx)("div",{className:ei.default["side-bet-input-wrapper"],children:(0,a.jsx)("div",{className:ei.default["side-bet-input-content"],children:(0,a.jsxs)("div",{className:ei.default["side-bet-inner-wrapper"],children:[(0,a.jsx)("button",{className:(0,b.cn)(ei.default["side-bet-inline-button"],ei.default["side-bet-inline-button-half"]),onClick:e=>{e.stopPropagation(),e.preventDefault(),(0,ep.handleHalfBet)(g,R)},onKeyDown:e=>{e.preventDefault(),e.stopPropagation()},children:(0,a.jsx)(et.default,{className:ei.default["half-icon"]})}),(0,a.jsx)(es.default,{betAmount:C,betLimits:B,currencyCodePlaceholder:!0,inputError:w,isUiDisabled:!H,label:E,optionalCurrencyCode:s,setBetAmount:e=>g(e),setInputError:k}),(0,a.jsx)("button",{className:(0,b.cn)(ei.default["side-bet-inline-button"],ei.default["side-bet-inline-button-double"]),onClick:e=>{e.stopPropagation(),e.preventDefault(),K?(0,ep.handleDoubleBet)(g,I.MAX_AMOUNT,N,R):g(I.MIN_AMOUNT)},onKeyDown:e=>{e.preventDefault(),e.stopPropagation()},children:(0,a.jsx)(el.default,{})})]})})}),(0,a.jsx)(en.default,{isResetButtonActive:W,onReset:m,showResetButton:!0,showToggle:!1})]})});eH.displayName="BjSideBet";var eS=e.i(226261),eC=e.i(582300);let ew=e=>{if("number"==typeof e)return Number.isFinite(e)?e:0;if("string"==typeof e){let a=Number(e);return Number.isFinite(a)?a:0}return 0},eT={MAX_AMOUNT:8e3,MIN_AMOUNT:.1},eD=(0,u.memo)(function(e){let{betLimits:t,label:l,optionalCurrencyCode:s,resultCurrencyCode:n}=e,r=(0,x.useTranslate)(),{walletSetting:i}=(0,eo.useWalletSetting)(),{isGcActive:d}=(0,D.useActiveBalanceType)(),{selectedChipAmount:o,selectedTarget:c,setChipModeTarget:u}=eb(),{resetBetAmountOnly:p,setBetAmount:h,setErrors:f,sideBetData:m}=ek(l),{activeGame:y,betAmount:g,errors:k,result:v,type:H}=m,S=s||i,C=(0,T.resolveLimitsForKey)(t?.[S]||t?.[i],"side-bet")||eT,w=(0,T.normalizeBetLimit)(C,{isGcActive:d})??C,j=L[H],P=ew(g),_=!!v,R=_&&v?.sub_type===null,N=null!==o&&c===H,B=v?.payout?Number(v?.payout):0,I=!y&&P>0,O=ey({disabled:y,maxAmount:w.MAX_AMOUNT,selectedChipAmount:o,setBetAmount:h,setChipModeTarget:u,target:H});return(0,a.jsxs)("div",{className:(0,b.cn)(eC.default["side-bet-mobile-container"],{[eC.default["side-bet-mobile-container-locked"]]:y,[eC.default["side-bet-mobile-container-result-state"]]:_,[eC.default["side-bet-mobile-container-result-state-lost"]]:R,[eC.default["side-bet-mobile-container-result-state-win"]]:v?.sub_type}),children:[(0,a.jsxs)("div",{className:eC.default["side-bet-mobile-container-label-container"],children:[(0,a.jsx)("label",{className:eC.default["side-bet-label"],children:r(l)}),v?.sub_type&&(0,a.jsx)("span",{className:eC.default["win-description"],children:A[v.sub_type]})]}),(0,a.jsxs)("div",{className:(0,b.cn)(eC.default["side-bet-input-wrapper"],{[eC.default["side-bet-input-wrapper-chip-focus"]]:N}),children:[v?.sub_type&&(0,a.jsx)("div",{className:eC.default["win-display-container"],children:(0,a.jsxs)("div",{className:eC.default["win-display-content"],children:[(0,a.jsx)("span",{className:eC.default["win-amount"],children:(0,a.jsx)($.ValueDisplay,{amount:B,currencyCode:n,raw:!0})}),(0,a.jsx)("span",{className:eC.default["win-multiplier-divider"],children:"·"}),(0,a.jsxs)("span",{className:eC.default["win-multiplier"],children:[v?.multiplier,"x"]})]})}),(0,a.jsx)(eS.default,{betAmount:g,betLimits:t,hideInlineButtons:!!v?.sub_type,inputError:k,isUiDisabled:y,label:j,optionalBetLimitKey:"side-bet",optionalCurrencyCode:s,setBetAmount:e=>h(e),setInputError:f}),(0,a.jsx)(en.default,{chipAmount:P,chipMinThreshold:ew(w.MIN_AMOUNT),isResetButtonActive:I,onClick:O,onReset:p,selectedChipAmount:o,showResetButton:!0,variant:"side-bet-mobile"})]})]})});eD.displayName="BjSideBetMobile";var ej=e.i(242086),ex=e.i(122168),eP=e.i(254010),e_=e.i(38916),eR=e.i(486148);let eN=(0,ej.cdnAudioPath)("/originals/blackjack/chip.mp3"),eB=()=>{let e=(0,ex.default)(eN,{volume:.05}),{walletSetting:t}=(0,eo.useWalletSetting)(),{isGcActive:l}=(0,D.useActiveBalanceType)(),{selectedChipAmount:s,toggleSelectedChipAmount:n}=eb(),r=(0,j.useSetAtom)(K),i=(0,j.useSetAtom)(M),d=(0,e_.getCurrencyAdjustedChips)(t,{isGcActive:l});return(0,a.jsx)("div",{className:h.default["chip-display"],children:d.map((t,l)=>{let d=t.adjustedValue,o=d>999,c=(0,e_.formatChipValueLabel)(d);return(0,a.jsxs)("button",{onClick:()=>{e(),null===s&&d>0&&(r(e=>({...e,active:!0})),i(e=>({...e,active:!0}))),n(d)},className:(0,b.cn)(h.default["chip-button"],{[h.default["chip-button-white"]]:"white"===t.name,[h.default["chip-button-active"]]:s===d}),children:[(0,a.jsxs)("div",{className:h.default["chip-content-container"],children:[(0,a.jsx)("span",{className:o?h.default["chip-value-compact"]:"",children:c}),(0,a.jsx)("div",{className:h.default["chip-image-container"],children:(0,a.jsx)(eP.default,{"aria-label":`${t.value} chip`,chipName:t.name,role:"img"})})]}),(0,a.jsx)("div",{className:h.default["chip-highlight-container"],children:(0,a.jsx)(eR.default,{})})]},t.name+"-"+l)})})},eI=e=>{if("number"==typeof e)return Number.isFinite(e)?e:0;if("string"==typeof e){let a=Number(e);return Number.isFinite(a)?a:0}return 0},eO=(0,u.memo)(function(e){let{startNewGame:t,dispatchAction:l,publicGameState:s,isLoading:n,inGame:r,isMobile:i,setDemoMode:d,demoMode:o,setBetAmount:c,betAmount:p,lockActionButtons:f,walletSetting:m,resetGameBoard:y,resetSideBets:A,onFreeplayLoadRef:P}=e,_=(0,u.useRef)(!1),R=(0,g.default)("freePlayControls"),N=(0,j.useAtomValue)(v.freeplayContentAtom),B=(0,j.useAtomValue)(v.sideBetFooterToggleAtom),I=(0,j.useAtomValue)(E),O=(0,j.useAtomValue)(K),F=(0,j.useAtomValue)(M),U=!R?.displayed&&B,W=(0,j.useAtomValue)(v.betLimitsAtom),G=W&&Object.keys(W).length>0?W:S,{visualActiveFreeplay:L=null}=N||{},Q=!!O?.errors?.active||!!F?.errors?.active,V=(0,x.useTranslate)(),{selectedChipAmount:$,selectedTarget:q,setChipModeTarget:X}=eb(),[z,Y]=(0,u.useState)({text:!1,fixedValue:null}),{isGcActive:J}=(0,D.useActiveBalanceType)(),Z=(0,T.getNormalizedLimitsForKey)({isGcActive:J,limits:W?.[m],optionalBetLimitKey:H}),ee=ey({selectedChipAmount:$,target:"main",setChipModeTarget:X,setBetAmount:c,maxAmount:Z?.MAX_AMOUNT,disabled:f||r}),et=eI(p),el=eI(Z?.MIN_AMOUNT)||1,es=!f&&!r&&et>0,er=(0,a.jsxs)("div",{className:(0,b.cn)(h.default["bet-input-field-container"],null!==$&&"main"===q&&h.default["bet-input-field-container-chip-focus"],i&&h.default["mobile-display"]),children:[(0,a.jsx)(w.default,{labelDisplay:!1,setBetAmount:c,setDemoMode:d,betAmount:p,style:{marginBottom:"0px"},ignoreErrors:f||r,optionalBetLimitKey:H,setOutSideError:Y,outsideErrorMessage:!r&&I?.text}),(0,a.jsx)(en.default,{selectedChipAmount:$,onClick:ee,variant:"main-bet",chipAmount:p,chipMinThreshold:el,showResetButton:!0,isResetButtonActive:es,onReset:()=>c(null)})]}),ei=(0,a.jsx)(ea,{dispatchAction:l,publicGameState:s,isLoading:n,lockActionButtons:f,isMobile:i});(0,u.useEffect)(()=>(R?.displayed?(c(null),d({text:!1,active:!1}),A(),_.current=!0,P.current||y(!0),P.current=!1):_.current&&(y(!0),_.current=!1),()=>{}),[R?.displayed,A]);let ed=(0,a.jsx)("div",{className:(0,b.cn)(h.default["bet-btn-container"],(f||r)&&h.default["locked-btn"]),children:(0,a.jsx)(C.default,{placeBet:t,deActive:r||f||z?.text||I?.active||Q||R?.displayed&&!L||R?.displayed&&L&&L?.currency!==m,freeplay:R?.displayed,popupPosition:"top",text:R?.displayed?V("use_freeplay"):!n&&V(o?.text?"place_demo_bet":"place_bet"),style:{padding:"13px",height:"40px"}})}),eo="string"==typeof s?.currency?s.currency:void 0,ec=(0,a.jsx)(eH,{label:"perfect_pair",betLimits:G,optionalCurrencyCode:m,resultCurrencyCode:eo}),eu=(0,a.jsx)(eH,{label:"21_plus_3",betLimits:G,optionalCurrencyCode:m,resultCurrencyCode:eo}),ep="mobile-one"!==i&&"mobile-two"!==i;return(0,a.jsxs)("div",{className:(0,b.cn)(h.default["bet-bar-content"],h.default[i],!ep&&h.default["active-desktop-side-bets"],"mobile-two"!==i&&"mobile-three"!==i&&"mobile-four"!==i&&R?.displayed&&h.default["blackjack-free-play-container"]),children:[ed,(0,a.jsxs)("div",{className:h.default["side-bets-row"],children:[U&&ep&&ec,(0,a.jsxs)("div",{className:h.default["bet-bar-inner-container"],children:[ei,(0,a.jsx)("div",{className:(0,b.cn)(h.default["bet-input-container"],r&&h.default["in-game"],f&&h.default["in-game"]),children:R?.displayed?(0,a.jsx)(k.FreePlayDropDownSelect,{oldIsMobile:i,type:"blackjack"}):(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(eB,{}),er]})}),U&&!ep&&(0,a.jsxs)("div",{className:(0,b.cn)(h.default["mobile-side-bets-container"],("mobile-four"===i||"mobile-three"===i)&&h.default["vertical-side-bets"]),children:[(0,a.jsx)(eD,{label:"perfect_pair",betLimits:G,optionalCurrencyCode:m,resultCurrencyCode:eo}),(0,a.jsx)(eD,{label:"21_plus_3",betLimits:G,optionalCurrencyCode:m,resultCurrencyCode:eo})]})]}),U&&ep&&eu]})]})});var eE=e.i(137892);let eK=()=>(0,a.jsx)(m.CdnSvg,{src:"/originals/blackjack/deck-slider.svg"});function eM(e){let{cardDeckRef:t,isMobile:l}=e,s=(0,u.useMemo)(()=>Array.from({length:4},(e,t)=>(0,a.jsx)(eE.default,{},t)),[]);return(0,a.jsxs)("div",{className:` ${h.default[l]} ${h.default["card-deck"]} `,id:"blackjack-card-deck",ref:t,children:[(0,a.jsx)("div",{className:h.default["inner-deck"],children:s}),(0,a.jsx)("div",{className:h.default["deck-slider"],children:(0,a.jsx)(eK,{})})]})}var eF=e.i(19042);let eU=()=>(0,a.jsx)(m.CdnSvg,{src:"/originals/blackjack/ribbon.svg"}),eW=()=>(0,a.jsx)(m.CdnSvg,{src:"/originals/blackjack/ribbon-bottom.svg"});function eG(e){let{isMobile:t,showLogo:l=!1}=e,s=(0,x.useTranslate)(),n=(0,g.default)("freePlayControls");return(0,a.jsxs)("div",{className:(0,b.cn)(h.default["middle-display"],h.default[t],t&&h.default["mobile-display"]),children:[(0,a.jsx)("div",{className:h.default["logo-content"],children:(0,a.jsx)(eF.RainbetLogo,{})}),(0,a.jsxs)("div",{className:h.default["default-content"],children:[(0,a.jsxs)("div",{className:h.default["ribbon-container"],children:[(0,a.jsx)("div",{className:h.default["ribbon-inner"],children:(0,a.jsx)("span",{children:s("blackjack_payout")})}),(0,a.jsx)(eU,{})]}),!n?.displayed&&(0,a.jsxs)("div",{className:h.default["ribbon-container"],children:[(0,a.jsx)("div",{className:h.default["ribbon-inner"],children:(0,a.jsx)("span",{children:s("blackjack_insurance_payout")})}),(0,a.jsx)(eW,{})]})]})]})}var eL=e.i(740614),eQ=e.i(77625);let eV="blackjack-side-bets-visible";function e$(){let[e,t]=(0,j.useAtom)(v.sideBetFooterToggleAtom),[l,s]=(0,j.useAtom)(K),[n,r]=(0,j.useAtom)(M),{clearChipMode:i}=eb(),d=(0,x.useTranslate)(),o=l.activeGame||n.activeGame;return(0,u.useEffect)(()=>{let e=eL.StorageService.getLocalStorageValue(eV);null==e?t(!0):t(!!e)},[t]),(0,a.jsxs)("div",{className:ei.default["side-bet-footer-toggle-container"],children:[(0,a.jsx)("span",{children:d("side_bets")}),(0,a.jsx)("div",{className:`${ei.default["side-bet-footer-toggle-control"]} ${o?ei.default["side-bet-footer-toggle-control-locked"]:""}`,children:(0,a.jsx)(eQ.Switch,{checked:e,disabled:o,onCheckedChange:()=>{o||t(e=>{let a=!e;return a||(i(),s(e=>e.result?e:{...e,active:!1,betAmount:null,errors:{active:!1,text:""}}),r(e=>e.result?e:{...e,active:!1,betAmount:null,errors:{active:!1,text:""}})),eL.StorageService.setLocalStorageValue(eV,a),a})}})})]})}var eq=e.i(4543);let eX=e=>{let a;return e?.result?.sub_type?{payout:Number.isFinite(a=Number(e.result.payout))?a:0,winName:A[e.result.sub_type]}:null};function ez(e){let{perfectPairSideBet:t,resultCurrencyCode:l,twentyOneSideBet:s}=e,n=eX(t),r=eX(s);return(0,a.jsxs)("div",{className:eq.default["side-bet-mobile-popup-container"],children:[(0,a.jsxs)("div",{className:(0,b.cn)(eq.default["side-bet-mobile-popup-item"],eq.default["perfect-pair-popup"]),id:"side-bet-perfect-pair-popup",children:[n?.winName&&(0,a.jsx)("span",{className:eq.default["side-bet-mobile-popup-win-name"],children:n.winName}),Number.isFinite(n?.payout)&&(0,a.jsx)("div",{className:eq.default["side-bet-mobile-popup-values"],children:(0,a.jsx)("span",{className:eq.default["side-bet-mobile-popup-amount"],children:(0,a.jsx)($.ValueDisplay,{amount:n.payout,currencyCode:l,raw:!0})})})]}),(0,a.jsxs)("div",{className:(0,b.cn)(eq.default["side-bet-mobile-popup-item"],eq.default["twenty-one-popup"]),id:"side-bet-twenty-one-popup",children:[r?.winName&&(0,a.jsx)("span",{className:eq.default["side-bet-mobile-popup-win-name"],children:r.winName}),Number.isFinite(r?.payout)&&(0,a.jsx)("div",{className:eq.default["side-bet-mobile-popup-values"],children:(0,a.jsx)("span",{className:eq.default["side-bet-mobile-popup-amount"],children:(0,a.jsx)($.ValueDisplay,{amount:r.payout,currencyCode:l,raw:!0})})})]})]})}var eY=e.i(496158),eJ=e.i(263088),eZ=e.i(466716),e0=e.i(571649),e1=e.i(58985),e2=e.i(168665),e8=e.i(581243);function e3(e){let{currentHandIndex:a,dealerHand:t,insuranceOffered:l,playerHands:s,results:n,status:r}=e,i={...t};i=t?.cards?t.isRevealed?{cards:t.cards.map(e=>(0,e8.cardCodeToObject)(e)),isRevealed:!0}:{cards:[(0,e8.cardCodeToObject)(t.cards[0]),(0,e8.cardCodeToObject)(!1)],isRevealed:!1}:{cards:!1,isRevealed:!1};let d=s.map(e=>({availableActions:e.availableActions,cards:e.cards.map(e=>(0,e8.cardCodeToObject)(e)),isBust:e?.isBust,isDoubled:e?.isDoubled,isStand:e?.isStand,result:e.result||null}));return{betAmount:e.betAmount,currency:e.currency,currentHandIndex:a,dealerHand:i,insuranceOffered:l,insuranceWon:e.insuranceWon,isSplit:e.isSplit,playerHands:d,results:n,status:r}}function e5(e){if(2!==e.length)return!1;let a=(0,e8.cardCodeToObject)(e[0]),t=(0,e8.cardCodeToObject)(e[1]);return a.value===t.value}function e9(e){let a=e.playerHands.findIndex((a,t)=>t>e.currentHandIndex&&!a.isStand&&!a.isBust);-1!==a?(e.currentHandIndex=a,e6(e)):e.playerHands.some(e=>!e.isBust)?(e.status="dealerTurn",e7(e)):(e.status="finished",e.dealerHand.isRevealed=!0)}function e7(e){e.dealerHand.isRevealed=!0;let a=(0,e8.calculateHandValue)(e.dealerHand.cards);for(;a<17;){let t=(0,e8.drawCard)(e.deck);e.dealerHand.cards.push(t),a=(0,e8.calculateHandValue)(e.dealerHand.cards)}e.playerHands.forEach(e=>{if(e.isBust)e.result="lose";else{let t=(0,e8.calculateHandValue)(e.cards);a>21||t>a?e.result="win":t<a?e.result="lose":e.result="push"}}),e.status="finished"}function e6(e){let a=e.playerHands[e.currentHandIndex];if(a.isBust||a.isStand||!1===a.isActive)return}var e4=e.i(384209);function ae(e){return(0,e4.shuffleDemoBlackjackDeck)()}let aa={...{basicSplit:{deck:["8h","2s","2s","Th","8h","3h"],description:`
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
`,key:"splitWithManySmallCards",title:"Split Low Cards with Multiple Hits"}},sideBet4sPerfectPair:{deck:["4s","9d","4s","7c","2h","Kc","5d","8h"]},sideBet4sPerfectPairDealerAceUpNoBj:{deck:["4s","Ad","4s","7c","2h","Kc","5d","8h"]},sideBet4sPerfectPairDealerBjWithInsurance:{deck:["4s","Ad","4s","Kc","2h","5d","8h","Qs"]},sideBet4sPerfectPairDealerBjWithoutInsurance:{deck:["4s","Kd","4s","Ad","2h","7c","5d","8h"]},sideBet7hSuitedTrips:{deck:["7h","7h","7h","2c","5d","9s","Kc","3d"]},sideBet9sThreeOfAKind:{deck:["9c","9d","9h","2s","5c","7d","Ks","4h"]},sideBet456Straight:{deck:["4s","5d","6c","9h","2c","Kd","8h","Qs"]},sideBet567HeartsStraightFlush:{deck:["5h","6h","7h","2c","9d","Ks","4c","8d"]},sideBetDiamondsFlush:{deck:["2d","9d","Kd","7c","3h","8s","5c","Qh"]},sideBetDiamondsFlushDealerAceUpNoBj:{deck:["2d","Ad","Kd","7c","3h","8s","5c","Qh"]},sideBetDiamondsFlushDealerBjWithInsurance:{deck:["2d","Ad","Kd","Td","3h","8s","5c","Qh"]},sideBetDiamondsFlushDealerBjWithoutInsurance:{deck:["2d","Td","Kd","Ad","3h","8s","5c","Qh"]},sideBetKingsColouredPair:{deck:["Kh","9s","Kd","7c","2h","5d","8c","Qs"]},sideBetKingsColouredPairDealerAceUpNoBj:{deck:["Kh","Ad","Kd","7c","2h","5d","8c","Qs"]},sideBetKingsColouredPairDealerBjWithInsurance:{deck:["Kh","Ad","Kd","Tc","2h","5s","8d","Qc"]},sideBetKingsColouredPairDealerBjWithoutInsurance:{deck:["Kh","Qs","Kd","As","2h","5d","8c","7s"]},sideBetQueensMixedPair:{deck:["Qc","9d","Qh","7s","2c","5d","8h","Ks"]},sideBetQueensMixedPairDealerBjWithInsurance:{deck:["Qc","Ad","Qh","Td","2c","5s","8h","Ks"]},sideBetQueensMixedPairDealerBjWithoutInsurance:{deck:["Qc","Jd","Qh","Ad","2c","5s","8h","Ks"]}},at={currentHandIndex:0,currentTurn:0,dealerHand:{cards:!1,isRevealed:!1},deck:[],insuranceOffered:!1,insuranceTaken:!1,insuranceWon:!1,isSplit:!1,playerHands:[{availableActions:{double:!1,hit:!1,split:!1,stand:!1},cards:[],handId:0,isActive:!1,isBust:!1,isDoubled:!1,isStand:!1,isWin:!1,result:null}],status:"notStarted"},al=function(){let e=!(arguments.length>0)||void 0===arguments[0]||arguments[0],a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,t=arguments.length>2&&void 0!==arguments[2]&&arguments[2],l=arguments.length>3&&void 0!==arguments[3]?arguments[3]:()=>{},s=arguments.length>4&&void 0!==arguments[4]?arguments[4]:()=>{},n=arguments.length>5&&void 0!==arguments[5]?arguments[5]:()=>null,r=arguments.length>6&&void 0!==arguments[6]?arguments[6]:()=>{},i=arguments.length>7&&void 0!==arguments[7]?arguments[7]:()=>{},d=arguments.length>8&&void 0!==arguments[8]?arguments[8]:()=>{},c=arguments.length>9&&void 0!==arguments[9]?arguments[9]:{game_action_id:null,game_history_id:null},p=arguments.length>10&&void 0!==arguments[10]?arguments[10]:()=>{},h=arguments.length>11&&void 0!==arguments[11]?arguments[11]:()=>{},f=arguments.length>12&&void 0!==arguments[12]?arguments[12]:()=>{},m=arguments.length>13&&void 0!==arguments[13]?arguments[13]:()=>{},b=arguments.length>14&&void 0!==arguments[14]?arguments[14]:()=>{},y=arguments.length>15&&void 0!==arguments[15]?arguments[15]:()=>{},g=arguments.length>16&&void 0!==arguments[16]?arguments[16]:()=>{},k=arguments.length>17&&void 0!==arguments[17]?arguments[17]:()=>{},v=(0,e1.default)("freePlayControls"),{displayed:A=null}=v?.value||{},H=(0,u.useRef)([]),[S,C]=(0,u.useState)(),[w,T]=(0,u.useState)({}),[D,j]=(0,u.useState)(!1),[x,P]=(0,u.useState)(!1),{balanceMutate:R,userBalanceType:N}=(0,ec.useWallet)(),{walletSetting:B}=(0,eo.useWalletSetting)(),{setDynamicBalanceActive:I,setUserActiveBalance:O}=(0,_.useDynamicBalance)(),E=(0,e0.default)(),K=(0,u.useRef)(null),{clearChipMode:M}=eb(),F=(0,u.useRef)(null),U=(0,u.useCallback)(()=>{F.current&&(f(F.current),F.current=null)},[f]),W=(0,u.useCallback)(()=>{e||(K.current||(E.beginSession(),K.current=E.acquireSessionLock()),I(!0),R())},[E,R,e,I]),G=()=>({...h?.()?.content?.activeFreeplay??null}),L=e=>{let{gameState:a,onLoad:t=!1}=e;T(a),r({gameState:a,onLoad:t}),a.game_history_id&&a.game_action_id&&(c.current={game_action_id:a.game_action_id,game_history_id:a.game_history_id})},Q=(0,u.useRef)(!1),V=(0,u.useRef)(!1),$=(0,u.useCallback)(async()=>{if(!Q.current)if(M(),Q.current=!0,l(),F.current=null,d(),y({enabled:!1}),e?.active&&!A){P(!0),j(!0),i(!0),C(at),V.current=!0,await new Promise(e=>setTimeout(e,100)),a?H.current=aa[a].deck.concat(ae()):H.current=ae();let e=[],t=[];e.push((0,e8.drawCard)(H.current)),t.push((0,e8.drawCard)(H.current)),e.push((0,e8.drawCard)(H.current)),t.push((0,e8.drawCard)(H.current));let l={availableActions:{double:!0,hit:!0,split:!1,stand:!0},cards:e,handId:0,isActive:!0,isBust:!1,isDoubled:!1,isStand:!1,isWin:!1},s={betAmount:0,currency:"USD",currentHandIndex:0,currentTurn:0,dealerHand:{cards:t,isRevealed:!1},deck:H.current,insuranceOffered:!1,insuranceTaken:!1,insuranceWon:!1,playerHands:[l],status:"playerTurn"},n=21===(0,e8.calculateHandValue)(e),r=21===(0,e8.calculateHandValue)(t);n?n&&!r?(l.result="win",s.dealerHand.isRevealed=!0,l.isWin=!0,s.status="finished"):n&&r&&(s.dealerHand.isRevealed=!0,s.status="finished",l.result="push",l.isActive=!1):(e5(e)&&(l.availableActions.split=!0),r&&10===(0,e8.cardCodeToObject)(t[0]).value&&(l.result="lose",s.status="finished",s.dealerHand.isRevealed=!0,l.availableActions={}),"A"===(0,e8.cardCodeToObject)(t[0]).rank&&(s.insuranceOffered=!0)),C(s),L({gameState:e3(s)}),"finished"===s.status&&P(!1),setTimeout(()=>{j(!1)},500),Q.current=!1}else try{K.current||(E.beginSession(),K.current=E.acquireSessionLock()),P(!0),j(!0),i(!0);let e="api/v1/original-games/blackjack/play",l=n(),r=Object.values(l||{}).reduce((e,a)=>(0,q.sBig)(e).plus((0,q.sBig)(a||0)).toNumber(),0),d=(0,q.sBig)(t||0).plus((0,q.sBig)(r)).toNumber(),c=(0,e2.resolveProcessingDelay)(e2.OriginalGameType.Blackjack,{instant:!!eL.StorageService.getLocalStorageValue("instantPlay")}),u={animation_duration_ms:c,balance_type:N,bet_amount:String(t),currency:B,...l?{side_bets:l}:{},...a?{test_deck_key:a}:{}};if(A){e="/api/v1/original-games/blackjack/freeplay";let t=G();F.current=t;let l=t?.freeplay_id;u={animation_duration_ms:c,freeplay_id:l,...a?{test_deck_key:a}:{}},y({enabled:!1}),p()}let h=await o.nodeApiClient.post(e,u,{baseURL:"https://originals.rainbet.com"});h?.data?.error?(I(!1),P(!1),(0,eY.createPopup)({code:h?.data?.error,type:eZ.POPUP_TYPES.ERROR}),A&&(y({enabled:!0}),U()),i(!1),j(!1),s(),K.current?.release?.(),K.current=null):(I(!0),O(e=>(0,q.sBig)(e).minus((0,q.sBig)(d)).toNumber()),h?.data?.gameState&&(h?.data?.gameState?.status!=="finished"&&R().then(()=>{I(!1)}),L({gameState:h?.data?.gameState})),j(!1),F.current=null,A&&(g(),k()),h?.data?.gameState?.status==="finished"&&(P(!1),E.endSession(),K.current?.release?.(),K.current=null,A&&m())),Q.current=!1}catch(e){K.current?.release?.(),K.current=null,j(!1),P(!1),i(!1),s(),Q.current=!1,(0,eY.createPopup)({code:e?.response?.data?.error||e?.message,type:eZ.POPUP_TYPES.ERROR}),A&&(y({enabled:!0}),U(),e?.response?.data?.error===eJ.ERROR_CODES.GAME.FREEPLAY_NO_RESULTS&&b(!0).catch(e=>{console.error("Error refreshing freeplays",e)}))}},[e,t,B,N,R,i,O,A,G,d,a,m,p,I,y,U,b,g,k,l,s,n,M]),X=(0,u.useRef)(!1);return{applyRestoredSessionBalanceLock:W,dispatchAction:(0,u.useCallback)(async a=>{if(!X.current)if(X.current=!0,V.current&&e?.active&&!A)if(function(e,a){let t=Object.keys(a)[0];if(console.log("action",t),e.insuranceOffered)if("insurance"===t)return!0;else return console.log("Invalid action, insurance must be accepted or declined first"),!1;let l=e.playerHands[e.currentHandIndex];return"finished"===e.status?(console.log("Game is finished, no actions are valid"),!1):l.availableActions&&l.availableActions.hasOwnProperty(t)&&!0===l.availableActions[t]}(S,a)){i(!0),j(!0);let e={...S};!function(e,a){var t,l,s,n;let r=Object.keys(a)[0];if(0===e.currentTurn&&e.insuranceOffered&&"insurance"===r){return t=e,l=a,t.insuranceOffered=!1,!0===l.insurance&&(t.insuranceTaken=!0),21===(0,e8.calculateHandValue)(t.dealerHand.cards)&&(t.dealerHand.isRevealed=!0,t.playerHands.forEach(e=>{e.result="lose",e.isActive=!1,e.availableActions={}}),t.status="finished",t.insuranceTaken&&(t.insuranceWon=!0)),t.currentTurn+=1}switch(console.log("actionName",r),r){case"split":return function(e){let a=e.playerHands[e.currentHandIndex];if(e5(a.cards)){e.isSplit=!0;let t=(0,e8.cardCodeToObject)(a.cards[0]),l=(0,e8.cardCodeToObject)(a.cards[1]),s="A"===t.rank&&"A"===l.rank,n={double:!0,hit:!0,split:!1,stand:!0},r={availableActions:{...n},cards:[a.cards[0]],handId:a.handId,isActive:!0,isBust:!1,isDoubled:!1,isStand:!1,result:null},i={availableActions:{...n},cards:[a.cards[1]],handId:e.playerHands.length,isActive:!1,isBust:!1,isDoubled:!1,isStand:!1,result:null};if(r.cards.push((0,e8.drawCard)(e.deck)),i.cards.push((0,e8.drawCard)(e.deck)),s){let a={double:!1,hit:!1,split:!1,stand:!1};r.isStand=!0,r.isActive=!1,r.availableActions=a,i.isStand=!0,i.isActive=!1,i.availableActions=a,e.playerHands[e.currentHandIndex]=r,e.playerHands.push(i),e7(e)}else e.playerHands[e.currentHandIndex]=r,e.playerHands.push(i),21===(0,e8.calculateHandValue)(e.playerHands[0].cards)&&(e.playerHands[0].availableActions={},e.playerHands[0].isStand=!0,e.currentHandIndex=1),console.log("split newHand2",i),21===(0,e8.calculateHandValue)(e.playerHands[1].cards)&&(e.playerHands[1].availableActions={},e.playerHands[1].isStand=!0),e.playerHands[1].isStand&&e.playerHands[0].isStand&&e9(e),console.log("Split Calc Hand One",(0,e8.calculateHandValue)(e.playerHands[0].cards)),console.log("Split Calc Hand Two",(0,e8.calculateHandValue)(e.playerHands[1].cards)),console.log("Split Calc Game State",e),console.log("Split Calc Game State After Advance",e);e.currentTurn+=1}else console.error("Split action is not valid at this time.")}(e);case"double":let i=e.playerHands[e.currentHandIndex];if(console.log("hand",i),2!==i.cards.length||i.isDoubled)console.error("Double action is not valid at this time.");else{i.isDoubled=!0;let a=(0,e8.drawCard)(e.deck);i.cards.push(a),(0,e8.calculateHandValue)(i.cards)>21&&(i.isBust=!0,i.result="lose"),i.isActive=!1,i.availableActions={},e9(e),e.currentTurn+=1}return;case"stand":let d;return(d=(s=e).playerHands[s.currentHandIndex]).isStand=!0,d.isActive=!1,d.availableActions={},e9(s),s.currentTurn+=1;case"hit":let o,c,u;return n=e,console.log("hit"),o=n.playerHands[n.currentHandIndex],c=(0,e8.drawCard)(n.deck),o.cards.push(c),(u=(0,e8.calculateHandValue)(o.cards))>21?(o.isBust=!0,o.isActive=!1,o.availableActions={},o.result="lose",e9(n)):21===u?(o.isActive=!1,o.availableActions={},e9(n)):(o.availableActions={double:!1,hit:!0,split:!1,stand:!0},e6(n)),n.currentTurn+=1;default:return}}(e,a),C({...e}),L({gameState:e3(e)}),setTimeout(()=>{j(!1),"finished"===e.status&&(P(!1),V.current=!1,y({enabled:!0}))},50),X.current=!1}else console.log(`Action "${a}" is not valid at this time.`),X.current=!1,V.current=!1;else{j(!0),i(!0);try{K.current||(E.beginSession(),K.current=E.acquireSessionLock());let e=Object.keys(a)[0],l=0;("double"===e||"split"===e)&&(l=t),"insurance"===e&&a?.[e]&&(l=(0,q.sBig)(t).times(.5).toNumber());let s=await o.nodeApiClient.post(`api/v1/original-games/blackjack/${c.current.game_history_id}/${c.current.game_action_id}/action`,{action_name:a,animation_duration_ms:(0,e2.resolveProcessingDelay)(e2.OriginalGameType.Blackjack,{instant:!!eL.StorageService.getLocalStorageValue("instantPlay")})},{baseURL:"https://originals.rainbet.com"});if(s?.data?.error)(0,eY.createPopup)({code:s?.data?.error,type:eZ.POPUP_TYPES.ERROR}),j(!1),i(!1),I(!1),O(e=>(0,q.sBig)(e).plus((0,q.sBig)(l)).toNumber()),X.current=!1,s?.data?.error===eJ.ERROR_CODES.GAME.NO_ACTIVE_GAME&&(console.log(eJ.ERROR_CODES.GAME.NO_ACTIVE_GAME),d(),L({gameState:at}),P(!1));else{I(!0),O(e=>(0,q.sBig)(e).minus((0,q.sBig)(l)).toNumber()),L({gameState:s?.data?.gameState}),s?.data?.gameState?.used_freeplay_id&&s?.data?.gameState?.is_freeplay===!0&&p({freeplayId:s?.data?.gameState?.used_freeplay_id}),s?.data?.gameState?.status==="finished"&&(P(!1),E.endSession(),K.current?.release?.(),K.current=null,A&&m()),j(!1);let a="double"===e||"split"===e||"insurance"===e;a&&s?.data?.gameState?.status!=="finished"&&(console.log("debug Mutating Balance"),R().then(()=>{I(!1)})),A&&a&&(g(),k()),X.current=!1}console.log("Response",s)}catch(e){i(!1),X.current=!1,(0,eY.createPopup)({code:e?.response?.data?.error||eJ.ERROR_CODES.GENERAL.NETWORK,type:eZ.POPUP_TYPES.ERROR}),console.error("Error starting game",e)}}},[e,S,R,i,t,O,A,c,d,f,I,y,m,p,g,k]),inGame:x,isLoading:D,publicGameState:w,setInGame:P,setIsLoading:j,setPublicGameState:L,startNewGame:$,tempInDemoMode:V,walletSetting:B}};var as=e.i(411291);function an(e){let a=[];try{let t=e?.handRef?.current;if(!t||"u"<typeof document)return a;t.querySelectorAll('[data-bj="card"]').forEach(e=>{let t=e.getAttribute("data-card-key")||"",l=e.style&&e.style.transform||"",s=!1;if(l&&l.includes("translate")){let e=l.match(/translate3d\(([^)]+)\)/);if(e){let a=e[1].split(",").map(e=>e.trim()),t=a[0]||"0",l=a[1]||"0";s=!(t.startsWith("0")&&l.startsWith("0"))}else{let e=l.match(/translate\(([^)]+)\)/);if(e){let a=e[1].split(",").map(e=>e.trim()),t=a[0]||"0",l=a[1]||"0";s=!(t.startsWith("0")&&l.startsWith("0"))}}}a.push({hasInlineTranslate:s,key:t})})}catch(e){console.warn("parseCardKeysAndInlineTranslate error:",e)}return a}function ar(e,a){if(e.length!==a.length)return!1;for(let t=0;t<e.length;t++)if(e[t]!==a[t])return!1;return!0}var ai=e.i(94150);let ad=(0,c.default)(()=>e.A(173745),{loadableGenerated:{modules:[9496]}}),ao=(0,c.default)(()=>e.A(20777),{loadableGenerated:{modules:[640640]}});e.s(["default",0,function(){(0,t.default)();let[e,c]=(0,u.useState)(!1),[m,g]=(0,u.useState)({text:!1,active:!1}),[k,A]=(0,u.useState)(),{clearChipMode:H}=eb(),{cycleFreeplay:S,setActiveFreeplay:C,getFreeplayContentRef:w,addBackFreeplay:T,refreshFreeplays:D,onGameCompletedCycleFreeplay:R,mutateAllFreeplays:N,mutate:K}=(0,l.default)(),{isLoggedIn:M}=(0,d.useUser)(),F=(0,s.default)("freePlayControls"),L=(0,s.default)("freePlayButton"),V=(0,u.useRef)(!1),$=(0,i.useMobile)({}),X=(0,i.useMobile)({breakPointOne:950,breakPointTwo:768,breakPointThree:500,breakPointFour:400}),z=(0,u.useRef)(!1),Y="mobile-one"!==$&&"mobile-two"!==$,J=function(e,a){let t=(0,j.useAtomValue)(I),l=(0,j.useSetAtom)(I),s=(0,j.useSetAtom)(v.sideBetFooterToggleAtom),n=(0,j.useSetAtom)(E),{balance:r,balanceMutate:i,setDynamicBalanceActive:d}=(0,_.useDynamicBalance)(),o=(0,x.useTranslate)(),c=(0,u.useRef)(!1),p=(0,u.useRef)(0),h=(0,u.useRef)(!1),m=(0,u.useRef)(null),b=(0,u.useRef)(null),y=(0,u.useRef)(null),g=(0,u.useRef)(!1),{perfectPair:k,twentyOne:A}=t,H=(0,u.useCallback)(function(e,t){let l=arguments.length>2&&void 0!==arguments[2]&&arguments[2];if(a)return;let s=(0,P.getSideBetPopupDisplayDurationMs)(l),n=!!e?.sub_type,r=!!t?.sub_type;(n||r)&&(g.current||(b.current&&(b.current.kill(),b.current=null),y.current&&(cancelAnimationFrame(y.current),y.current=null),g.current=!0,y.current=requestAnimationFrame(()=>{let e=[],a=document.getElementById(Q),t=document.getElementById("side-bet-twenty-one-popup");if(n&&a instanceof HTMLDivElement&&e.push(a),r&&t instanceof HTMLDivElement&&e.push(t),0===e.length){g.current=!1,y.current=null;return}f.gsap.set(e,{clearProps:"x,autoAlpha"});let l=f.gsap.timeline({onComplete:()=>{f.gsap.set(e,{clearProps:"x,autoAlpha"}),g.current=!1,b.current=null}});b.current=l,y.current=null,l.to(e,{autoAlpha:1,duration:P.SIDE_BET_POPUP_TRANSITION_DURATION_MS/1e3,ease:"power2.out",x:"0%"}).to({},{duration:s/1e3}).to(e,{autoAlpha:1,duration:P.SIDE_BET_POPUP_TRANSITION_DURATION_MS/1e3,ease:"power2.in",x:(e,a)=>a.id===Q?"-101%":"101%"})})))},[a]);(0,u.useEffect)(()=>{let a=Number(e||0)>0,t=Number(k.betAmount||0)>0||Number(A.betAmount||0)>0;Number(e||0)+Number(k.betAmount||0)+Number(A.betAmount||0)>Number(r||0)?n({active:!0,text:o("insufficient_balance")}):!a&&t?n({active:!0,text:o("side_bets_require_main_bet")}):n(O)},[r,o,e,k.betAmount,n,A.betAmount]),(0,u.useEffect)(()=>()=>{y.current&&cancelAnimationFrame(y.current),b.current&&(b.current.kill(),b.current=null),m.current&&clearTimeout(m.current),n(O),l(B())},[n,l]);let S=(0,u.useCallback)(()=>{l(e=>({perfectPair:{...e.perfectPair,active:!1},twentyOne:{...e.twentyOne,active:!1}}))},[l]),C=(0,u.useCallback)((e,a)=>{l(t=>U(t,e,t=>({...t,result:a?{multiplier:a.multiplier??"0",payout:a.payout??"0",sub_type:a.sub_type??null,type:e}:null})))},[l]),w=(0,u.useCallback)(e=>{l(a=>U(a,e,e=>({...e,result:null})))},[l]),T=(0,u.useCallback)(e=>{let a=e?.side_bets_result??[],t=a.find(e=>"perfect_pair"===W(e.type)),n=a.find(e=>"21_plus_3"===W(e.type));a.length>0&&s(e=>e||!0),l(e=>({perfectPair:{...e.perfectPair,active:!1,activeGame:!0,betAmount:t?t.amount:null,errors:{active:!1,text:""},result:null},twentyOne:{...e.twentyOne,active:!1,activeGame:!0,betAmount:n?n.amount:null,errors:{active:!1,text:""},result:null}})),c.current=!1,h.current=!1},[l,s]),D=(0,u.useCallback)(function(e){let a=arguments.length>1&&void 0!==arguments[1]&&arguments[1];if(p.current+=1,c.current)return;let t=e??[];t.length>0&&s(e=>e||!0);let n=t.find(e=>"perfect_pair"===W(e.type)),r=t.find(e=>"21_plus_3"===W(e.type)),o=n?G(n):null,u=r?G(r):null;l(e=>({perfectPair:{...e.perfectPair,active:!1,betAmount:n?n.amount:null,result:o},twentyOne:{...e.twentyOne,active:!1,betAmount:r?r.amount:null,result:u}})),H(o,u,a),c.current=!0;let f=t.some(e=>!!e?.sub_type);h.current=f,f&&(d(!0),i().finally(()=>{d(!1)}))},[l,s,i,d,H]),R=(0,u.useCallback)(()=>{m.current&&(clearTimeout(m.current),m.current=null),c.current=!1,p.current=0,h.current=!1,l(e=>({perfectPair:{...e.perfectPair,active:!1,activeGame:!0,errors:{active:!1,text:""},result:null},twentyOne:{...e.twentyOne,active:!1,activeGame:!0,errors:{active:!1,text:""},result:null}}))},[l]),N=(0,u.useCallback)(()=>{m.current&&(clearTimeout(m.current),m.current=null),c.current=!1,p.current=0,h.current=!1,l(e=>({perfectPair:{...e.perfectPair,active:!1,activeGame:!1},twentyOne:{...e.twentyOne,active:!1,activeGame:!1}}))},[l]),K=(0,u.useCallback)(function(){let e=arguments.length>0&&void 0!==arguments[0]&&arguments[0],a=p.current,t=h.current,s=()=>{l(e=>({perfectPair:{...e.perfectPair,active:e.perfectPair.errors.active,activeGame:!1,result:null},twentyOne:{...e.twentyOne,active:e.twentyOne.errors.active,activeGame:!1,result:null}})),m.current=null};if(m.current&&(clearTimeout(m.current),m.current=null),c.current=!1,p.current=0,h.current=!1,1===a&&t){m.current=setTimeout(s,e?1e3:2500);return}s()},[l]),M=(0,u.useCallback)(()=>{m.current&&(clearTimeout(m.current),m.current=null),c.current=!1,p.current=0,h.current=!1,l(B())},[l]);return{clearSideBetResult:w,getSideBetsForApi:(0,u.useCallback)(()=>[k,A].filter(e=>Number(e.betAmount||0)>0).map(e=>({amount:String(e.betAmount),type:e.type})),[k,A]),getSideBetsStartPayload:(0,u.useCallback)(()=>{let e={};return Number(k.betAmount||0)>0&&(e.perfect_pair=String(k.betAmount)),Number(A.betAmount||0)>0&&(e["21_plus_3"]=String(A.betAmount)),Object.keys(e).length>0?e:null},[k.betAmount,A.betAmount]),loadGameInitializer:T,onGameCompletedSidebet:K,onStartGameSideBets:R,onStartGameSideBetsFailed:N,perfectPairSideBet:k,resetSideBets:M,setAllSideBetsInactive:S,setSideBetResults:C,setSideBetsFromGameState:D,sideBetsState:t,twentyOneSideBet:A}}(k,Y),Z=(0,u.useRef)(),ee=(0,u.useRef)(),ea=(0,u.useRef)({game_history_id:null,game_action_id:null}),{dealerRef:et,playerHands:el,dealerHand:es,playerHandsRefs:en,setLockActionButtons:er,lockActionButtons:ei,setGameplayPublicGameState:ed,totalSideCards:eo,backgroundDisplayRef:ec,specialBlackjackDisplay:eu,cardAnimationTimline:ep,resetGameBoard:eh}=function(e){let a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:()=>{},t=arguments.length>2&&void 0!==arguments[2]?arguments[2]:()=>{},{balanceMutate:l,setDynamicBalanceActive:s}=(0,_.useDynamicBalance)(),n=(0,u.useRef)(!1),[r,i]=(0,u.useState)(null),[d,o]=(0,u.useState)([]),[c,p]=(0,u.useState)(null),[h,m]=(0,u.useState)(!1),[b,y]=(0,u.useState)(0),[g,k]=(0,u.useState)(!1),v=(0,u.useRef)(f.gsap.timeline({paused:!0})),A=(0,u.useRef)(null),H=(0,u.useRef)([(0,u.createRef)(),(0,u.createRef)()]),S=(0,u.useRef)(null),C=(0,u.useRef)(!1),w=(0,u.useRef)(!0),T=(0,u.useRef)(!1),D=(0,u.useRef)(!1),j=(0,u.useRef)(null),x=(0,u.useRef)(!1),P=(0,u.useRef)({0:{cards:[]},1:{cards:[]}}),R=(0,u.useRef)({cards:[]});(0,u.useEffect)(()=>()=>{v.current.kill(),(0,as.resetRenderGateState)()},[]);let N=(0,u.useRef)(null),B=(0,u.useRef)(null),I=async function(){let e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];x.current?console.log("Game already clearing"):(x.current=!0,N.current=new Promise(e=>{B.current=e}),v.current.clear(),k(!1),H.current.forEach(e=>{e.current?.hideResult()}),A.current?.hideResult(),!(e||n.current)&&function(){let{distance:e=100,duration:a=.2,stagger:t=.05}=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},l=v.current;l.clear();let s="clear-start";l.addLabel(s,0);let n=!1;try{let r=document.querySelectorAll("#dealer-hand-0 .blackjack-card");r.length>0&&(l.to(r,{duration:a,ease:"power2.inOut",opacity:0,stagger:t,y:`-=${e}px`},s),n=!0),document.querySelectorAll('[id^="player-hand-"]').forEach(r=>{let i=r.querySelectorAll(".blackjack-card");i.length>0&&(l.to(i,{duration:a,ease:"power2.inOut",opacity:0,stagger:t,y:`+=${e}px`},s),n=!0)})}catch(e){console.warn("scheduleClearAllCardsOnTimeline failed",e)}return n}({duration:.1})&&(await new Promise(e=>{v.current.eventCallback("onComplete",e),v.current.play(0)}),v.current.clear()),console.log("[blackjack] resetGameBoard"),w.current=!0,o([]),p(null),H.current=[(0,u.createRef)(),(0,u.createRef)()],S.current=null,T.current=!1,C.current=!1,P.current={0:{cards:[]},1:{cards:[]}},R.current={cards:[]},D.current=!1,y(0),i(null),await (0,as.clearHandRenderHistoryAwait)(),await G(10),console.log("[blackjack] cleared hand render history"),x.current=!1,B.current())},O=async()=>{x.current&&N.current&&(console.log("waitForGameClear"),await N.current)};async function E(e){let{gameState:a,onLoad:t=!1}=e;if(t||await O(),console.log("Cleared the waiting"),v.current.clear(),n.current=!!eL.StorageService.getLocalStorageValue("instantPlay"),i(a),!t&&(R.current?.cards?.length>0||P.current?.[0]?.cards?.length>0||P.current?.[1]?.cards?.length>0)&&function(e){let{dealerCardsRef:a,gameState:t,playersCardsRefs:l}=e;try{let e=t?.dealerHand||{cards:[]},s=t?.playerHands||[],n=a?.current?.cards||[],r=l?.current?.[0]?.cards||[];if(n.length>0&&(e.cards?.length||0)>0){let a=n[0]?.code||"",t=e.cards?.[0]?.code||"";if(a&&t&&a!==t)return console.warn("[diff card] PreSanity dealer first code mismatch",{newCode:t,oldCode:a}),!0}if(1===s.length){let e=s[0]?.cards||[];if(e.length>2&&r.length>=2){let a=e[0]?.code||"",t=e[1]?.code||"",l=r[0]?.code||"",s=r[1]?.code||"";if(a!==l||t!==s)return console.warn("[diff card] PreSanity player first two mismatch (single-hand)",{prev:[l,s],server:[a,t]}),!0}}if(s.length>1)for(let e=0;e<s.length;e++){let a=s[e]?.cards||[],t=l?.current?.[e]?.cards||[];if(a.length>2&&t.length>=2){let l=a[0]?.code||"",s=a[1]?.code||"",n=t[0]?.code||"",r=t[1]?.code||"";if(l!==n||s!==r)return console.warn("[diff card] PreSanity player first two mismatch (split)",{handIndex:e,prev:[n,r],server:[l,s]}),!0}}}catch(e){console.warn("[diff card] PreSanity check error",e)}return!1}({dealerCardsRef:R,gameState:a,playersCardsRefs:P}))return void await M(a);if(!D.current&&(D.current=!0,1)){let e;if((1!==(e=a?.playerHands||[]).length||2!==(e[0]?.cards||[]).length)&&!t){console.log("Not truly brand new game"),await M(a);return}console.log("Brand New Game");let l=a?.playerHands?.length||0,s=(0,as.beginHandRenderGate)(l,!0);console.log("[blackjack] Brand New Game",a?.playerHands),o(a?.playerHands),p(a?.dealerHand),await s.wait()}if(a?.isSplit&&!C.current){C.current=!0;let e=(0,as.beginHandRenderGate)(2);o(a?.playerHands),await e.wait(),console.log("gameplay: rendering Gate sync for split hand"),F(a,t)}else{let{dealerNewCards:e,playerUpdates:l,shouldForceResultsDisplay:s}=U(a);if(s)return void await M(a);W(l,e,a,t)}}async function K(e){try{if(!e)return;let a=e?.playerHands?.length||0,t=(0,as.beginHandRenderGate)(a,!0);o(e?.playerHands),p(e?.dealerHand),await t.wait(),A.current?.addCardsInstantlyReset&&await A.current.addCardsInstantlyReset([...e?.dealerHand?.cards||[]]);let l=e?.playerHands||[];l.forEach(async(e,a)=>{let t=H.current?.[a]?.current;t?.addCardsInstantlyReset&&await t.addCardsInstantlyReset([...e?.cards||[]])}),P.current={0:{cards:l[0]?.cards||[]},1:{cards:l[1]?.cards||[]}},R.current={cards:e?.dealerHand?.cards||[]};let s=0;l.forEach(e=>{s+=(e?.cards||[]).length}),y(s)}catch(e){console.warn("resyncDisplayInstant error",e)}}async function M(r){try{n.current&&await G(100),function(e){let{dealerRef:a,gameState:t,playerHandsRefs:l}=e;if("u"<typeof document||!t)return;let s=[],n=an(a?.current),r=n.map(e=>e.key),i=function(e){let a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,t=!!e?.isRevealed;return(e?.cards||[]).map((e,l)=>{let s=(t||1!==l)&&e?.code||"facedown";return`${a}-${l}-${s}`})}(t.dealerHand,0);if(!ar(r,i)){let e={displayed:r,expected:i};console.warn("[Sanity] Dealer mismatch",e),s.push({detail:e,scope:"dealer"})}let d=n.filter(e=>e.hasInlineTranslate);if(d.length>0){let e={offPosition:d};console.warn("[Sanity] Dealer off-position",e),s.push({detail:e,scope:"dealer-position"})}if((t.playerHands||[]).forEach((e,a)=>{let t=an(l?.current?.[a]?.current),n=t.map(e=>e.key),r=(e?.cards||[]).map((e,t)=>{let l=e?.code||"facedown";return`${a}-${t}-${l}`});if(!ar(n,r)){let e={displayed:n,expected:r};console.warn(`[Sanity] Player hand ${a} mismatch`,e),s.push({detail:e,scope:`player-${a}`})}let i=t.filter(e=>e.hasInlineTranslate);if(i.length>0){let e={offPosition:i};console.warn(`[Sanity] Player hand ${a} off-position`,e),s.push({detail:e,scope:`player-${a}-position`})}}),s.length>0)throw Error("BlackjackSanityCheckFailed")}({dealerRef:A,gameState:r,playerHandsRefs:H})}catch(e){console.warn("Sanity check failed (setResultsDisplay), resetting:",e),K(r)}if(a(r?.side_bets_result||[],n.current),"finished"===r.status){j.current?.playAnimation();let a=250*!n.current,i=!1,d=!1;2!==r.playerHands[0].cards.length||2!==r.dealerHand.cards.length||"push"===r.playerHands[0].result||r?.isSplit||(i=(0,ai.calculateHandTotals)(r.playerHands[0].cards)?.high===21,d=(0,ai.calculateHandTotals)(r.dealerHand.cards)?.high===21),setTimeout(()=>{var o,c;r.playerHands.forEach((e,a)=>{e.result&&(console.log("Result ref ",a,H.current[a]?.current,e.result),H.current[a]?.current?.setResultsDisplay(e.result,i))}),r.playerHands.forEach((e,a)=>{console.log("update hand check",e);let t=!1;e?.isStand&&e?.result==="win"&&(t="win"),e?.isStand&&e?.result==="push"&&(t="tie"),H.current[a]?.current&&t&&H.current[a]?.current?.setTotalMessageDisplay(t)}),o=r,c=d,console.log("debug push dealer",o.playerHands[0].result),"push"===o.playerHands[0].result?1===o.playerHands.length&&(A.current?.setResultsDisplay("push"),A.current?.setTotalMessageDisplay("tie")):c&&A.current?.setResultsDisplay("blackjack",!0),i&&k(!0),setTimeout(()=>{m(!1),e({enabled:!0}),t(n.current),console.log("Trigger unlock delay",a)},200),l().then(()=>{s(!1)})},a)}else m(!1)}async function F(e){let a=arguments.length>1&&void 0!==arguments[1]&&arguments[1],t=H.current[0]?.current,l=H.current[1]?.current;if(a&&n.current||t.removeCardAtIndex(1),t=H.current[0]?.current,l=H.current[1]?.current,n.current||a)await t.addCardsInstantlyReset([...e.playerHands[0].cards]),await l.addCardsInstantlyReset([...e.playerHands[1].cards]);else{let a=e.playerHands[0].cards[1],s=e.playerHands[1]?.cards;l.setupSplitHandInstantly(s[0]);let n="split-0",r="split-1";v.current.addLabel(n,0),v.current.addLabel(r,.25),await t.drawCard({newCard:a,newCardIndex:1,position:n}),await l.drawCard({newCard:s[1],newCardIndex:1,position:r}),await new Promise(e=>{v.current.eventCallback("onComplete",e),v.current.play()}),v.current.clear()}P.current[0].cards=e.playerHands[0].cards,P.current[1].cards=e.playerHands[1].cards;let{dealerNewCards:s,playerUpdates:r,shouldForceResultsDisplay:i}=U(e);(console.log("gameplay: deal new cards",s,r),console.log("gameplay: gameState",e),i)?await M(e):W(r,s,e,a)}function U(e){let a,t,{shouldForceResultsDisplay:l,updates:s}=(a=[],t=!1,(e.playerHands||[]).forEach((e,l)=>{let s=P.current[l].cards||[],n=s.length;for(let a=0;a<n;a++){let n=s[a]?.code||"",r=e.cards?.[a]?.code||"";if(n!==r){console.warn("[diff card] Code mismatch",{handIndex:l,idx:a,newCode:r,oldCode:n}),t=!0;break}}if(!t){if((e.cards?.length||0)>n){let s=e.cards.slice(n);n>=2&&s.length>1&&(console.warn("[diff card] Multiple new cards for single hand",{addedCount:s.length,handIndex:l,oldCount:n}),t=!0),a.push({handIndex:l,newCards:s,oldCount:n})}P.current[l].cards=e.cards||[]}}),t||console.log("[diff card] Synced player trackers",{hand0Count:(P.current?.[0]?.cards||[]).length,hand1Count:(P.current?.[1]?.cards||[]).length}),{shouldForceResultsDisplay:t,updates:a}),{newCards:n,shouldForceResultsDisplay:r}=function(e){let a=e.dealerHand||{cards:[],isRevealed:!1},t=R.current.cards||[],l=!1,s=t.length,n=a.cards?.length||0,r=Math.min(s,n);for(let e=0;e<r;e++){let s=t[e]?.code||"",n=a.cards?.[e]?.code||"";if(s!==n){if(""===s&&""!==n){console.log("[diff card] Ignoring dealer flip code change",{idx:e,newCode:n,oldCode:s});continue}console.warn("[diff card] Dealer code mismatch (not a flip)",{idx:e,newCode:n,oldCode:s}),l=!0;break}}let i=[];return n>s&&(i=a.cards.slice(s)),R.current.cards=a.cards||[],l||console.log("[diff card] Synced dealer tracker",{dealerCount:R.current.cards.length}),{newCards:i,shouldForceResultsDisplay:l}}(e),i=!!(l||r);return console.log("[diff card] Summary",{dealerNewCardsCount:n.length,playerUpdatesCount:s.length,shouldForceResultsDisplay:i}),{dealerNewCards:n,playerUpdates:s,shouldForceResultsDisplay:i}}async function W(e,a,t,l){let s=e.flatMap(e=>e.newCards.map(a=>({card:a,handIndex:e.handIndex,isDealer:!1}))),r=a.map(e=>({card:e,isDealer:!0})),i=[...s,...r];"finished"!==t.status||l||(T.current=!0,i=[...s,{isDealerFlip:!0},...r]),l&&(w.current=!1),w.current&&!l&&(w.current=!1,console.log("Initial Deal",i),i=[s[0],r[0],s[1],r[1]],"finished"===t.status&&(i=[...i,{isDealerFlip:!0}])),t.playerHands.forEach((e,a)=>{console.log("hand check",e);let t=!1;e?.isDoubled&&(t="double"),e?.isStand&&(t="stand"),H.current[a]?.current&&t&&H.current[a]?.current?.setTotalMessageDisplay(t)});let d=0;if(t.playerHands.forEach(e=>{d+=e.cards.length}),y(d),n.current||l){let e=[],a={};for(let t of i)t?.isDealer?e.push(t.card):(a[t?.handIndex]||(a[t?.handIndex]=[]),a[t?.handIndex].push(t.card));for(let[t,l]of(e.length>0&&await A.current?.addCardsInstantly(e),Object.entries(a)))await H.current[t]?.current?.addCardsInstantly(l);"finished"===t.status&&await A.current?.flipDealerCardInstant(t.dealerHand.cards[1]),M(t)}else{let e=0,a=0;for(let l of i){let s=`deal-${a}`;if(v.current.addLabel(s,e),l?.isDealer)await A.current?.drawCard({newCard:l.card,position:s});else if(l?.isDealerFlip){let e=`${s}`;i.length>1&&(e=`${e}+=0.25`),A.current?.flipDealerCard(t.dealerHand.cards[1],!1,e)}else await H.current[l?.handIndex]?.current?.drawCard({newCard:l?.card,position:s});a+=1,e+=.25}console.log("Deal Actions",i),i.length>0&&(await new Promise(e=>{v.current.eventCallback("onComplete",e),v.current.play()}),v.current.clear()),console.log("gameplay: setResultsDisplay"),M(t)}}function G(e){return new Promise(a=>setTimeout(a,e))}return{backgroundDisplayRef:j,cardAnimationTimline:v,dealerHand:c,dealerRef:A,localGameState:r,lockActionButtons:h,playerHands:d,playerHands:d,playerHandsRefs:H,playerHandTwo:S,resetGameBoard:I,setGameplayPublicGameState:E,setLockActionButtons:m,specialBlackjackDisplay:g,totalSideCards:b}}(L,J.setSideBetsFromGameState,J.onGameCompletedSidebet),{applyRestoredSessionBalanceLock:ef,startNewGame:em,dispatchAction:ey,publicGameState:eg,isLoading:ek,inGame:ev,setInGame:eA,setPublicGameState:eH,tempInDemoMode:eS,walletSetting:eC}=al(m,e,k,J.onStartGameSideBets,J.onStartGameSideBetsFailed,J.getSideBetsStartPayload,ed,er,eh,ea,S,w,T,R,D,L,N,K),[ew,eT]=(0,u.useState)(!1);return(0,u.useEffect)(()=>{M&&e();async function e(){try{let a=await o.nodeApiClient.get("/api/v1/original-games/blackjack/active-session",{baseURL:"https://originals.rainbet.com"});if(a?.data?.gameState){var e;let t,l,s,n,r,i;J.loadGameInitializer(a.data.gameState);let d=(e=a.data.gameState,t=(0,q.sBig)(e?.betAmount||0),s=(l=Array.isArray(e?.playerHands)?e.playerHands:[]).length>0?l.length:1,n=l.reduce((e,a)=>e+ +!!a?.isDoubled,0),r=.5*!!e?.insuranceTaken,(i=(0,q.sBig)(s).plus(n).plus(r)).eq(0)?0:Number(t.div(i)));if(A(d),eA(!0),eH({gameState:a.data.gameState,onLoad:!0}),g({text:!1,active:!1}),eS.current=!1,ea.current={game_history_id:a.data.gameState.game_history_id,game_action_id:a.data.gameState.game_action_id},"finished"!==a.data.gameState.status&&ef(),L({enabled:!1}),a?.data?.gameState?.is_freeplay){V.current=!0;let e={freeplay_id:null,value:d,currency:a?.data?.gameState?.currency};F({displayed:!0,enabled:!1}),C({freeplayKey:null,load:e}),z.current=!0}}}catch(e){console.log("Error checking active games",e)}}},[M]),(0,u.useEffect)(()=>()=>{H()},[H]),(0,a.jsx)(a.Fragment,{children:(0,a.jsx)(n.default,{isMobile:X,isBlackjack:!0,blackjackFooterToggle:(0,a.jsx)(e$,{}),children:(0,a.jsx)("div",{className:(0,b.cn)(h.default["blackjack-game-container"],h.default[$]),children:(0,a.jsxs)("div",{className:h.default["blackjack-game-display"],ref:Z,children:[(0,a.jsx)(r.GameFrameHeader,{maxPayout:2e5,instructionsKey:"blackjack_instructions"}),(0,a.jsxs)("div",{id:"blackjack-game-display",className:` ${h.default["blackjack-game-display-inner"]} ${p.default?.variable}`,children:[!Y&&(0,a.jsx)(ez,{perfectPairSideBet:J.perfectPairSideBet,twentyOneSideBet:J.twentyOneSideBet,resultCurrencyCode:"string"==typeof eg?.currency?eg.currency:eC}),(0,a.jsx)(y,{isMobile:X,ref:ec,specialBlackjackDisplay:eu}),(0,a.jsx)(eM,{cardDeckRef:ee,isMobile:X}),(0,a.jsx)(ao,{publicGameState:eg,gameDisplayRef:Z,cardDeckRef:ee,isMobile:X,instantPlay:ew,dealerRef:et,dealerHand:es,cardAnimationTimline:ep}),(0,a.jsx)(eG,{isMobile:X,showLogo:eu}),(0,a.jsx)(ad,{publicGameState:eg,isMobile:X,gameDisplayRef:Z,cardDeckRef:ee,instantPlay:ew,playerHandsRefs:en,playerHands:el,totalSideCards:eo,cardAnimationTimline:ep})]}),(0,a.jsx)(eO,{startNewGame:em,dispatchAction:ey,publicGameState:eg,testDeck:e,isLoading:ek,inGame:ev,demoMode:m,setDemoMode:g,betAmount:k,setBetAmount:A,lockActionButtons:ei,isMobile:$,walletSetting:eC,resetGameBoard:eh,resetSideBets:J.resetSideBets,onFreeplayLoadRef:z})]})})})})}],761619)},135352,function(e){e.n(e.i(761619))}]);

//# sourceMappingURL=17iih1fla7q10.js.map