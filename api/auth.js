import { db,response,fail,assert,originGuard,method,normalize,validUsername,validPassword,hashPassword,passwordOK,loginSession,logoutSession,requireUser,randomUUID } from '../lib/core.js';
const empty=()=>({version:1,members:[{id:'member1',name:'Principal',username:'szambrano'}],accounts:[{id:'cash',name:'Efectivo',type:'cash',opening:0},{id:'bank',name:'Banco / transferencias',type:'bank',opening:0},{id:'credit',name:'Tarjeta de crédito',type:'credit',opening:0}],movements:[],budgets:[],recurring:[],transfers:[],categories:[['food','🍔','Alimentación'],['transport','🚗','Transporte'],['shopping','🛍️','Compras'],['home','🏠','Hogar'],['services','💡','Servicios'],['health','💊','Salud'],['education','📚','Educación'],['fun','🎬','Entretenimiento'],['other','📦','Otros']]});
export default async function handler(req,res){try{
 res.setHeader('Cache-Control','no-store');const action=req.query.action;
 if(action==='status'){if(!method(req,res,['GET']))return;const r=await db().query('SELECT COUNT(*)::int AS n FROM users');return response(res,200,{setupRequired:r.rows[0].n===0})}
 if(action==='me'){if(!method(req,res,['GET']))return;const user=await requireUser(req);return response(res,200,{user:{username:user.username,role:user.role,memberId:user.member_id}})}
 if(!method(req,res,['POST']))return;originGuard(req);
 if(action==='setup'){
  const {token,password}=req.body||{};assert(process.env.ADMIN_SETUP_TOKEN&&process.env.ADMIN_SETUP_TOKEN.length>=24,'ADMIN_SETUP_TOKEN no configurado o es demasiado corto',503);
  assert(token===process.env.ADMIN_SETUP_TOKEN,'Código de instalación incorrecto',403);assert(validPassword(password),'Contraseña: entre 12 y 128 caracteres');
  const client=await db().connect();try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(92377421)');const result=await client.query('SELECT COUNT(*)::int AS n FROM users');assert(result.rows[0].n===0,'La cuenta principal ya fue configurada',409);
  const householdId=randomUUID(),userId=randomUUID();await client.query('INSERT INTO households(id,name,data) VALUES($1,$2,$3::jsonb)',[householdId,'Mi hogar',JSON.stringify(empty())]);await client.query('INSERT INTO users(id,household_id,member_id,username,password_hash,role) VALUES($1,$2,$3,$4,$5,$6)',[userId,householdId,'member1','szambrano',await hashPassword(password),'admin']);await client.query('COMMIT');await loginSession(res,userId);return response(res,200,{user:{username:'szambrano',role:'admin',memberId:'member1'}})}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
 }
 if(action==='login'){
  const username=normalize(req.body?.username),password=req.body?.password;assert(validUsername(username)&&typeof password==='string','Credenciales incorrectas',401);
  const attempts=await db().query('SELECT failures,blocked_until FROM login_attempts WHERE username=$1',[username]);if(attempts.rows[0]?.blocked_until && new Date(attempts.rows[0].blocked_until)>new Date())return response(res,429,{error:'Demasiados intentos. Vuelve a intentarlo más tarde.'});
  const {rows}=await db().query('SELECT id,username,password_hash,role,member_id FROM users WHERE username=$1',[username]);const ok=rows.length && await passwordOK(password,rows[0].password_hash);
  if(!ok){await db().query(`INSERT INTO login_attempts(username,failures,blocked_until,last_attempt) VALUES($1,1,NULL,now()) ON CONFLICT(username) DO UPDATE SET failures=CASE WHEN login_attempts.last_attempt<now()-interval '15 minutes' THEN 1 ELSE login_attempts.failures+1 END, blocked_until=CASE WHEN login_attempts.last_attempt>=now()-interval '15 minutes' AND login_attempts.failures>=4 THEN now()+interval '15 minutes' ELSE NULL END,last_attempt=now()`,[username]);return response(res,401,{error:'Usuario o contraseña incorrectos'})}
  await db().query('DELETE FROM login_attempts WHERE username=$1',[username]);await loginSession(res,rows[0].id);return response(res,200,{user:{username:rows[0].username,role:rows[0].role,memberId:rows[0].member_id}})
 }
 if(action==='logout'){await logoutSession(req,res);return response(res,200,{ok:true})}
 return response(res,404,{error:'Acción desconocida'});
}catch(e){fail(res,e)}}
