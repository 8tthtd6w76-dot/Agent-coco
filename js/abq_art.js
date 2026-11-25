// ===== Albuquerque art (v0.39): Michael's sheets, sliced by tools/slice_abq.py into assets/abq/ =====
// abqDraw(set,frame,x,bottomY,scale,flip,alpha,rot) draws one frame bottom-centred at (x,bottomY). It returns false when the
// sheet isn't loaded, so every caller keeps its code-drawn fallback.
// Frame maps (row-major):
//  ski_coco / ski_sisi 4x4: 0 straight, 1 right, 2 left, 3 sideways-left spray, 4 sideways-right spray, 5 tuck, 6 X-ski trick,
//    7 spin, 8 flip, 9 landing, 10 wipeout, 11 buried, 12 wave, 13 cheer, 14 snowball bonk, 15 shiver
//  ski_misc 4x4: 0-3 Lefty snowmobile, 4-7 Meatball snowboard, 8-11 angry snowball, 12 puff, 13 sparkle, 14 spray, 15 sled
//  ski_props 4x4: 0 small pine, 1 pine, 2 big pine, 3 snowy pine, 4 twin pines, 5 bare tree, 6 big rock, 7 small rock, 8 stump,
//    9 mound, 10 wood ramp, 11 snow ramp, 12 red gate, 13 blue gate, 14 lodge, 15 snowman
//  bal_kids 4x4: 0 idle, 1 burner, 2 lean left, 3 lean right, 4 P1 shoots, 5 P2 shoots, 6 aim up, 7 both fire, 8 brace, 9 dive,
//    10 fast dive, 11 spike hit, 12 bonked, 13 patched, 14 turbo, 15 celebrate
//  bal_foes 4x4: 0 Lefty, 1 Knuckles, 2 Meatball, 3 scout, 4 armored, 5 bomber, 6 gift, 7 Lefty throwing, 8 wobble, 9 deflating,
//    10 flat, 11 parachute, 12-14 water balloons
//  bal_boss 4x4: 0-3 cruise, 4 calm, 5 fist, 6 angry, 7 rage, 8 BB hit, 9 hurt, 10-11 patched, 12 big patch, 13 gust, 14 flat, 15 chute
//  abq_pickups 6x3: 0 coin, 1 coin edge, 2 coin stack, 3 bill, 4 blue gem, 5 purple gem, 6 heart, 7 half heart, 8 propane, 9 feather,
//    10 shield bubble, 11 double orb, 12 money bag, 13 birds, 14 nest, 15 storm cloud, 16 hawk, 17 drone
//  stooge_lefty / _meatball / _knuckles 4x5: 0-3 walk, 4-7 punch (6 = hit), 8 ouch, 9 reel, 10 dizzy, 11 stand, 12-13 fall,
//    14 flat, 15 flat dizzy, 16-19 parachute. All face RIGHT.
//  tram_props 6x3: 0 tram car, 1 cabin, 2 tower, 3 bull wheel, 4 rocks, 5 boulder, 6 big rock, 7 snowy pine, 8 dead pine, 9 shrub,
//    10 cactus, 11 bench, 12-13 benches, 14 crate, 15 barrel, 16 signpost
const ABQ_SETS=['ski_coco','ski_sisi','ski_misc','ski_props','bal_kids','bal_foes','bal_boss','abq_pickups','stooge_lefty','stooge_meatball','stooge_knuckles','tram_props',
 'tram_cliff','tram_ground_lower','tram_ground_bridge','tram_ground_overlook','tram_ground_upper'];
ABQ_SETS.forEach(n=>ASSET_LIST.push(['abq/'+n,'assets/abq/'+n+'.png']));
['sky_dawn','sky_day','sky_night','tram_backdrop','snow_tiles'].forEach(n=>ASSET_LIST.push(['abq/'+n,'assets/abq/'+n+'.jpg']));
function abqImg(n){return typeof IMG!=='undefined'?IMG['abq/'+n]:null;}
function abqDraw(set,f,x,by,s,flip,alpha,rot){const im=abqImg(set),A=typeof ABQ_ART!=='undefined'&&ABQ_ART[set];if(!im||!A||!A.f[f])return false;
 const [fx,fy,fw,fh]=A.f[f];if(!fw)return false;const w=fw*s,h=fh*s;ctx.save();if(alpha!=null&&alpha<1)ctx.globalAlpha*=alpha;ctx.translate(x,by);
 if(rot){ctx.translate(0,-h/2);ctx.rotate(rot);ctx.translate(0,h/2);}if(flip)ctx.scale(-1,1);ctx.drawImage(im,fx,fy,fw,fh,-w/2,-h,w,h);ctx.restore();return true;}
// a frame drawn centred (pickups, FX)
function abqDrawC(set,f,x,y,s,flip,alpha,rot){const A=typeof ABQ_ART!=='undefined'&&ABQ_ART[set];if(!A||!A.f[f])return false;return abqDraw(set,f,x,y+A.f[f][3]*s/2,s,flip,alpha,rot);}
// the three stooge looks (STOOGE_LOOK 0 Lefty, 1 Knuckles, 2 Meatball) -> their sheets
const ABQ_STOOGE=['stooge_lefty','stooge_knuckles','stooge_meatball'];
function abqHasStooges(){return !!abqImg('stooge_lefty');}
// a frame stretched into a box (top-left x,y, size w,h)
function abqDrawRect(set,f,x,y,w,h){const im=abqImg(set),A=typeof ABQ_ART!=='undefined'&&ABQ_ART[set];if(!im||!A||!A.f[f]||!A.f[f][2])return false;
 const [fx,fy,fw,fh]=A.f[f];ctx.drawImage(im,fx,fy,fw,fh,x,y,w,h);return true;}
