import pg from 'pg';
import { randomUUID, randomBytes, scrypt as _scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt=promisify(_scrypt);
let pool;
export const db=()=>{
 if(!process.env.DATABASE_URL)throw Object.assign(new Error('DATABASE_URL no configurada en Vercel'),{status:503});
 if(!pool)pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:7000,idleTimeoutMillis:5000,ssl:{rejectUnauthorized:true}});
 return pool;
};
export {randomUUID};
export function response(res,status,value){res.status(status).setHeader('Cache-Control','no-store').json(value)}
export const fail=(res,e)=>{console.error(e);response(res,e.status||500,{error:e.status?e.message:'Error del servidor. Revisa la configuración y los registros.'})};
export const assert=(ok,message,status=400)=>{if(!ok)throw Object.assign(new Error(message),{status})};
export function originGuard(req){
 const origin=req.headers.origin; const host=req.headers['x-forwarded-host']||req.headers.host;
 if(origin){const u=new URL(origin);assert(u.host===host && u.protocol==='https:' || (u.hostname==='localhost'&&host?.startsWith('localhost')), 'Origen no autorizado',403)}
 const site=req.headers['sec-fetch-site'];assert(!site||site==='same-origin'||site==='none','Solicitud entre sitios no permitida',403);
}
export function method(req,res,allowed){if(!allowed.includes(req.method)){res.setHeader('Allow',allowed.join(', '));response(res,405,{error:'Método no permitido'});return false}return true}
export const normalize=s=>String(s||'').trim().toLowerCase();
export function validUsername(s){return /^[a-z0-9._-]{3,40}$/.test(s)}
export function validPassword(s){return typeof s==='string'&&s.length>=12&&s.length<=128}
export async function hashPassword(password){const salt=randomBytes(16);const key=await scrypt(password,salt,64);return `${salt.toString('hex')}:${key.toString('hex')}`}
export async function passwordOK(p,stored){try{const [salt,hex]=stored.split(':');const key=await scrypt(p,Buffer.from(salt,'hex'),64);const old=Buffer.from(hex,'hex');return old.length===key.length&&timingSafeEqual(old,key)}catch{return false}}
const sha=s=>createHash('sha256').update(s).digest('hex');
const cookieName='hogar_session';
export async function loginSession(res,userId){const token=randomBytes(32).toString('base64url');await db().query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval \'14 days\')',[sha(token),userId]);res.setHeader('Set-Cookie',`${cookieName}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=1209600`)}
export async function logoutSession(req,res){const token=readCookie(req);if(token)await db().query('DELETE FROM sessions WHERE token_hash=$1',[sha(token)]);res.setHeader('Set-Cookie',`${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`)}
function readCookie(req){return (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1)}
export async function requireUser(req){const t=readCookie(req);assert(t,'Sesión no iniciada',401);const {rows}=await db().query(`SELECT u.id,u.username,u.member_id,u.role,u.household_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()`,[sha(t)]);assert(rows.length,'Sesión vencida. Inicia sesión nuevamente.',401);return rows[0]}
export function requireAdmin(u){assert(u.role==='admin','Solo el administrador puede realizar esta acción',403)}
export function cleanData(data){
 assert(data&&typeof data==='object'&&data.version===1,'Formato no válido');
 for(const k of ['members','accounts','movements','budgets','recurring','transfers','categories'])assert(Array.isArray(data[k])&&data[k].length<=15000,`Datos inválidos: ${k}`);
 assert(JSON.stringify(data).length<2_000_000,'Respaldo demasiado grande (máx. 2 MB)',413);
 const clean={version:1};for(const k of ['members','accounts','movements','budgets','recurring','transfers','categories'])clean[k]=data[k];
 // La contraseña local nunca se envía a la base de datos compartida.
 clean.members=clean.members.map(({password,...m})=>m);
 return clean;
}
