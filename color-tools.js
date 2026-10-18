// Deterministic HSL classification and Base-color sort keys. No palette data is modified.
window.ATLAS_COLOR_TOOLS = (() => {
 const options=[['red','赤','#e53935'],['pink','ピンク','#f266a5'],['orange','オレンジ','#f28a20'],['yellow','黄','#f4d321'],['green','緑','#29934a'],['mint','ミント','#65cdb0'],['sky','水色','#58c6eb'],['blue','青','#2761d9'],['purple','紫','#9053c4'],['brown','茶','#885635'],['beige','ベージュ','#dbc49f'],['gold','ゴールド','#bc963d'],['white','白','#ffffff'],['gray','グレー','#969ba3'],['black','黒','#252a32']];
 function hsl(hex){const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255);const max=Math.max(...rgb),min=Math.min(...rgb),d=max-min,l=(max+min)/2;let h=0;if(d){h=max===rgb[0]?((rgb[1]-rgb[2])/d)%6:max===rgb[1]?(rgb[2]-rgb[0])/d+2:(rgb[0]-rgb[1])/d+4;h=(h*60+360)%360;}return {h,s:d?d/(1-Math.abs(2*l-1)):0,l,v:max};}
 function primary(hex){const {h,s,l,v}=hsl(hex);
  if(v<=.20)return 'black';
  if(l>=.965||(s<=.12&&l>=.92))return 'white';
  if(s<=.12)return 'gray';
  if(h>=15&&h<65&&l>=.70&&(s<=.65||l>=.85))return 'beige';
  if(h>=35&&h<60&&s>=.25&&s<=.85&&l>=.30&&l<.75)return 'gold';
  if(h>=10&&h<55&&l<.60&&v<.85)return 'brown';
  if((h>=330||h<15)&&l>=.68)return 'pink';
  if(h>=345||h<15)return 'red';
  if(h<42)return 'orange';
  if(h<70)return 'yellow';
  if(h>=135&&h<185&&l>=.55)return 'mint';
  if(h<185)return 'green';
  if(h<205)return 'sky';
  if(h<260)return l>=.72?'sky':'blue';
  if(h<300)return 'purple';
  return 'pink';
 }
 // Light blues remain searchable as blue; mint remains searchable as green.
 function families(hex){const key=primary(hex);return key==='sky'?[key,'blue']:key==='mint'?[key,'green']:[key];}
 function hueKey(hex){const {h,s,l,v}=hsl(hex);return v<=.20||l>=.965||(s<=.12)?360:h;}
 function luminance(hex){const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
 return {options,hsl,primary,families,hueKey,luminance};
})();
