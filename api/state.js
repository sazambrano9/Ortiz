import {db,response,fail,method,originGuard,requireUser,cleanData,assert} from '../lib/core.js';
export default async function handler(req,res){try{
 if(!method(req,res,['GET','PUT']))return;const user=await requireUser(req);
 if(req.method==='GET'){
  const {rows}=await db().query('SELECT data,revision,updated_at FROM households WHERE id=$1',[user.household_id]);assert(rows.length,'Hogar no encontrado',404);return response(res,200,{data:rows[0].data,revision:Number(rows[0].revision),updatedAt:rows[0].updated_at})
 }
 originGuard(req);const {data,revision}=req.body||{};assert(Number.isSafeInteger(revision)&&revision>=0,'Revisión de sincronización inválida');const cleaned=cleanData(data);
 // Comparación optimista: un dispositivo viejo NO pisa los cambios de otro.
 const {rows}=await db().query('UPDATE households SET data=$1::jsonb,revision=revision+1,updated_at=now() WHERE id=$2 AND revision=$3 RETURNING revision',[JSON.stringify(cleaned),user.household_id,revision]);
 if(!rows.length)return response(res,409,{error:'Otro dispositivo modificó el hogar. Exporta un respaldo local antes de recuperar los datos del servidor.',code:'CONFLICT'});
 return response(res,200,{revision:Number(rows[0].revision)})
}catch(e){fail(res,e)}}
