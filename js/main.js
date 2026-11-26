loadAssets(()=>{go(Title);requestAnimationFrame(frame);});
// v0.42: version tag in the bottom-left corner of the title screen and all map screens (number lives in js/version.js).
(function(){const t=Title.draw,m=MapScene.draw;
 Title.draw=function(){t.apply(this,arguments);drawVersionTag();};
 MapScene.draw=function(){m.apply(this,arguments);drawVersionTag();};})();
