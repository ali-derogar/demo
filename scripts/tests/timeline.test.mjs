import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { source, environment } from './helpers.mjs';

async function app(t,options={}) {
  const env=await environment({hash:'#demos',...options});
  const {default:App}=await source('src/App.tsx');
  const root=createRoot(env.q('#root'));
  env.action=async(fn)=>act(async()=>{await fn();await env.settle();});
  t.after(async()=>{try{await env.action(()=>root.unmount());assert.deepEqual(env.errors,[]);}finally{env.cleanup();}});
  await env.action(()=>root.render(React.createElement(React.StrictMode,null,React.createElement(App))));
  await env.action(()=>{});
  env.at=async(unit)=>env.action(()=>env.w.scrollTo({top:env.workTop+unit*env.q('.im-work--orbit').offsetHeight}));
  env.progress=()=>Number(env.q('.im-project')?.style.getPropertyValue('--project-progress')||0);
  return env;
}

for(const width of [390,768,1440]) {
  test(`automatic presentations reverse, stop, return and advance without history or focus changes / ${width}`,async(t)=>{
    const env=await app(t,{width});
    const entries=history.length,hash=location.hash;
    const focus=env.q('a[href="#contact"]');focus.focus();
    await env.at(.15);assert.ok(Math.abs(env.progress()-.5)<1e-10);
    assert.equal(document.activeElement,focus,'scrolling never steals keyboard focus');
    assert.equal(document.body.style.overflow,'');assert.equal(env.q('#im-main').hasAttribute('inert'),false);
    await env.action(()=>env.advance(2000));assert.ok(Math.abs(env.progress()-.5)<1e-10);
    await env.at(.075);assert.ok(Math.abs(env.progress()-.25)<1e-10);
    await env.at(.4);assert.equal(env.q('.im-project').dataset.phase,'open');
    await env.at(.65);assert.ok(Math.abs(env.progress()-.5)<1e-10);
    await env.at(.4);assert.equal(env.progress(),1,'reversing the exit reopens the same pane');
    await env.at(0);assert.equal(env.q('.im-project'),null);
    await env.at(1.6);assert.equal(env.q('.im-project').dataset.project,'sports');
    assert.equal(env.q('.im-project__actions a').getAttribute('href'),'/demos/sports/');
    assert.equal(history.length,entries);assert.equal(location.hash,hash);
    await env.action(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
    assert.equal(env.q('.im-project'),null);assert.ok(Math.abs(env.scroll-env.workTop-1.2*env.q('.im-work--orbit').offsetHeight)<1e-8);
  });
}

test('horizontal wheel and axis-locked drags control the same native scroll position without release momentum',async(t)=>{
  const env=await app(t);await env.at(.4);
  let stamp=1000;
  const wheel=(x,y=0)=>{const event=new env.w.WheelEvent('wheel',{deltaX:x,deltaY:y,bubbles:true,cancelable:true});Object.defineProperty(event,'timeStamp',{value:stamp+=200});document.body.dispatchEvent(event);return event;};
  const initial=env.scroll;let forward;
  await env.action(()=>{forward=wheel(70);});assert.equal(forward.defaultPrevented,true);assert.equal(env.scroll,initial+70);
  await env.action(()=>env.advance(200));
  await env.action(()=>wheel(-70));assert.equal(env.scroll,initial);
  await env.action(()=>env.advance(200));
  let vertical;await env.action(()=>{vertical=wheel(4,60);});assert.equal(vertical.defaultPrevented,false);
  const stage=env.q('.im-orbit__stage');
  const pointer=(type,x,y)=>{const event=new MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,buttons:type==='pointerup'?0:1,button:0});Object.defineProperties(event,{pointerId:{value:17},pointerType:{value:'touch'}});stage.dispatchEvent(event);return event;};
  await env.action(()=>{pointer('pointerdown',180,300);pointer('pointermove',250,302);pointer('pointerup',250,302);});
  const released=env.scroll;assert.ok(released>initial,'rightward drag advances');
  await env.action(()=>env.advance(1000));assert.equal(env.scroll,released,'release does not snap or add momentum');
  await env.action(()=>{pointer('pointerdown',250,300);pointer('pointermove',180,302);pointer('pointerup',180,302);});
  assert.ok(Math.abs(env.scroll-initial)<1e-8,'leftward drag goes back');
  await env.action(()=>{pointer('pointerdown',180,300);pointer('pointermove',183,350);pointer('pointermove',280,351);pointer('pointercancel',280,351);});
  assert.ok(Math.abs(env.scroll-initial)<1e-8,'a gesture locked vertically cannot switch to horizontal');
});

test('toolbar changes retain progress; orientation retains the same normalized timeline coordinate',async(t)=>{
  const env=await app(t);await env.at(2.55);
  const progress=env.progress(),y=env.scroll,height=env.q('.im-work-track').style.height;
  await env.action(()=>env.setViewport(390,924,true));
  assert.equal(env.scroll,y);assert.equal(env.progress(),progress);assert.equal(env.q('.im-work-track').style.height,height);
  await env.action(()=>env.setViewport(844,390));
  assert.ok(Math.abs((env.scroll-env.workTop)/390-2.55)<1e-10);
  assert.ok(Math.abs(env.progress()-progress)<1e-10);assert.equal(env.q('.im-project').dataset.project,'cars');
});

test('nested information panels freeze and restore a partially open project, then release the only scroll lock',async(t)=>{
  const env=await app(t);await env.at(.4);
  await env.action(()=>env.q('.im-orbit__stage').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));
  await env.at(.15);const y=env.scroll,progress=env.progress();
  await env.action(()=>env.q('a[href="#contact"]').click());
  assert.equal(document.body.style.overflow,'hidden');
  await env.action(()=>env.advance(500));assert.equal(env.progress(),progress);
  await env.action(()=>env.q('.im-info-panel__close').click());
  assert.equal(document.body.style.overflow,'');assert.equal(env.scroll,y);assert.equal(env.progress(),progress);
});

test('click return and browser Forward keep project/filter coordinates across orientation',async(t)=>{
  const env=await app(t);await env.at(2.4);
  const stage=env.q('.im-orbit__stage');stage.focus();
  await env.action(()=>stage.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));
  assert.equal(env.q('.im-project').dataset.project,'cars');
  await env.action(()=>env.setViewport(844,390));
  await env.action(()=>env.q('.im-project__actions button').click());
  assert.ok(Math.abs((env.scroll-env.workTop)/390-2.4)<1e-10);
  assert.equal(env.q('.im-project'),null);
  await env.action(()=>history.forward());
  assert.equal(env.q('.im-project').dataset.project,'cars');assert.equal(env.q('.im-project').dataset.phase,'open');
});
