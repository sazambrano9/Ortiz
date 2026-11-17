import {db,response,fail,assert,originGuard,method,normalize,validUsername,validPassword,hashPassword,requireUser,requireAdmin,randomUUID} from '../lib/core.js';
export default async function handler(req,res){try{
 if(!method(req,res,['POST']))return;originGuard(req);const admin=await requireUser(req);requireAdmin(admin);
 const {memberId,username,password}=req.body||{};const name=normalize(username);
 assert(typeof memberId==='string'&&memberId.length<=80&&memberId!=='member1','Familiar inválido');assert(validUsername(name)&&name!=='szambrano','Nombre de usuario inválido');assert(validPassword(password),'La contraseña debe tener entre 12 y 128 caracteres');
 const {rows}=await db().query('SELECT data FROM households WHERE id=$1',[admin.household_id]);assert(rows[0]?.data?.members?.some(m=>m.id===memberId&&normalize(m.username)===name),'Primero guarda el familiar y sincroniza sus datos',409);
 const old=await db().query('SELECT id FROM users WHERE household_id=$1 AND member_id=$2',[admin.household_id,memberId]);
 const hash=await hashPassword(password);
 if(old.rows.length){
  await db().query('UPDATE users SET username=$1,password_hash=$2 WHERE id=$3',[name,hash,old.rows[0].id]);await db().query('DELETE FROM sessions WHERE user_id=$1',[old.rows[0].id]);return response(res,200,{ok:true,operation:'reset'})
 }
 await db().query('INSERT INTO users(id,household_id,member_id,username,password_hash,role) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),admin.household_id,memberId,name,hash,'member']);return response(res,200,{ok:true,operation:'created'});
}catch(e){if(e.code==='23505')return response(res,409,{error:'Ese nombre de usuario ya está ocupado'});fail(res,e)}}
