// ===== Game version (v0.49) =====
// The ONE place the build number lives. Bump GAME_VERSION for every new build zip;
// the title screen and every map screen (Valley Map, city maps, list view) read it from here.
const GAME_VERSION='v0.49';
function drawVersionTag(x=8,y=H-8,align='left'){ctx.save();ctx.globalAlpha=.85;text(GAME_VERSION,x,y,11,'#e8f4ff',align,'#000');ctx.restore();}
