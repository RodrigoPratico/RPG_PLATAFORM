import {createController} from './controller.js';
import {chapterView} from './view.js';
import {$,download} from '../../shared/ui.js';
export function createChaptersFeature(ctx) {
 const api=createController(ctx);
 return {id:'chapters',routes:[{id:'capitulos',label:'Capítulos',icon:'book',badge:c=>c.chapters.length,render:()=>chapterView(ctx.campaign(),ctx.ui.chapterId)}],
  actions:{'new-chapter':()=>api.editChapter()},commands:{editChapter:api.editChapter,
   chapter:id=>{if($('#editor').open&&ctx.closeDialog()===false)return;ctx.ui.chapterId=id;ctx.navigate('capitulos');ctx.render();},
   exportChapter:id=>{const ch=ctx.campaign().chapters.find(v=>v.id===id);download(new Blob([`# ${ch.title}\n\n${ch.period} · ${ch.status}\n\n${ch.body}\n`],{type:'text/markdown;charset=utf-8'}),'capitulo.md');}}
 };
}
