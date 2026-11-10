#!/usr/bin/env node
/** Authored vector covers using the demos' real copy, brand colors and credited photographs. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const selected = process.argv.slice(2);
// Register the bundled Aura fonts for this render process without installing
// fonts or changing the user's system font configuration.
if (process.platform === 'linux' && (!selected.length || selected.includes('aura')) && process.env.NAMUNE_PREVIEW_FONTS !== 'ready') {
  const cache = join(root, 'scripts/.cache/preview-fonts');
  await mkdir(cache, { recursive: true });
  const xml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const config = join(cache, 'fonts.conf');
  await writeFile(config, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${xml(join(root, 'public/demos/aura/assets/fonts'))}</dir><cachedir>${xml(cache)}</cachedir></fontconfig>`);
  const child = spawnSync(process.execPath, process.argv.slice(1), { cwd: process.cwd(), env: { ...process.env, FONTCONFIG_FILE: config, NAMUNE_PREVIEW_FONTS: 'ready' }, stdio: 'inherit' });
  if (child.error) throw child.error;
  process.exit(child.status ?? 1);
}
const built = await build({ entryPoints: [join(root, 'src/data/projects.ts')], bundle: true, write: false, format: 'esm' });
const { projects } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
let textFont = 'Vazirmatn, Noto Sans Arabic, sans-serif';
const text = (value, x, y, size, color, weight = 400, anchor = 'start', family = textFont) => `<text x="${x}" y="${y}" font-family="${escape(family)}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" direction="${/[\u0600-\u06ff]/.test(value) ? 'rtl' : 'ltr'}" unicode-bidi="plaintext">${escape(value)}</text>`;
const rect = (x,y,w,h,color,r=0,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${color}" ${extra}/>`;
const line = (x,y,x2,y2,color,opacity=1) => `<path d="M${x} ${y}H${x2}" stroke="${color}" opacity="${opacity}"/>`;
const wrap = (value, length = 18) => {
  const lines = []; let current = '';
  for (const word of value.split(/\s+/)) {
    if (current && (current + word).length > length) { lines.push(current); current = word; }
    else current += (current ? ' ' : '') + word;
  }
  if (current) lines.push(current);
  return lines;
};
if (selected.some((id) => !projects.some((p) => p.id === id))) throw new Error('Unknown preview project');
const manifest = JSON.parse(await readFile(join(root, 'public/images/previews/ATTRIBUTION.json'), 'utf8')).filter((row) => selected.length && !selected.includes(row.demo));
let credits = JSON.parse(await readFile(join(root, 'public/images/ATTRIBUTION.json'), 'utf8'));
for (const [index, project] of projects.entries()) {
  if (selected.length && !selected.includes(project.id)) continue;
  const { surface: bg, foreground: ink, muted, image: mainImage, layout } = project.visual;
  textFont = layout === 'aesthetic' ? 'Shabnam, sans-serif' : 'Vazirmatn, Noto Sans Arabic, sans-serif';
  const accent = project.accent;
  const document = new JSDOM(await readFile(join(root, `public${project.url}index.html`), 'utf8')).window.document;
  const heading = document.querySelector('main h1');
  heading?.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  const title = heading?.textContent.replace(/\s+/g, ' ').trim() || project.tagline;
  const nav = layout === 'boutique' ? ['همهٔ قشنگی‌ها', 'هدیه‌ها', 'راهنمای خرید'] : [...document.querySelectorAll('.main-nav a')].slice(1,4).map((a) => a.textContent.trim());
  const cta = document.querySelector('main .hero-actions a,main .hero-cta a,main .btn')?.textContent.trim() || project.highlights[0];
  const used = new Set();
  const photo = async (path, x,y,w,h, extra='') => {
    used.add(path);
    const bytes = await sharp(await readFile(join(root, 'public', path))).png().toBuffer();
    return `<image xlink:href="data:image/png;base64,${bytes.toString('base64')}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" ${extra}/>`;
  };
  const titleBlock = (x,y,size=66,max=18,color=ink,weight=500) => wrap(title,max).slice(0,3).map((row,i)=>text(row,x,y+i*size*1.45,size,color,weight)).join('');
  const button = (x,y,label=cta,color=accent,labelColor=bg) => rect(x-252,y,252,58,color,layout==='athletic'?0:6)+text(label,x-26,y+38,22,labelColor,layout==='aesthetic'?500:600);
  const header = rect(72,76,1296,100,bg)+line(110,174,1330,174,accent,.3)
    +(layout === 'aesthetic' ? text('aura',1308,143,52,ink,400,'end','Cormorant Garamond, serif') : text(project.title.split('؛')[0],1308,140,34,ink,600))
    +nav.map((label,i)=>text(label,1000-i*180,137,19,muted)).join('')
    +text(String(index+1).padStart(2,'0'),138,137,18,accent,500,'start');
  let content = '';
  if (layout === 'streetwear') {
    content = await photo(mainImage,72,76,1296,808)
      +text('VECTOR',145,151,37,'#ffffff',800,'start','Arial, sans-serif')
      +text('INDEPENDENT STUDIO',145,175,9,'#ffffff',400,'start','Arial, sans-serif')
      +text('فروشگاه ↗',1290,151,17,'#ffffff')
      +text('01 CORE     /     02 SHELL     /     03 DRIFT',720,773,13,'#e8e8e8',400,'middle','Arial, sans-serif')
      +text('برای شروع، یک لباس انتخاب کنید.',720,820,18,'#ffffff',400,'middle')
      +text('© VECTOR CONCEPT',145,858,10,'#bcbcbc',400,'start','Arial, sans-serif');
  } else if (layout === 'aesthetic') {
    content = `<defs><linearGradient id="aura-chrome"><stop stop-color="#493745"/><stop offset=".18" stop-color="#e9d5da"/><stop offset=".25" stop-color="#79707f"/><stop offset=".5" stop-color="#f6e2dd"/><stop offset=".68" stop-color="#9d6e8d"/><stop offset=".85" stop-color="#edd7dc"/><stop offset="1" stop-color="#4a3b50"/></linearGradient></defs>`
      +await photo(mainImage,72,176,1296,708)
      +rect(72,176,1296,708,'url(#fade)')
      +`<ellipse cx="400" cy="508" rx="224" ry="292" fill="none" stroke="url(#aura-chrome)" stroke-width="11" transform="rotate(-17 400 508)"/>`
      +text('کلینیک پوست و زیبایی اُرا',1290,268,18,muted)
      +text('کلینیک',1290,411,86,ink,600,'start','Estedad, Shabnam, sans-serif')
      +text('زیبایی اُرا',1290,556,86,'#c796aa',600,'start','Estedad, Shabnam, sans-serif')
      +text('بوتاکس · ژل لب · لیزر · پوست',1290,620,20,muted)
      +button(1290,674,'رزرو مشاوره','#ede3dc','#482233')
      +line(110,804,1330,804,accent,.24)
      +text('AURA / BEAUTY STUDY — 01',145,844,12,muted,400,'start')
      +text('خدمات و نوبت مشاوره',1290,844,15,muted);
  } else if (layout === 'boutique') {
    content = rect(110,210,740,560,'#f7e8ee',160)
      +await photo(mainImage,110,210,740,560)
      +text('دنیای کوچک قشنگی‌ها',1290,268,21,muted)
      +titleBlock(1290,366,69,13,ink,500)
      +button(1290,666,cta,ink,'#fff8f4')
      +text('اکسسوری مو · زیورآلات · کیف',1290,793,19,muted)
      +text('THE LITTLE JOYS CLUB',145,837,17,accent,400,'start');
  } else if (layout === 'editorial') {
    content = await photo(mainImage,128,220,490,550)
      +text('خانه‌ی مد و استایل',1280,260,20,muted)
      +titleBlock(1280,366,68,17,ink,300)
      +line(1010,574,1280,574,accent)
      +text(project.highlights[0],1280,624,22,muted)
      +button(1280,672)
      +text('آینه / مجموعه‌های فصلی',1280,808,16,muted)
      +text('STYLE / 01',128,808,16,accent,400,'start');
  } else if (layout === 'athletic') {
    content = await photo(mainImage,110,200,775,605)
      +rect(110,200,775,605,'url(#fade)')
      +`<path d="M840 216L754 784M866 216L780 784" stroke="${accent}" stroke-width="3" opacity=".55"/>`
      +text(project.categoryLabel,1290,270,20,accent,600)
      +titleBlock(1290,380,77,16,ink,800)
      +button(1290,655)
      +text(project.highlights[2],1290,778,21,muted);
  } else if (layout === 'automotive') {
    content = await photo(mainImage,110,305,810,455)
      +rect(110,305,810,455,'url(#fade)')
      +text('نمایشگاه ماشین‌نما',1290,254,19,accent)
      +titleBlock(1290,353,58,19,ink,600)
      +button(1290,640)
      +line(110,795,1330,795,accent,.3)
      +project.highlights.slice(0,3).map((v,i)=>text(v,1280-i*398,844,21,muted)).join('');
  } else if (layout === 'retail') {
    content = rect(120,214,658,560,'#efe6d8',10)
      +await photo(mainImage,146,236,606,516)
      +text('برای خانه و میز کار',1290,280,21,muted)
      +titleBlock(1290,375,63,17,ink,500)
      +button(1290,640,cta,accent,'#211d18')
      +text(project.highlights[0],1290,760,20,muted)
      +line(110,809,1330,809,ink,.15)
      +project.highlights.slice(1,4).map((v,i)=>text(v,1280-i*398,853,20,muted)).join('');
  } else if (layout === 'cafe') {
    content = await photo(mainImage,140,222,510,574,'clip-path="url(#arch)"')
      +`<path d="M128 798V477a267 267 0 0 1 534 0V798" fill="none" stroke="${accent}" stroke-opacity=".35"/>`
      +text('کافه و صبحانه',1290,275,21,accent)
      +titleBlock(1290,387,66,17,ink,400)
      +button(1290,666)
      +text(project.highlights[1],1290,783,21,muted);
  } else if (layout === 'travel') {
    content = await photo(mainImage,110,202,1220,446)
      +rect(110,202,1220,446,'url(#travelFade)')
      +titleBlock(1270,319,70,19,'#fff',400)
      +rect(158,606,1124,132,'#fff',12)
      +text('مقصد سفر',1220,650,16,muted)+text('کجا می‌خواهید بروید؟',1220,697,25,ink)
      +line(765,674,935,674,accent,.4)
      +text('برنامهٔ سفر',875,651,16,muted)+text('تاریخ و تعداد مسافر',875,697,23,ink)
      +button(470,644,cta,accent,'#12303a')
      +text(project.highlights[1],1280,819,20,muted);
  } else if (layout === 'craft') {
    content = `<path d="M126 245H645M126 256H645M126 792H645M126 803H645" stroke="${accent}" opacity=".4"/>`
      +await photo(mainImage,142,278,490,484)
      +text('آموزشگاه هنرهای سنتی',1290,271,21,'#253a80')
      +titleBlock(1290,378,64,18,ink,600)
      +button(1290,655,cta,'#253a80','#fffdf8')
      +text(project.highlights[0],1290,783,20,muted)
      +`<path d="M1300 226l12 12-12 12-12-12zM118 822l12 12-12 12-12-12z" fill="${accent}"/>`;
  } else if (layout === 'festival') {
    const waves = Array.from({length:13},(_,i)=>`<path d="M120 ${370+i*24}Q430 ${150+i*34} 755 ${440+i*16}" fill="none" stroke="${i%2?accent:'#21e5ff'}" stroke-opacity=".4"/>`).join('');
    content = await photo(mainImage,110,210,765,592)
      +rect(110,210,765,592,'url(#fade)')+waves
      +text('موسیقی / هنر دیجیتال',1290,269,20,'#21e5ff')
      +titleBlock(1290,378,84,13,ink,800)
      +button(1290,684,cta,accent,'#06050b')
      +text(project.highlights[1],1290,813,20,muted);
  } else {
    content = text('تابلوی نرخ‌های نمایشی',1290,258,19,accent)
      +titleBlock(1290,355,64,19,ink,500)
      +await photo(mainImage,122,224,465,345,'clip-path="url(#round)"')
      +rect(122,591,525,214,'#161108',10)
      +text('طلا · سکه · ارز',608,640,21,accent)
      +`<path d="M150 757L191 730 232 747 273 700 314 723 355 677 396 706 437 666 478 688 519 646 560 659 612 627" fill="none" stroke="${accent}" stroke-width="3"/>`
      +button(1290,593,cta,accent,'#1b1204')
      +project.highlights.slice(0,2).map((v,i)=>text(v,1290,735+i*52,20,muted)).join('');
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1440" height="960" viewBox="0 0 1440 960">
    <defs>
      <radialGradient id="halo"><stop stop-color="${accent}" stop-opacity=".22"/><stop offset="1" stop-color="#040b0b"/></radialGradient>
      <linearGradient id="fade"><stop stop-color="${bg}" stop-opacity="0"/><stop offset=".58" stop-color="${bg}" stop-opacity=".18"/><stop offset="1" stop-color="${bg}"/></linearGradient>
      <linearGradient id="travelFade"><stop stop-color="#12303a" stop-opacity=".05"/><stop offset="1" stop-color="#12303a" stop-opacity=".85"/></linearGradient>
      <clipPath id="arch"><path d="M140 796V477a255 255 0 0 1 510 0V796z"/></clipPath>
      <clipPath id="round">${rect(122,224,465,345,'#fff',16)}</clipPath>
      <clipPath id="board">${rect(72,76,1296,808,'#fff',16)}</clipPath>
    </defs>
    ${rect(0,0,1440,960,'#040b0b')}${rect(0,0,1440,960,'url(#halo)')}
    ${rect(65,69,1310,822,'none',22,`stroke="${accent}" stroke-opacity=".25"`)}
    <g clip-path="url(#board)">${rect(72,76,1296,808,bg)}${header}${content}</g>
    ${text(project.categoryLabel,1360,930,17,'#99aaa5')}
    <text x="80" y="930" fill="#99aaa5" font-size="14" font-family="sans-serif" letter-spacing="2">PERSIANBOTYAR / SELECTED WORK</text>
  </svg>`;
  const output = `public/images/previews/${project.id}.webp`;
  const bytes = await sharp(Buffer.from(svg)).resize(1200,800).webp({ quality: 90 }).toBuffer();
  await writeFile(join(root,output),bytes);
  const upstream = JSON.parse(await readFile(join(root, `public${project.url}assets/ATTRIBUTION.json`),'utf8'));
  const sources = [...used].map((path) => ({ path, ...upstream.find((row) => basename(row.file) === basename(path)) }));
  const row = { out:output,file:`${project.id}.webp`,demo:project.id,title:`طرح گرافیکی رابط ${project.title.split('؛')[0]}`,artist:`persianbotyar (layout); ${[...new Set(sources.map(s=>s.artist))].join('; ')}`,license:[...new Set(sources.map(s=>s.license).filter(Boolean))].join(' / ') || undefined,source:sources[0]?.source,origin:sources.every((s)=>s.origin==='generated')?'generated':sources.every((s)=>s.origin==='rendered')?'rendered':sources.every((s)=>s.origin==='original')?'original':undefined,derivedFrom:[...used].map(path=>`public${path}`),sources,width:1200,height:800,bytes:bytes.length,format:'webp',generator:'scripts/generate-previews.mjs' };
  credits = credits.filter((item)=>item.out!==output); credits.push(row); manifest.push(row);
  console.log(`${project.id}: ${Math.round(bytes.length/1024)} KB`);
  document.defaultView.close();
}
credits.sort((a,b)=>a.out.localeCompare(b.out));
await writeFile(join(root,'public/images/ATTRIBUTION.json'),JSON.stringify(credits,null,2)+'\n');
await writeFile(join(root,'public/images/previews/ATTRIBUTION.json'),JSON.stringify(manifest,null,2)+'\n');
